import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, resolve, sep } from "node:path";
import pg from "pg";

const { Pool } = pg;
const ROOT        = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR  = join(ROOT, "public");
const PORT        = Number(process.env.PORT || 3000);
const SESSION_DAYS    = 7;
const MAX_BODY_BYTES  = 1_000_000;
const MIME_TYPES = {
  ".css":  "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".svg":  "image/svg+xml"
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/smart_consumer",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// ─── Database Init (tối ưu: bỏ ALTER TABLE dư thừa, thêm indexes) ─────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      VARCHAR(255) NOT NULL UNIQUE,
      display_name  VARCHAR(255) NOT NULL,
      role          VARCHAR(50)  NOT NULL CHECK (role IN ('teacher', 'student', 'guest')),
      password_hash TEXT         NOT NULL,
      password_salt TEXT         NOT NULL,
      created_at    TEXT         NOT NULL,
      updated_at    TEXT         NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash   TEXT    NOT NULL UNIQUE,
      expires_at   TEXT    NOT NULL,
      created_at   TEXT    NOT NULL,
      last_seen_at TEXT    NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_token_idx   ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS sessions_user_idx    ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS learning_state (
      user_id            INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      active_step        INTEGER NOT NULL DEFAULT 0 CHECK (active_step BETWEEN 0 AND 5),
      completed_json     TEXT    NOT NULL DEFAULT '[]',
      ad_set_json        TEXT    NOT NULL DEFAULT '[]',
      sit_set_json       TEXT    NOT NULL DEFAULT '[]',
      ad_position        INTEGER NOT NULL DEFAULT 0 CHECK (ad_position BETWEEN 0 AND 5),
      sit_position       INTEGER NOT NULL DEFAULT 0 CHECK (sit_position BETWEEN 0 AND 5),
      journal_reflection TEXT    NOT NULL DEFAULT '',
      updated_at         TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teacher_feedbacks (
      student_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_type  VARCHAR(50) NOT NULL,
      question_index INTEGER     NOT NULL,
      status         VARCHAR(50) NOT NULL DEFAULT 'Đạt',
      comment        TEXT        NOT NULL DEFAULT '',
      rubric         TEXT        NOT NULL DEFAULT '',
      updated_at     TEXT        NOT NULL,
      PRIMARY KEY (student_id, activity_type, question_index)
    );
    CREATE INDEX IF NOT EXISTS feedbacks_student_idx ON teacher_feedbacks(student_id);

    CREATE TABLE IF NOT EXISTS activity_responses (
      user_id        INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_type  VARCHAR(50) NOT NULL CHECK (activity_type IN ('ad', 'situation')),
      question_index INTEGER     NOT NULL CHECK (question_index BETWEEN 0 AND 9),
      response       TEXT        NOT NULL,
      updated_at     TEXT        NOT NULL,
      PRIMARY KEY (user_id, activity_type, question_index)
    );
    CREATE INDEX IF NOT EXISTS responses_user_idx ON activity_responses(user_id);

    CREATE TABLE IF NOT EXISTS expense_entries (
      id             SERIAL  PRIMARY KEY,
      user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day_index      INTEGER NOT NULL CHECK (day_index BETWEEN 0 AND 6),
      entry_position INTEGER NOT NULL,
      item           TEXT    NOT NULL DEFAULT '',
      amount         INTEGER NOT NULL DEFAULT 0 CHECK (amount BETWEEN 0 AND 1000000000),
      category       VARCHAR(50) NOT NULL CHECK (category IN ('Nhu cầu', 'Mong muốn')),
      note           TEXT    NOT NULL DEFAULT '',
      created_at     TEXT    NOT NULL,
      updated_at     TEXT    NOT NULL
    );
    CREATE INDEX IF NOT EXISTS expenses_user_day_idx ON expense_entries(user_id, day_index, entry_position);
    CREATE INDEX IF NOT EXISTS expenses_user_idx     ON expense_entries(user_id);
  `);
}
initDB().catch(err => console.error("Database Init Error:", err));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const blankExpense  = () => ({ item: "", amount: "", kind: "Nhu cầu", note: "" });
const defaultJournal = () => Array.from({ length: 7 }, () => [blankExpense()]);
const now       = () => new Date().toISOString();
const hashToken = token => createHash("sha256").update(token).digest("hex");
const publicUser = user => ({ id: user.id, username: user.username, displayName: user.display_name, role: user.role });

function json(response, status, body, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...headers
  });
  response.end(JSON.stringify(body));
}

function message(response, status, error) {
  json(response, status, { error });
}

function parseCookies(request) {
  return Object.fromEntries((request.headers.cookie || "").split(";").map(part => {
    const index = part.indexOf("=");
    return index < 0 ? [] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }).filter(pair => pair.length));
}

function sessionCookie(token, clear = false) {
  const age = clear ? 0 : SESSION_DAYS * 24 * 60 * 60;
  return `sc_session=${clear ? "" : encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}`;
}

function passwordRecord(password) {
  const salt = randomBytes(16).toString("base64");
  return { salt, hash: scryptSync(password, salt, 64).toString("base64") };
}

function validPassword(password) {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}

function verifyPassword(password, user) {
  if (!validPassword(password)) return false;
  const actual   = Buffer.from(user.password_hash, "base64");
  const expected = scryptSync(password, user.password_salt, 64);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function cleanAccount(data) {
  const username    = String(data?.username || "").trim().toLowerCase();
  const displayName = String(data?.displayName || "").trim().replace(/\s+/g, " ");
  const password    = data?.password;
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new Error("Tên đăng nhập gồm 3–40 ký tự: chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang.");
  if (displayName.length < 2 || displayName.length > 80) throw new Error("Họ tên hoặc tên hiển thị cần từ 2 đến 80 ký tự.");
  if (!validPassword(password)) throw new Error("Mật khẩu cần từ 8 đến 128 ký tự.");
  return { username, displayName, password };
}

function numberInRange(value, minimum, maximum, fallback = minimum) {
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum && number <= maximum ? number : fallback;
}

function parseJson(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

function questionSet(value) {
  if (!Array.isArray(value)) return [];
  return value.map(item => numberInRange(item, 0, 9, -1)).filter(item => item >= 0).slice(0, 5);
}

function responses(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result = {};
  for (const [key, answer] of Object.entries(value)) {
    const questionIndex = numberInRange(key, 0, 9, -1);
    const text = String(answer ?? "").trim().slice(0, 3000);
    if (questionIndex >= 0 && text) result[questionIndex] = text;
  }
  return result;
}

function journal(value) {
  const result = defaultJournal();
  if (!Array.isArray(value)) return result;
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const entries = Array.isArray(value[dayIndex]) ? value[dayIndex] : [];
    const cleaned = entries.slice(0, 40).map(entry => ({
      item:   String(entry?.item   ?? "").trim().slice(0, 160),
      amount: numberInRange(entry?.amount, 0, 1000000000, 0),
      kind:   entry?.kind === "Mong muốn" ? "Mong muốn" : "Nhu cầu",
      note:   String(entry?.note   ?? "").trim().slice(0, 600)
    }));
    result[dayIndex] = cleaned.length ? cleaned : [blankExpense()];
  }
  return result;
}

function cleanLearningState(value) {
  const raw       = value && typeof value === "object" ? value : {};
  const completed = Array.isArray(raw.completed)
    ? [...new Set(raw.completed.map(step => numberInRange(step, 0, 5, -1)).filter(step => step >= 0))]
    : [];
  return {
    active:            numberInRange(raw.active, 0, 5),
    completed,
    adSet:             questionSet(raw.adSet),
    sitSet:            questionSet(raw.sitSet),
    adPosition:        numberInRange(raw.adPosition, 0, 5),
    sitPosition:       numberInRange(raw.sitPosition, 0, 5),
    adResponses:       responses(raw.adResponses),
    sitResponses:      responses(raw.sitResponses),
    journal:           journal(raw.journal),
    journalReflection: String(raw.journalReflection ?? "").trim().slice(0, 1000)
  };
}

// ─── Session ──────────────────────────────────────────────────────────────────
async function createSession(userId) {
  const token     = randomBytes(32).toString("base64url");
  const createdAt = now();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await pool.query(
    "INSERT INTO sessions (user_id, token_hash, expires_at, created_at, last_seen_at) VALUES ($1, $2, $3, $4, $5)",
    [userId, hashToken(token), expiresAt, createdAt, createdAt]
  );
  return token;
}

async function currentUser(request) {
  const token = parseCookies(request).sc_session;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const result = await pool.query(`
    SELECT u.id, u.username, u.display_name, u.role
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = $1 AND s.expires_at > $2
  `, [tokenHash, now()]);
  const user = result.rows[0];
  if (!user) return null;
  await pool.query("UPDATE sessions SET last_seen_at = $1 WHERE token_hash = $2", [now(), tokenHash]);
  return user;
}

async function requireUser(request, response) {
  const user = await currentUser(request);
  if (!user) { message(response, 401, "Vui lòng đăng nhập để tiếp tục."); return null; }
  return user;
}

// ─── Learning State ───────────────────────────────────────────────────────────
async function getLearningState(userId) {
  const saved = (await pool.query("SELECT * FROM learning_state WHERE user_id = $1", [userId])).rows[0];
  if (!saved) return null;
  const state = {
    active:            saved.active_step,
    completed:         parseJson(saved.completed_json, []),
    adSet:             parseJson(saved.ad_set_json, []),
    sitSet:            parseJson(saved.sit_set_json, []),
    adPosition:        saved.ad_position,
    sitPosition:       saved.sit_position,
    adResponses:       {},
    sitResponses:      {},
    journal:           defaultJournal(),
    journalReflection: saved.journal_reflection || "",
    feedbacks:         {}
  };

  const answers = (await pool.query(
    "SELECT activity_type, question_index, response FROM activity_responses WHERE user_id = $1",
    [userId]
  )).rows;
  for (const a of answers) state[a.activity_type === "ad" ? "adResponses" : "sitResponses"][a.question_index] = a.response;

  const feedbacks = (await pool.query(
    "SELECT activity_type, question_index, status, comment, rubric FROM teacher_feedbacks WHERE student_id = $1",
    [userId]
  )).rows;
  for (const f of feedbacks) {
    state.feedbacks[`${f.activity_type}_${f.question_index}`] = { status: f.status, comment: f.comment, rubric: f.rubric };
  }

  const expenses = (await pool.query(
    "SELECT day_index, item, amount, category, note FROM expense_entries WHERE user_id = $1 ORDER BY day_index, entry_position",
    [userId]
  )).rows;
  const journalEntries = Array.from({ length: 7 }, () => []);
  for (const e of expenses) journalEntries[e.day_index].push({ item: e.item, amount: String(e.amount || ""), kind: e.category, note: e.note });
  state.journal = journalEntries.map(entries => entries.length ? entries : [blankExpense()]);

  return cleanLearningState(state);
}

async function saveLearningState(userId, rawState) {
  const state     = cleanLearningState(rawState);
  const updatedAt = now();
  const client    = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      INSERT INTO learning_state (user_id, active_step, completed_json, ad_set_json, sit_set_json, ad_position, sit_position, journal_reflection, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT(user_id) DO UPDATE SET
        active_step        = EXCLUDED.active_step,
        completed_json     = EXCLUDED.completed_json,
        ad_set_json        = EXCLUDED.ad_set_json,
        sit_set_json       = EXCLUDED.sit_set_json,
        ad_position        = EXCLUDED.ad_position,
        sit_position       = EXCLUDED.sit_position,
        journal_reflection = EXCLUDED.journal_reflection,
        updated_at         = EXCLUDED.updated_at
    `, [userId, state.active, JSON.stringify(state.completed), JSON.stringify(state.adSet),
        JSON.stringify(state.sitSet), state.adPosition, state.sitPosition, state.journalReflection, updatedAt]);

    await client.query("DELETE FROM activity_responses WHERE user_id = $1", [userId]);
    for (const [qi, ans] of Object.entries(state.adResponses)) {
      await client.query("INSERT INTO activity_responses (user_id, activity_type, question_index, response, updated_at) VALUES ($1, $2, $3, $4, $5)",
        [userId, "ad", Number(qi), ans, updatedAt]);
    }
    for (const [qi, ans] of Object.entries(state.sitResponses)) {
      await client.query("INSERT INTO activity_responses (user_id, activity_type, question_index, response, updated_at) VALUES ($1, $2, $3, $4, $5)",
        [userId, "situation", Number(qi), ans, updatedAt]);
    }

    await client.query("DELETE FROM expense_entries WHERE user_id = $1", [userId]);
    for (let dayIndex = 0; dayIndex < state.journal.length; dayIndex++) {
      const entries = state.journal[dayIndex];
      for (let pos = 0; pos < entries.length; pos++) {
        const e = entries[pos];
        if (e.item || Number(e.amount) || e.note) {
          await client.query(
            "INSERT INTO expense_entries (user_id, day_index, entry_position, item, amount, category, note, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
            [userId, dayIndex, pos, e.item, Number(e.amount) || 0, e.kind, e.note, updatedAt, updatedAt]
          );
        }
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return state;
}

// ─── Utilities ────────────────────────────────────────────────────────────────
async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) throw new Error("Dữ liệu gửi lên quá lớn.");
  }
  try { return body ? JSON.parse(body) : {}; } catch { throw new Error("Dữ liệu gửi lên không hợp lệ."); }
}

async function teacherRequired(request, response) {
  const user = await requireUser(request, response);
  if (!user) return null;
  if (user.role !== "teacher") { message(response, 403, "Chỉ giáo viên mới có quyền xem bài làm của học sinh."); return null; }
  return user;
}

// ─── API Router ───────────────────────────────────────────────────────────────
async function handleApi(request, response, url) {
  const { pathname } = url;

  if (pathname === "/api/setup/status" && request.method === "GET") {
    const teacher = (await pool.query("SELECT 1 FROM users WHERE role = 'teacher' LIMIT 1")).rows[0];
    return json(response, 200, { teacherExists: Boolean(teacher) });
  }
  if (pathname === "/api/setup/teacher" && request.method === "POST") {
    if ((await pool.query("SELECT 1 FROM users WHERE role = 'teacher' LIMIT 1")).rows[0]) return message(response, 409, "Tài khoản giáo viên đầu tiên đã được thiết lập.");
    const account  = cleanAccount(await readJson(request));
    if ((await pool.query("SELECT 1 FROM users WHERE username = $1", [account.username])).rows[0]) return message(response, 409, "Tên đăng nhập đã được sử dụng.");
    const pw        = passwordRecord(account.password);
    const createdAt = now();
    const result    = await pool.query(
      "INSERT INTO users (username, display_name, role, password_hash, password_salt, created_at, updated_at) VALUES ($1, $2, 'teacher', $3, $4, $5, $6) RETURNING id",
      [account.username, account.displayName, pw.hash, pw.salt, createdAt, createdAt]
    );
    const user  = (await pool.query("SELECT id, username, display_name, role FROM users WHERE id = $1", [result.rows[0].id])).rows[0];
    const token = await createSession(user.id);
    return json(response, 201, { user: publicUser(user) }, { "Set-Cookie": sessionCookie(token) });
  }
  if (pathname === "/api/auth/register" && request.method === "POST") {
    const data = await readJson(request);
    if (!["student", "guest"].includes(data.role)) return message(response, 400, "Chỉ có thể tự tạo tài khoản học sinh hoặc khách.");
    const account  = cleanAccount(data);
    if ((await pool.query("SELECT 1 FROM users WHERE username = $1", [account.username])).rows[0]) return message(response, 409, "Tên đăng nhập đã được sử dụng.");
    const pw        = passwordRecord(account.password);
    const createdAt = now();
    const result    = await pool.query(
      "INSERT INTO users (username, display_name, role, password_hash, password_salt, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [account.username, account.displayName, data.role, pw.hash, pw.salt, createdAt, createdAt]
    );
    const user  = (await pool.query("SELECT id, username, display_name, role FROM users WHERE id = $1", [result.rows[0].id])).rows[0];
    const token = await createSession(user.id);
    return json(response, 201, { user: publicUser(user) }, { "Set-Cookie": sessionCookie(token) });
  }
  if (pathname === "/api/auth/login" && request.method === "POST") {
    const data     = await readJson(request);
    const username = String(data?.username || "").trim().toLowerCase();
    const user     = (await pool.query("SELECT * FROM users WHERE username = $1", [username])).rows[0];
    if (!user || !verifyPassword(data?.password, user)) return message(response, 401, "Tên đăng nhập hoặc mật khẩu chưa đúng.");
    const token = await createSession(user.id);
    return json(response, 200, { user: publicUser(user) }, { "Set-Cookie": sessionCookie(token) });
  }
  if (pathname === "/api/auth/logout" && request.method === "POST") {
    const token = parseCookies(request).sc_session;
    if (token) await pool.query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
    return json(response, 200, { ok: true }, { "Set-Cookie": sessionCookie("", true) });
  }
  if (pathname === "/api/me" && request.method === "GET") {
    const user = await currentUser(request);
    return json(response, 200, { user: user ? publicUser(user) : null });
  }
  if (pathname === "/api/learning/me" && request.method === "GET") {
    const user = await requireUser(request, response);
    if (!user) return;
    return json(response, 200, { state: await getLearningState(user.id) });
  }
  if (pathname === "/api/learning/me" && request.method === "PUT") {
    const user = await requireUser(request, response);
    if (!user) return;
    const data = await readJson(request);
    return json(response, 200, { state: await saveLearningState(user.id, data.state) });
  }
  if (pathname === "/api/teacher/students" && request.method === "GET") {
    if (!(await teacherRequired(request, response))) return;
    const students = (await pool.query(`
      SELECT u.id, u.username, u.display_name AS "displayName", u.created_at AS "createdAt",
        ls.updated_at AS "updatedAt",
        (SELECT COUNT(*) FROM activity_responses ar WHERE ar.user_id = u.id) AS "responseCount",
        (SELECT COUNT(*) FROM expense_entries   ee WHERE ee.user_id = u.id) AS "expenseCount"
      FROM users u LEFT JOIN learning_state ls ON ls.user_id = u.id
      WHERE u.role = 'student'
      ORDER BY LOWER(u.display_name), u.username
    `)).rows;
    return json(response, 200, {
      students: students.map(s => ({ ...s, responseCount: Number(s.responseCount), expenseCount: Number(s.expenseCount) }))
    });
  }

  const feedbackMatch = pathname.match(/^\/api\/teacher\/students\/(\d+)\/feedback$/);
  if (feedbackMatch && request.method === "POST") {
    if (!(await teacherRequired(request, response))) return;
    const studentId   = Number(feedbackMatch[1]);
    const data        = await readJson(request);
    const updatedAt   = now();
    await pool.query(`
      INSERT INTO teacher_feedbacks (student_id, activity_type, question_index, status, comment, rubric, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT(student_id, activity_type, question_index) DO UPDATE SET
        status     = EXCLUDED.status,
        comment    = EXCLUDED.comment,
        rubric     = EXCLUDED.rubric,
        updated_at = EXCLUDED.updated_at
    `, [studentId, String(data.activityType || "ad"), Number(data.questionIndex || 0),
        String(data.status  || "Đạt").slice(0, 50),
        String(data.comment || "").slice(0, 1000),
        String(data.rubric  || "").slice(0, 1000),
        updatedAt]);
    return json(response, 200, { ok: true });
  }

  const studentMatch = pathname.match(/^\/api\/teacher\/students\/(\d+)$/);
  if (studentMatch && request.method === "GET") {
    if (!(await teacherRequired(request, response))) return;
    const student = (await pool.query(
      "SELECT id, username, display_name, role FROM users WHERE id = $1 AND role = 'student'",
      [Number(studentMatch[1])]
    )).rows[0];
    if (!student) return message(response, 404, "Không tìm thấy học sinh.");
    return json(response, 200, { student: publicUser(student), state: await getLearningState(student.id) });
  }

  return message(response, 404, "Không tìm thấy chức năng yêu cầu.");
}

// ─── Static Files ─────────────────────────────────────────────────────────────
async function serveStatic(response, pathname) {
  const decoded  = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  const filePath = resolve(PUBLIC_DIR, `.${decoded}`);
  if (!filePath.startsWith(`${PUBLIC_DIR}${sep}`) && filePath !== join(PUBLIC_DIR, "index.html"))
    return message(response, 403, "Không được phép truy cập tệp này.");
  try {
    const file = await stat(filePath);
    if (!file.isFile()) return message(response, 404, "Không tìm thấy trang.");
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extname(filePath)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(content);
  } catch {
    message(response, 404, "Không tìm thấy trang.");
  }
}

// ─── Server ───────────────────────────────────────────────────────────────────
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) return await handleApi(request, response, url);
    return await serveStatic(response, url.pathname);
  } catch (error) {
    console.error(error);
    if (!response.headersSent) message(response, 400, error instanceof Error ? error.message : "Yêu cầu không hợp lệ.");
    else response.end();
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Smart Consumer đang chạy tại cổng ${PORT}`);
});
