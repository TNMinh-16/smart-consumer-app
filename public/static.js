const steps = ["Trang chủ", "Mục tiêu", "Bài học", "Quảng cáo", "Tình huống", "Vận dụng"];
const QUESTION_COUNT = 5;
const MIN_RESPONSE_LENGTH = 12;

const adBank = [
  { title: "Trà sữa đồng giá 9.000đ", copy: "Đặt ngay trong 5 phút — số lượng có hạn!", q: "Trước khi đặt mua, em sẽ kiểm tra những thông tin nào? Vì sao?", hint: "Gợi ý: tên cửa hàng, đánh giá, phí giao hàng, nguyên liệu và nhu cầu thật của em." },
  { title: "Mua 2 áo giảm 20%", copy: "Ưu đãi chỉ còn hôm nay!", q: "Em sẽ quyết định như thế nào nếu đang có áo mặc tốt?", hint: "Gợi ý: phân biệt khuyến mãi với nhu cầu; cân nhắc chất lượng và khả năng chi trả." },
  { title: "Giày cao cấp, giá rẻ bất ngờ", copy: "Không cần bảo hành — chốt đơn ngay!", q: "Dấu hiệu nào khiến em cần cẩn thận? Em sẽ làm gì tiếp theo?", hint: "Gợi ý: chú ý nguồn gốc, chính sách đổi trả, bảo hành và giá bất thường." },
  { title: "Hải sản chế biến sẵn siêu rẻ", copy: "Rẻ hơn nhiều so với hàng tươi sống!", q: "Em cần kiểm tra gì để bảo vệ sức khỏe của mình?", hint: "Gợi ý: nguồn gốc, hạn sử dụng, nơi bán và cách bảo quản." },
  { title: "Người nổi tiếng giới thiệu mỹ phẩm", copy: "Dùng 3 ngày da sáng mịn tức thì!", q: "Em có tin ngay vào quảng cáo này không? Hãy nêu cách kiểm chứng của em.", hint: "Gợi ý: kiểm tra thành phần, đánh giá độc lập, giấy tờ sản phẩm và lời quảng cáo quá mức." },
  { title: "Flash sale còn 60 giây", copy: "Mua ngay kẻo lỡ giá sốc!", q: "Quảng cáo này đang tác động đến cảm xúc của người mua như thế nào? Em sẽ giữ bình tĩnh ra sao?", hint: "Gợi ý: giới hạn thời gian thường tạo cảm giác vội vàng; hãy quay lại câu hỏi “mình có thật sự cần không?”." },
  { title: "Thực phẩm chức năng giảm cân", copy: "Cam kết giảm 5kg trong một tuần!", q: "Vì sao em không nên mua chỉ dựa trên lời cam kết này?", hint: "Gợi ý: sức khỏe cần thông tin đáng tin cậy; kiểm tra nguồn gốc và tham khảo người có chuyên môn." },
  { title: "Nạp thẻ game tặng gấp đôi", copy: "Chỉ áp dụng trong tối nay!", q: "Nếu muốn nạp tiền, em cần cân nhắc điều gì để không chi quá mức?", hint: "Gợi ý: nguồn nạp chính thức, số tiền trong kế hoạch và nhu cầu thực sự." },
  { title: "Sách tham khảo giá rẻ online", copy: "Rẻ hơn 60% so với nhà sách!", q: "Em sẽ làm gì để biết sách có đáng mua và đúng nhu cầu học tập?", hint: "Gợi ý: kiểm tra nhà xuất bản, năm xuất bản, đánh giá và nội dung phù hợp bài học." },
  { title: "Ốp điện thoại ‘hàng xịn’", copy: "Giá chỉ bằng một nửa thị trường!", q: "Hãy nêu ba cách em kiểm tra độ tin cậy của người bán và sản phẩm.", hint: "Gợi ý: so sánh giá, đọc đánh giá có ảnh thật, kiểm tra đổi trả và nguồn gốc." }
];

const situationBank = [
  { title: "100.000đ mua đồ dùng học tập", copy: "H được mẹ đưa tiền mua vở và bút nhưng lại thấy một món đồ chơi rất đẹp.", q: "Nếu là bạn của H, em sẽ khuyên H làm gì? Hãy giải thích lí do.", hint: "Gợi ý: ưu tiên nhu cầu thiết yếu trước, rồi mới cân nhắc sở thích khi còn tiền." },
  { title: "Chiếc bình nước đang ‘hot’", copy: "M vẫn có bình nước dùng tốt nhưng muốn mua bình mới vì sợ bị cho là lỗi thời.", q: "M nên suy nghĩ những gì trước khi quyết định mua?", hint: "Gợi ý: phân biệt nhu cầu thật với mong muốn nhất thời và áp lực từ bạn bè." },
  { title: "Hàng nội hay hàng ngoại?", copy: "N chỉ muốn mua cặp nhập khẩu dù có cặp Việt Nam chất lượng tốt, giá phù hợp hơn.", q: "Em sẽ giúp N so sánh sản phẩm bằng những tiêu chí nào?", hint: "Gợi ý: chất lượng, giá, nguồn gốc, độ bền và mức độ phù hợp với nhu cầu." },
  { title: "Tai nghe giảm giá 50%", copy: "T đã có tai nghe dùng tốt nhưng muốn mua thêm vì sợ hết khuyến mãi.", q: "T nên tự hỏi những câu gì trước khi mua?", hint: "Gợi ý: mình có cần không, sản phẩm có bảo đảm không, có làm lệch kế hoạch chi tiêu không?" },
  { title: "Thực phẩm online siêu rẻ", copy: "Một món hải sản không ghi rõ nguồn gốc và hạn sử dụng.", q: "Em sẽ xử lí tình huống này thế nào để bảo đảm an toàn?", hint: "Gợi ý: hỏi thông tin, xem đánh giá; nếu không rõ thì không mua." },
  { title: "Góp quỹ mua quà cho lớp", copy: "Lớp muốn mua quà cho cô giáo, nhưng số tiền góp khiến em phải bớt tiền ăn sáng trong tuần.", q: "Em sẽ trao đổi và lựa chọn cách góp như thế nào để vừa có trách nhiệm vừa phù hợp?", hint: "Gợi ý: nói rõ khả năng của mình, đề xuất mức góp hợp lí hoặc cách làm quà khác." },
  { title: "Gói dữ liệu điện thoại mới", copy: "Một gói mạng mới có nhiều ưu đãi nhưng giá cao hơn hẳn gói em đang dùng.", q: "Em cần thu thập thông tin gì trước khi đổi gói?", hint: "Gợi ý: nhu cầu dùng thực tế, dung lượng, giá, thời hạn và ngân sách của em." },
  { title: "Mua sách cũ", copy: "Bạn rủ em mua bộ sách cũ rẻ, nhưng vài cuốn đã lỗi thời và bị ghi chú nhiều.", q: "Em sẽ đánh giá lợi ích và rủi ro của lựa chọn này như thế nào?", hint: "Gợi ý: xem nội dung còn phù hợp không, tình trạng sách, mức giá và sách nào thật sự cần." },
  { title: "Bạn rủ nạp game", copy: "Bạn bè cùng nạp tiền để mua vật phẩm trong trò chơi, còn em đang để dành tiền mua đồ dùng học tập.", q: "Em sẽ trả lời bạn và kiểm soát mong muốn của mình ra sao?", hint: "Gợi ý: nhớ mục tiêu đã đặt ra, nói rõ quyết định và tránh nạp tiền theo phong trào." },
  { title: "Ăn vặt sau giờ học", copy: "Mỗi ngày em mua một món ăn vặt nhỏ, cuối tuần nhận ra đã chi khá nhiều tiền.", q: "Em sẽ thay đổi thói quen nào để vẫn vui nhưng không lãng phí?", hint: "Gợi ý: đặt mức chi, mang đồ ăn/nước từ nhà hoặc chỉ chọn vài ngày trong tuần." }
];

const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const blankExpense = () => ({ item: "", amount: "", kind: "Nhu cầu", note: "" });
const defaultJournal = () => days.map(() => [blankExpense()]);
const createDefaultState = () => ({ active: 0, completed: [], adSet: [], adPosition: 0, adResponses: {}, sitSet: [], sitPosition: 0, sitResponses: {}, journal: defaultJournal() });

let state = createDefaultState();
try {
  const saved = JSON.parse(localStorage.getItem("smart-consumer-static") || "{}");
  state = { ...state, ...saved };
  state.active = Math.min(Number(state.active) || 0, 5);
  const oldCompleted = Array.isArray(state.completed) ? state.completed : [];
  state.completed = oldCompleted.filter(index => index >= 0 && index <= 5);
  if (!Array.isArray(state.journal) || state.journal.length !== days.length) state.journal = defaultJournal();
  state.journal = state.journal.map(day => Array.isArray(day) && day.length ? day : (day && typeof day === "object" ? [{ ...blankExpense(), ...day }] : [blankExpense()]));
} catch (_) {
  state.journal = defaultJournal();
}

const $ = selector => document.querySelector(selector);
const money = value => `${(Number(value) || 0).toLocaleString("vi-VN")}đ`;
const escapeHtml = value => String(value ?? "").replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
let currentUser = null;
let syncTimer = null;
let syncGeneration = 0;

function save() {
  localStorage.setItem("smart-consumer-static", JSON.stringify(state));
  scheduleSync();
}

function randomSet(bank) {
  return bank.map((_, index) => index).sort(() => Math.random() - .5).slice(0, QUESTION_COUNT);
}

function ensureSet(type) {
  const key = type === "ad" ? "adSet" : "sitSet";
  const bank = type === "ad" ? adBank : situationBank;
  if (!Array.isArray(state[key]) || state[key].length !== QUESTION_COUNT || state[key].some(index => index < 0 || index >= bank.length)) {
    state[key] = randomSet(bank);
    state[type === "ad" ? "adPosition" : "sitPosition"] = 0;
  }
}

function setupNav() {
  const nav = $("#nav");
  nav.innerHTML = steps.map((label, index) => `<button data-go="${index}"><i>${state.completed.includes(index) ? "✓" : index + 1}</i>${label}</button>`).join("");
  nav.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => go(Number(button.dataset.go))));
  updateNav();
}

function updateNav() {
  document.querySelectorAll("#nav button").forEach((button, index) => {
    button.classList.toggle("active", index === state.active);
    button.classList.toggle("done", state.completed.includes(index));
    button.querySelector("i").textContent = state.completed.includes(index) ? "✓" : index + 1;
  });
}

function go(index) {
  state.active = Math.max(0, Math.min(index, steps.length - 1));
  document.querySelectorAll(".panel").forEach((panel, panelIndex) => panel.classList.toggle("active", panelIndex === state.active));
  updateNav();
  save();
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (state.active === 3) renderOpenActivity("ad");
  if (state.active === 4) renderOpenActivity("sit");
  if (state.active === 5) renderJournal();
}

function complete(index, next = index + 1) {
  if (!state.completed.includes(index)) state.completed.push(index);
  save();
  go(next);
}

document.querySelectorAll("[data-complete]").forEach(button => button.addEventListener("click", () => complete(Number(button.dataset.complete))));

function renderOpenActivity(type) {
  const isAd = type === "ad";
  const root = $(isAd ? "#adActivity" : "#situationActivity");
  const bank = isAd ? adBank : situationBank;
  const setKey = isAd ? "adSet" : "sitSet";
  const positionKey = isAd ? "adPosition" : "sitPosition";
  const responseKey = isAd ? "adResponses" : "sitResponses";
  const nextStep = isAd ? 3 : 4;
  ensureSet(type);
  const position = Number(state[positionKey]) || 0;

  if (position >= QUESTION_COUNT) {
    root.innerHTML = `<div class="doneCard"><h3>Em đã hoàn thành 5 câu hỏi!</h3><p>Các câu trả lời đã được lưu trên thiết bị. Em có thể làm một bộ câu hỏi khác để luyện tập thêm.</p><div class="actions" style="justify-content:center"><button class="ghost" data-new>Đổi bộ 5 câu khác</button><button class="primary" data-continue>Tiếp tục →</button></div></div>`;
    root.querySelector("[data-new]").addEventListener("click", () => {
      state[setKey] = randomSet(bank);
      state[positionKey] = 0;
      state[responseKey] = {};
      save();
      renderOpenActivity(type);
    });
    root.querySelector("[data-continue]").addEventListener("click", () => complete(nextStep));
    return;
  }

  const questionIndex = state[setKey][position];
  const question = bank[questionIndex];
  const response = state[responseKey]?.[questionIndex] || "";
  const modeClass = isAd ? "adMode" : "situationMode";
  const context = isAd
    ? `<aside class="activityContext adCreative"><span class="contextLabel">QUẢNG CÁO GIẢ LẬP</span><div class="contextIcon">!</div><h3>${question.title}</h3><p>${question.copy}</p><div class="fakeCta">ƯU ĐÃI CÓ HẠN</div><div class="contextFoot">⚠ Hãy dừng lại và kiểm tra trước khi quyết định mua.</div></aside>`
    : `<aside class="activityContext situationCreative"><span class="contextLabel">TÌNH HUỐNG THỰC TẾ</span><div class="contextIcon">?</div><h3>${question.title}</h3><p>${question.copy}</p><div class="thinkingPrompt">💭 Nếu là nhân vật trong tình huống này, em sẽ làm gì?</div></aside>`;
  root.innerHTML = `<div class="openActivity ${modeClass}">${context}<div class="openQuestion"><div class="responseTop"><div><span class="taskLabel">NHIỆM VỤ CỦA EM</span><h3>${question.q}</h3></div><div class="progressDots" aria-label="Tiến độ câu hỏi">${Array.from({ length: QUESTION_COUNT }, (_, index) => `<i class="${index < position ? "done" : index === position ? "current" : ""}"></i>`).join("")}</div></div><div class="hintBox"><b>Gợi ý</b><span>${question.hint}</span></div><label class="responseLabel">Trả lời của em<textarea id="openResponse" placeholder="Viết suy nghĩ và cách xử lí của em ở đây...">${escapeHtml(response)}</textarea><span id="responseCount">${response.trim().length} ký tự</span></label><div class="openActions"><button class="ghost" id="previousOpen" ${position === 0 ? "disabled" : ""}>← Câu trước</button><button class="primary" id="saveOpenAnswer" ${response.trim().length < MIN_RESPONSE_LENGTH ? "disabled" : ""}>${position === QUESTION_COUNT - 1 ? "Lưu câu trả lời" : "Lưu & câu tiếp theo →"}</button></div></div></div>`;
  const textarea = root.querySelector("#openResponse");
  const saveButton = root.querySelector("#saveOpenAnswer");
  const previousButton = root.querySelector("#previousOpen");
  const responseCount = root.querySelector("#responseCount");
  textarea.addEventListener("input", () => {
    const count = textarea.value.trim().length;
    responseCount.textContent = `${count} ký tự${count < MIN_RESPONSE_LENGTH ? ` · cần ít nhất ${MIN_RESPONSE_LENGTH}` : ""}`;
    saveButton.disabled = count < MIN_RESPONSE_LENGTH;
  });
  previousButton.addEventListener("click", () => {
    state[responseKey] = { ...state[responseKey], [questionIndex]: textarea.value.trim() };
    state[positionKey] = Math.max(0, position - 1);
    save();
    renderOpenActivity(type);
  });
  saveButton.addEventListener("click", () => {
    state[responseKey] = { ...state[responseKey], [questionIndex]: textarea.value.trim() };
    state[positionKey] = position + 1;
    save();
    renderOpenActivity(type);
  });
}

function updateJournalSummary() {
  const entries = state.journal.flat().filter(entry => entry.item || Number(entry.amount) || entry.note);
  $("#weekTotal").textContent = money(entries.reduce((total, entry) => total + (Number(entry.amount) || 0), 0));
  $("#needCount").textContent = entries.filter(entry => entry.kind === "Nhu cầu").length;
  $("#wantCount").textContent = entries.filter(entry => entry.kind === "Mong muốn").length;
}

function renderJournal() {
  const root = $("#journalRows");
  root.innerHTML = days.map((day, dayIndex) => {
    const entries = state.journal[dayIndex];
    const subtotal = entries.reduce((total, entry) => total + (Number(entry.amount) || 0), 0);
    return entries.map((entry, entryIndex) => `<tr class="expenseSubrow" data-day="${dayIndex}" data-entry="${entryIndex}">${entryIndex === 0 ? `<th class="dayCell" scope="rowgroup" rowspan="${entries.length}"><span>NGÀY ${dayIndex + 1}/7</span><b>${day}</b><strong class="dayTotal-${dayIndex}">${money(subtotal)}</strong><button type="button" data-add="${dayIndex}">＋ Khoản chi</button></th>` : ""}<td><input data-field="item" value="${escapeHtml(entry.item)}" placeholder="Ví dụ: mua bút, trà sữa..."></td><td class="amountCell"><input data-field="amount" type="number" min="0" inputmode="numeric" value="${escapeHtml(entry.amount)}" placeholder="0"></td><td class="kindCell"><select data-field="kind"><option ${entry.kind === "Nhu cầu" ? "selected" : ""}>Nhu cầu</option><option ${entry.kind === "Mong muốn" ? "selected" : ""}>Mong muốn</option></select></td><td class="expenseNote"><input data-field="note" value="${escapeHtml(entry.note)}" placeholder="Ghi nhận xét ngắn"></td><td class="deleteCell"><button class="removeExpense" type="button" data-remove="${entryIndex}" aria-label="Xóa khoản chi">×</button></td></tr>`).join("");
  }).join("");

  const updateExpense = control => {
    const row = control.closest("tr");
    const dayIndex = Number(row.dataset.day);
    const entryIndex = Number(row.dataset.entry);
    state.journal[dayIndex][entryIndex][control.dataset.field] = control.value;
    save();
    updateJournalSummary();
    const subtotal = state.journal[dayIndex].reduce((total, entry) => total + (Number(entry.amount) || 0), 0);
    const totalCell = root.querySelector(`.dayTotal-${dayIndex}`);
    if (totalCell) totalCell.textContent = money(subtotal);
  };
  root.querySelectorAll("[data-field]").forEach(control => {
    control.addEventListener("input", () => updateExpense(control));
    control.addEventListener("change", () => updateExpense(control));
  });
  root.querySelectorAll("[data-add]").forEach(button => button.addEventListener("click", () => {
    state.journal[Number(button.dataset.add)].push(blankExpense());
    save();
    renderJournal();
  }));
  root.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", () => {
    const row = button.closest("tr");
    const dayIndex = Number(row.dataset.day);
    const entryIndex = Number(button.dataset.remove);
    if (state.journal[dayIndex].length === 1) state.journal[dayIndex] = [blankExpense()];
    else state.journal[dayIndex].splice(entryIndex, 1);
    save();
    renderJournal();
  }));
  updateJournalSummary();
}

function download(name, text) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function prepareState(raw) {
  const next = { ...createDefaultState(), ...(raw && typeof raw === "object" ? raw : {}) };
  next.active = Math.min(Math.max(Number(next.active) || 0, 0), 5);
  next.completed = Array.isArray(next.completed) ? [...new Set(next.completed.map(Number).filter(index => index >= 0 && index <= 5))] : [];
  next.adSet = Array.isArray(next.adSet) ? next.adSet : [];
  next.sitSet = Array.isArray(next.sitSet) ? next.sitSet : [];
  next.adResponses = next.adResponses && typeof next.adResponses === "object" ? next.adResponses : {};
  next.sitResponses = next.sitResponses && typeof next.sitResponses === "object" ? next.sitResponses : {};
  next.journal = Array.isArray(next.journal) && next.journal.length === days.length ? next.journal : defaultJournal();
  next.journal = next.journal.map(day => Array.isArray(day) && day.length ? day : [blankExpense()]);
  return next;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Không thể xử lí yêu cầu này.");
  return data;
}

function scheduleSync() {
  if (!currentUser) return;
  clearTimeout(syncTimer);
  const ownerId = currentUser.id;
  const generation = syncGeneration;
  const snapshot = JSON.parse(JSON.stringify(state));
  syncTimer = setTimeout(async () => {
    if (!currentUser || currentUser.id !== ownerId || generation !== syncGeneration) return;
    try {
      await api("/api/learning/me", { method: "PUT", body: JSON.stringify({ state: snapshot }) });
      if (currentUser?.id === ownerId) $("#accountStatus").title = "Bài làm đã được lưu vào tài khoản.";
    } catch (_) {
      if (currentUser?.id === ownerId) $("#accountStatus").title = "Chưa thể đồng bộ bài làm. Hãy kiểm tra máy chủ cục bộ.";
    }
  }, 650);
}

function replaceState(raw) {
  state = prepareState(raw);
  localStorage.setItem("smart-consumer-static", JSON.stringify(state));
  setupNav();
  renderJournal();
  go(state.active);
}

function roleLabel(role) {
  return ({ teacher: "Giáo viên", student: "Học sinh", guest: "Khách" })[role] || "Tài khoản";
}

function updateAccountBar() {
  const status = $("#accountStatus");
  const authButton = $("#authButton");
  const teacherButton = $("#teacherButton");
  const logoutButton = $("#logoutButton");
  
  if (!currentUser) {
    status.textContent = "Chưa đăng nhập";
    status.title = "Hãy đăng nhập để lưu bài làm theo tài khoản.";
    authButton.hidden = false;
    teacherButton.hidden = true;
    logoutButton.hidden = true;
    $("main").hidden = false;
    $("#nav").hidden = false;
    if ($("#teacherDashboard")) $("#teacherDashboard").hidden = true;
    return;
  }
  
  status.textContent = `${roleLabel(currentUser.role)}: ${currentUser.displayName}`;
  status.title = "Bài làm được lưu riêng cho tài khoản này.";
  authButton.hidden = true;
  logoutButton.hidden = false;
  
  if (currentUser.role === "teacher") {
    teacherButton.hidden = true;
    $("main").hidden = true;
    $("#nav").hidden = true;
    if ($("#teacherDashboard")) $("#teacherDashboard").hidden = false;
    openTeacherDashboard();
  } else {
    teacherButton.hidden = true;
    $("main").hidden = false;
    $("#nav").hidden = false;
    if ($("#teacherDashboard")) $("#teacherDashboard").hidden = true;
  }
}

function closeModal() {
  $("#modalRoot").innerHTML = "";
  document.body.classList.remove("modalOpen");
}

function showModal(title, subtitle, content) {
  const root = $("#modalRoot");
  root.innerHTML = `<div class="modalLayer" role="presentation"><section class="modalCard" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><header class="modalTop"><div><p>${subtitle}</p><h2 id="modalTitle">${title}</h2></div><button class="modalClose" type="button" data-close aria-label="Đóng">×</button></header><div class="modalBody">${content}</div></section></div>`;
  document.body.classList.add("modalOpen");
  root.querySelector("[data-close]").addEventListener("click", closeModal);
  root.querySelector(".modalLayer").addEventListener("click", event => { if (event.target === event.currentTarget) closeModal(); });
}

async function openAuthModal(initialMode = "login") {
  showModal("Tài khoản học tập", "LƯU BÀI LÀM RIÊNG TƯ", `<p class="loadingState">Đang chuẩn bị biểu mẫu...</p>`);
  try {
    const setup = await api("/api/setup/status");
    renderAuthModal(initialMode, setup.teacherExists);
  } catch (_) {
    showModal("Chưa kết nối được máy chủ", "TÀI KHOẢN HỌC TẬP", `<p class="emptyState">Hãy chạy <b>start-server.cmd</b>, sau đó mở trang tại địa chỉ localhost do máy chủ hiển thị.</p>`);
  }
}

function renderAuthModal(mode, teacherExists, error = "") {
  const isLogin = mode === "login";
  const isTeacher = mode === "teacher";
  const title = isLogin ? "Đăng nhập" : isTeacher ? "Thiết lập giáo viên" : "Tạo tài khoản";
  const fields = isLogin
    ? `<label>Tên đăng nhập<input name="username" autocomplete="username" required></label><label>Mật khẩu<input name="password" type="password" autocomplete="current-password" required></label>`
    : `<label>Họ và tên / tên hiển thị<input name="displayName" autocomplete="name" required maxlength="80"></label><label>Tên đăng nhập<input name="username" autocomplete="username" required pattern="[a-zA-Z0-9._-]{3,40}"></label>${isTeacher ? "" : `<input type="hidden" name="role" value="student">`}<label>Mật khẩu<input name="password" type="password" autocomplete="new-password" required minlength="8"></label>`;
  const setupNote = !teacherExists && !isTeacher
    ? `<div class="teacherSetup">Chưa có tài khoản giáo viên cho lớp này.<br><button type="button" data-open-teacher>Thiết lập giáo viên đầu tiên</button></div>`
    : "";
  showModal(title, "TÀI KHOẢN HỌC TẬP", `<div class="authTabs"><button type="button" class="${isLogin ? "active" : ""}" data-auth-mode="login">Đăng nhập</button><button type="button" class="${!isLogin && !isTeacher ? "active" : ""}" data-auth-mode="register">Tạo tài khoản</button></div><form class="authForm" id="authForm">${fields}<p class="authHint">${isTeacher ? "Tài khoản giáo viên có thể xem bài làm của học sinh." : "Tài khoản học sinh chỉ xem được bài làm của chính mình."}</p><p class="authError" id="authError">${escapeHtml(error)}</p><button class="primary" type="submit">${isLogin ? "Đăng nhập" : isTeacher ? "Tạo tài khoản giáo viên" : "Tạo tài khoản"}</button></form>${setupNote}`);
  document.querySelectorAll("[data-auth-mode]").forEach(button => button.addEventListener("click", () => renderAuthModal(button.dataset.authMode, teacherExists)));
  const teacherButton = $("[data-open-teacher]");
  if (teacherButton) teacherButton.addEventListener("click", () => renderAuthModal("teacher", teacherExists));
  $("#authForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector("[type=submit]");
    const payload = Object.fromEntries(new FormData(form));
    const endpoint = isLogin ? "/api/auth/login" : isTeacher ? "/api/setup/teacher" : "/api/auth/register";
    submit.disabled = true;
    try {
      const result = await api(endpoint, { method: "POST", body: JSON.stringify(payload) });
      syncGeneration += 1;
      currentUser = result.user;
      updateAccountBar();
      closeModal();
      const learning = await api("/api/learning/me");
      replaceState(learning.state || createDefaultState());
    } catch (requestError) {
      renderAuthModal(mode, teacherExists, requestError.message);
    }
  });
}

async function initialiseAccount() {
  updateAccountBar();
  try {
    const result = await api("/api/me");
    if (!result.user) return;
    currentUser = result.user;
    updateAccountBar();
    const learning = await api("/api/learning/me");
    replaceState(learning.state || createDefaultState());
  } catch (_) {
    updateAccountBar();
  }
}

async function logout() {
  syncGeneration += 1;
  clearTimeout(syncTimer);
  try { await api("/api/auth/logout", { method: "POST" }); } catch (_) { /* Local state is still cleared for privacy. */ }
  currentUser = null;
  state = createDefaultState();
  localStorage.removeItem("smart-consumer-static");
  setupNav();
  renderJournal();
  go(0);
  updateAccountBar();
}

function formatUpdatedAt(value) {
  if (!value) return "Chưa nộp bài";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Đã lưu bài" : `Cập nhật ${date.toLocaleString("vi-VN")}`;
}

async function openTeacherDashboard() {
  if (currentUser?.role !== "teacher") return;
  const listRoot = $("#teacherStudentList");
  listRoot.innerHTML = `<p class="loadingState">Đang tải danh sách học sinh...</p>`;
  $("#teacherStudentDetail").innerHTML = `<div class="emptyState"><div class="contextIcon">👤</div><p>Chọn một học sinh ở danh sách bên trái<br>để xem chi tiết bài làm.</p></div>`;
  try {
    const data = await api("/api/teacher/students");
    
    const renderList = (searchTerm = "") => {
      const term = searchTerm.toLowerCase();
      const filtered = data.students.filter(s => 
        s.displayName.toLowerCase().includes(term) || s.username.toLowerCase().includes(term)
      );
      
      if (!filtered.length) {
        listRoot.innerHTML = `<p class="emptyState">Không tìm thấy học sinh.</p>`;
        return;
      }
      
      listRoot.innerHTML = `<p class="authHint">Danh sách học sinh (${filtered.length})</p>
      <div class="studentListItems">
        ${filtered.map(student => {
          const avatar = escapeHtml(student.displayName.charAt(0).toUpperCase());
          return `<button class="studentRow" type="button" data-student-id="${student.id}">
            <div class="studentAvatar">${avatar}</div>
            <div class="studentInfo">
              <b>${escapeHtml(student.displayName)}</b>
              <span>@${escapeHtml(student.username)} · ${formatUpdatedAt(student.updatedAt)}</span>
            </div>
            <div class="studentBadges">
              <span class="badge blue">${student.responseCount} CH</span>
              <span class="badge orange">${student.expenseCount} GD</span>
            </div>
          </button>`;
        }).join("")}
      </div>`;
      
      listRoot.querySelectorAll("[data-student-id]").forEach(button => button.addEventListener("click", (e) => {
        listRoot.querySelectorAll(".studentRow").forEach(btn => btn.classList.remove("active"));
        e.currentTarget.classList.add("active");
        openStudentWork(e.currentTarget.dataset.studentId);
      }));
    };
    
    renderList();
    
    const searchInput = $("#teacherSearchInput");
    if (searchInput) {
      searchInput.value = "";
      searchInput.oninput = (e) => renderList(e.target.value);
    }
  } catch (error) {
    listRoot.innerHTML = `<p class="emptyState authError">${escapeHtml(error.message)}</p>`;
  }
}

function answerList(title, answers, bank) {
  const entries = Object.entries(answers || {});
  return `<section class="qaSection"><h4>${title}</h4>${entries.length ? `<div class="qaGrid">${entries.map(([index, answer]) => {
    const qIndex = Number(index);
    const questionText = bank && bank[qIndex] ? bank[qIndex].q : `Câu ${qIndex + 1}`;
    return `<div class="qaCard">
      <div class="qaQuestion"><b>Q:</b> ${escapeHtml(questionText)}</div>
      <div class="qaAnswer"><b>A:</b> ${escapeHtml(answer)}</div>
    </div>`;
  }).join("")}</div>` : `<p class="authHint">Học sinh chưa trả lời phần này.</p>`}</section>`;
}

async function openStudentWork(studentId) {
  const detailRoot = $("#teacherStudentDetail");
  detailRoot.innerHTML = `<p class="loadingState">Đang mở bài làm...</p>`;
  try {
    const data = await api(`/api/teacher/students/${studentId}`);
    const journalRows = (data.state?.journal || []).flatMap((entries, dayIndex) => entries.filter(entry => entry.item || Number(entry.amount) || entry.note).map(entry => `<tr><td>Ngày ${dayIndex + 1}</td><td>${escapeHtml(entry.item || "—")}</td><td class="moneyText">${money(entry.amount)}</td><td><span class="statusTag ${entry.kind === 'Nhu cầu' ? 'need' : 'want'}">${escapeHtml(entry.kind)}</span></td><td>${escapeHtml(entry.note || "—")}</td></tr>`));
    const avatar = escapeHtml(data.student.displayName.charAt(0).toUpperCase());
    
    detailRoot.innerHTML = data.state
      ? `<div class="studentDetailHeader">
           <div class="headerProfile">
             <div class="headerAvatar">${avatar}</div>
             <div>
               <h3>${escapeHtml(data.student.displayName)}</h3>
               <p class="authHint">@${escapeHtml(data.student.username)} · Đã hoàn thành <b>${data.state.completed.length}/6</b> chặng</p>
             </div>
           </div>
           <button class="ghost" onclick="print()">In bài làm</button>
         </div>
         <div class="teacherDetailScroll">
           ${answerList("Phần Quảng cáo", data.state.adResponses, adBank)}
           ${answerList("Phần Tình huống", data.state.sitResponses, situationBank)}
           <section class="journalSection">
             <h4>Nhật ký 7 ngày</h4>
             ${journalRows.length ? `<table class="journalPreview"><thead><tr><th>NGÀY</th><th>KHOẢN CHI</th><th style="text-align:right">SỐ TIỀN</th><th>LOẠI</th><th>GHI CHÚ</th></tr></thead><tbody>${journalRows.join("")}</tbody></table>` : `<p class="authHint">Học sinh chưa ghi khoản chi nào.</p>`}
           </section>
         </div>`
      : `<div class="emptyState"><div class="contextIcon">📄</div><p>Học sinh này chưa lưu bài làm trên hệ thống.</p></div>`;
  } catch (error) {
    detailRoot.innerHTML = `<div class="emptyState authError"><p>${escapeHtml(error.message)}</p></div>`;
  }
}

$("#clearJournal").addEventListener("click", () => { state.journal = defaultJournal(); save(); renderJournal(); });
$("#downloadJournal").addEventListener("click", () => {
  if (!state.completed.includes(5)) state.completed.push(5);
  save();
  updateNav();
  const content = state.journal.map((entries, dayIndex) => {
    const lines = entries.filter(entry => entry.item || Number(entry.amount) || entry.note).map((entry, index) => `  ${index + 1}. ${entry.item || "Chưa ghi"} | ${money(entry.amount)} | ${entry.kind} | ${entry.note || "—"}`);
    return `${days[dayIndex]}:\n${lines.length ? lines.join("\n") : "  Chưa có khoản chi"}`;
  }).join("\n\n");
  download("nhat-ki-7-ngay.txt", `NHẬT KÍ 7 NGÀY TIÊU DÙNG THÔNG MINH\n\n${content}`);
});

$("#authButton").addEventListener("click", () => openAuthModal());
$("#logoutButton").addEventListener("click", logout);
if ($("#teacherButton")) $("#teacherButton").addEventListener("click", openTeacherDashboard);
if ($("#refreshTeacherBtn")) $("#refreshTeacherBtn").addEventListener("click", openTeacherDashboard);

setupNav();
renderJournal();
go(state.active);
initialiseAccount();
