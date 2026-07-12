import { createServer } from "node:http";
import { mkdir, readFile, stat } from "node:fs/promises";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, resolve, sep } from "node:path";
import { DatabaseSync } from "node:sqlite";

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(ROOT, "public");
const DATA_DIR = resolve(process.env.SC_DATA_DIR || join(ROOT, "data"));
const PORT = Number(process.env.PORT || 3000);
const SESSION_DAYS = 7;
const MAX_BODY_BYTES = 1_000_000;
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml"
};

await mkdir(DATA_DIR, { recursive: true });
const db = new DatabaseSync(join(DATA_DIR, "smart-consumer.db"));
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('teacher', 'student', 'guest')),
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token_hash);
  CREATE TABLE IF NOT EXISTS learning_state (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    active_step INTEGER NOT NULL DEFAULT 0 CHECK (active_step BETWEEN 0 AND 5),
    completed_json TEXT NOT NULL DEFAULT '[]',
    ad_set_json TEXT NOT NULL DEFAULT '[]',
    sit_set_json TEXT NOT NULL DEFAULT '[]',
    ad_position INTEGER NOT NULL DEFAULT 0 CHECK (ad_position BETWEEN 0 AND 5),
    sit_position INTEGER NOT NULL DEFAULT 0 CHECK (sit_position BETWEEN 0 AND 5),
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS activity_responses (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('ad', 'situation')),
    question_index INTEGER NOT NULL CHECK (question_index BETWEEN 0 AND 9),
    response TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, activity_type, question_index)
  );
  CREATE TABLE IF NOT EXISTS expense_entries (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL CHECK (day_index BETWEEN 0 AND 6),
    entry_position INTEGER NOT NULL,
    item TEXT NOT NULL DEFAULT '',
    amount INTEGER NOT NULL DEFAULT 0 CHECK (amount BETWEEN 0 AND 1000000000),
    category TEXT NOT NULL CHECK (category IN ('Nhu cầu', 'Mong muốn')),
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS expenses_user_day_idx ON expense_entries(user_id, day_index, entry_position);
`);

const blankExpense = () => ({ item: "", amount: "", kind: "Nhu cầu", note: "" });
const defaultJournal = () => Array.from({ length: 7 }, () => [blankExpense()]);
const now = () => new Date().toISOString();
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
  const actual = Buffer.from(user.password_hash, "base64");
  const expected = scryptSync(password, user.password_salt, 64);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function cleanAccount(data) {
  const username = String(data?.username || "").trim().toLowerCase();
  const displayName = String(data?.displayName || "").trim().replace(/\s+/g, " ");
  const password = data?.password;
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
      item: String(entry?.item ?? "").trim().slice(0, 160),
      amount: numberInRange(entry?.amount, 0, 1000000000, 0),
      kind: entry?.kind === "Mong muốn" ? "Mong muốn" : "Nhu cầu",
      note: String(entry?.note ?? "").trim().slice(0, 600)
    }));
    result[dayIndex] = cleaned.length ? cleaned : [blankExpense()];
  }
  return result;
}

function cleanLearningState(value) {
  const raw = value && typeof value === "object" ? value : {};
  const completed = Array.isArray(raw.completed)
    ? [...new Set(raw.completed.map(step => numberInRange(step, 0, 5, -1)).filter(step => step >= 0))]
    : [];
  return {
    active: numberInRange(raw.active, 0, 5),
    completed,
    adSet: questionSet(raw.adSet),
    sitSet: questionSet(raw.sitSet),
    adPosition: numberInRange(raw.adPosition, 0, 5),
    sitPosition: numberInRange(raw.sitPosition, 0, 5),
    adResponses: responses(raw.adResponses),
    sitResponses: responses(raw.sitResponses),
    journal: journal(raw.journal)
  };
}

function createSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const createdAt = now();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  db.prepare("INSERT INTO sessions (user_id, token_hash, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)")
    .run(userId, hashToken(token), expiresAt, createdAt, createdAt);
  return token;
}

function currentUser(request) {
  const token = parseCookies(request).sc_session;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const user = db.prepare(`
    SELECT u.id, u.username, u.display_name, u.role
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `).get(tokenHash, now());
  if (!user) return null;
  db.prepare("UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?").run(now(), tokenHash);
  return user;
}

function requireUser(request, response) {
  const user = currentUser(request);
  if (!user) {
    message(response, 401, "Vui lòng đăng nhập để tiếp tục.");
    return null;
  }
  return user;
}

function getLearningState(userId) {
  const saved = db.prepare("SELECT * FROM learning_state WHERE user_id = ?").get(userId);
  if (!saved) return null;
  const state = {
    active: saved.active_step,
    completed: parseJson(saved.completed_json, []),
    adSet: parseJson(saved.ad_set_json, []),
    sitSet: parseJson(saved.sit_set_json, []),
    adPosition: saved.ad_position,
    sitPosition: saved.sit_position,
    adResponses: {},
    sitResponses: {},
    journal: defaultJournal()
  };
  const answers = db.prepare("SELECT activity_type, question_index, response FROM activity_responses WHERE user_id = ?").all(userId);
  for (const answer of answers) state[answer.activity_type === "ad" ? "adResponses" : "sitResponses"][answer.question_index] = answer.response;
  const expenses = db.prepare("SELECT day_index, item, amount, category, note FROM expense_entries WHERE user_id = ? ORDER BY day_index, entry_position").all(userId);
  const journalEntries = Array.from({ length: 7 }, () => []);
  for (const expense of expenses) journalEntries[expense.day_index].push({ item: expense.item, amount: String(expense.amount || ""), kind: expense.category, note: expense.note });
  state.journal = journalEntries.map(entries => entries.length ? entries : [blankExpense()]);
  return cleanLearningState(state);
}

function saveLearningState(userId, rawState) {
  const state = cleanLearningState(rawState);
  const updatedAt = now();
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(`
      INSERT INTO learning_state (user_id, active_step, completed_json, ad_set_json, sit_set_json, ad_position, sit_position, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        active_step = excluded.active_step,
        completed_json = excluded.completed_json,
        ad_set_json = excluded.ad_set_json,
        sit_set_json = excluded.sit_set_json,
        ad_position = excluded.ad_position,
        sit_position = excluded.sit_position,
        updated_at = excluded.updated_at
    `).run(userId, state.active, JSON.stringify(state.completed), JSON.stringify(state.adSet), JSON.stringify(state.sitSet), state.adPosition, state.sitPosition, updatedAt);
    db.prepare("DELETE FROM activity_responses WHERE user_id = ?").run(userId);
    const answerStatement = db.prepare("INSERT INTO activity_responses (user_id, activity_type, question_index, response, updated_at) VALUES (?, ?, ?, ?, ?)");
    for (const [questionIndex, answer] of Object.entries(state.adResponses)) answerStatement.run(userId, "ad", Number(questionIndex), answer, updatedAt);
    for (const [questionIndex, answer] of Object.entries(state.sitResponses)) answerStatement.run(userId, "situation", Number(questionIndex), answer, updatedAt);
    db.prepare("DELETE FROM expense_entries WHERE user_id = ?").run(userId);
    const expenseStatement = db.prepare(`
      INSERT INTO expense_entries (user_id, day_index, entry_position, item, amount, category, note, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    state.journal.forEach((entries, dayIndex) => entries.forEach((entry, entryPosition) => {
      if (entry.item || Number(entry.amount) || entry.note) expenseStatement.run(userId, dayIndex, entryPosition, entry.item, Number(entry.amount) || 0, entry.kind, entry.note, updatedAt, updatedAt);
    }));
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return state;
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) throw new Error("Dữ liệu gửi lên quá lớn.");
  }
  try { return body ? JSON.parse(body) : {}; } catch { throw new Error("Dữ liệu gửi lên không hợp lệ."); }
}

function teacherRequired(request, response) {
  const user = requireUser(request, response);
  if (!user) return null;
  if (user.role !== "teacher") {
    message(response, 403, "Chỉ giáo viên mới có quyền xem bài làm của học sinh.");
    return null;
  }
  return user;
}

async function handleApi(request, response, url) {
  const { pathname } = url;
  if (pathname === "/api/setup/status" && request.method === "GET") {
    const teacher = db.prepare("SELECT 1 FROM users WHERE role = 'teacher' LIMIT 1").get();
    return json(response, 200, { teacherExists: Boolean(teacher) });
  }
  if (pathname === "/api/setup/teacher" && request.method === "POST") {
    if (db.prepare("SELECT 1 FROM users WHERE role = 'teacher' LIMIT 1").get()) return message(response, 409, "Tài khoản giáo viên đầu tiên đã được thiết lập.");
    const account = cleanAccount(await readJson(request));
    if (db.prepare("SELECT 1 FROM users WHERE username = ?").get(account.username)) return message(response, 409, "Tên đăng nhập đã được sử dụng.");
    const password = passwordRecord(account.password);
    const createdAt = now();
    const result = db.prepare("INSERT INTO users (username, display_name, role, password_hash, password_salt, created_at, updated_at) VALUES (?, ?, 'teacher', ?, ?, ?, ?)")
      .run(account.username, account.displayName, password.hash, password.salt, createdAt, createdAt);
    const user = db.prepare("SELECT id, username, display_name, role FROM users WHERE id = ?").get(Number(result.lastInsertRowid));
    const token = createSession(user.id);
    return json(response, 201, { user: publicUser(user) }, { "Set-Cookie": sessionCookie(token) });
  }
  if (pathname === "/api/auth/register" && request.method === "POST") {
    const data = await readJson(request);
    if (!["student", "guest"].includes(data.role)) return message(response, 400, "Chỉ có thể tự tạo tài khoản học sinh hoặc khách.");
    const account = cleanAccount(data);
    if (db.prepare("SELECT 1 FROM users WHERE username = ?").get(account.username)) return message(response, 409, "Tên đăng nhập đã được sử dụng.");
    const password = passwordRecord(account.password);
    const createdAt = now();
    const result = db.prepare("INSERT INTO users (username, display_name, role, password_hash, password_salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(account.username, account.displayName, data.role, password.hash, password.salt, createdAt, createdAt);
    const user = db.prepare("SELECT id, username, display_name, role FROM users WHERE id = ?").get(Number(result.lastInsertRowid));
    const token = createSession(user.id);
    return json(response, 201, { user: publicUser(user) }, { "Set-Cookie": sessionCookie(token) });
  }
  if (pathname === "/api/auth/login" && request.method === "POST") {
    const data = await readJson(request);
    const username = String(data?.username || "").trim().toLowerCase();
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user || !verifyPassword(data?.password, user)) return message(response, 401, "Tên đăng nhập hoặc mật khẩu chưa đúng.");
    const token = createSession(user.id);
    return json(response, 200, { user: publicUser(user) }, { "Set-Cookie": sessionCookie(token) });
  }
  if (pathname === "/api/auth/logout" && request.method === "POST") {
    const token = parseCookies(request).sc_session;
    if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
    return json(response, 200, { ok: true }, { "Set-Cookie": sessionCookie("", true) });
  }
  if (pathname === "/api/me" && request.method === "GET") {
    const user = currentUser(request);
    return json(response, 200, { user: user ? publicUser(user) : null });
  }
  if (pathname === "/api/learning/me" && request.method === "GET") {
    const user = requireUser(request, response);
    if (!user) return;
    return json(response, 200, { state: getLearningState(user.id) });
  }
  if (pathname === "/api/learning/me" && request.method === "PUT") {
    const user = requireUser(request, response);
    if (!user) return;
    const data = await readJson(request);
    return json(response, 200, { state: saveLearningState(user.id, data.state) });
  }
  if (pathname === "/api/teacher/students" && request.method === "GET") {
    if (!teacherRequired(request, response)) return;
    const students = db.prepare(`
      SELECT u.id, u.username, u.display_name AS displayName, u.created_at AS createdAt,
        ls.updated_at AS updatedAt,
        (SELECT COUNT(*) FROM activity_responses ar WHERE ar.user_id = u.id) AS responseCount,
        (SELECT COUNT(*) FROM expense_entries ee WHERE ee.user_id = u.id) AS expenseCount
      FROM users u LEFT JOIN learning_state ls ON ls.user_id = u.id
      WHERE u.role = 'student'
      ORDER BY u.display_name COLLATE NOCASE, u.username
    `).all();
    return json(response, 200, { students });
  }
  const studentMatch = pathname.match(/^\/api\/teacher\/students\/(\d+)$/);
  if (studentMatch && request.method === "GET") {
    if (!teacherRequired(request, response)) return;
    const student = db.prepare("SELECT id, username, display_name, role FROM users WHERE id = ? AND role = 'student'").get(Number(studentMatch[1]));
    if (!student) return message(response, 404, "Không tìm thấy học sinh.");
    return json(response, 200, { student: publicUser(student), state: getLearningState(student.id) });
  }
  return message(response, 404, "Không tìm thấy chức năng yêu cầu.");
}

async function serveStatic(response, pathname) {
  const decoded = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  const filePath = resolve(PUBLIC_DIR, `.${decoded}`);
  if (!filePath.startsWith(`${PUBLIC_DIR}${sep}`) && filePath !== join(PUBLIC_DIR, "index.html")) return message(response, 403, "Không được phép truy cập tệp này.");
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

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Smart Consumer đang chạy tại http://127.0.0.1:${PORT}`);
  console.log("Lần đầu sử dụng: tạo tài khoản giáo viên trong nút Đăng nhập.");
});
