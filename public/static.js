const steps = ["Trang chủ", "Mục tiêu", "Bài học", "Quảng cáo", "Tình huống", "Vận dụng"];

const ads = [
  { tag: "FLASH SALE", title: "Trà sữa đồng giá 9.000đ", copy: "Đặt ngay trong 5 phút — số lượng có hạn!", q: "Em cần làm gì trước khi đặt mua?", o: ["Đặt ngay vì giá rẻ", "Kiểm tra cửa hàng, đánh giá, phí giao và nguyên liệu", "Rủ bạn đặt càng nhiều càng tốt", "Chỉ xem ảnh là đủ"], a: 1, f: "Em đã nhìn xa hơn mức giá: kiểm tra độ tin cậy, chất lượng và chi phí phát sinh." },
  { tag: "CHỈ HÔM NAY", title: "Mua 2 áo giảm 20%", copy: "Ưu đãi kết thúc lúc nửa đêm!", q: "Cách xử lí nào hợp lí nhất?", o: ["Mua ngay 2 áo", "Không bao giờ mua đồ giảm giá", "Xem mình có cần áo, kiểm tra chất lượng và khả năng chi trả", "Mua nhiều vì sợ hết"], a: 2, f: "Khuyến mãi không xấu, nhưng mua quá nhu cầu vẫn là lãng phí." },
  { tag: "HÀNG NHẬP", title: "Giày cao cấp, giá rẻ bất ngờ", copy: "Không cần bảo hành — chốt đơn ngay!", q: "Dấu hiệu nào cần cẩn thận?", o: ["Sản phẩm là giày", "Màu sản phẩm đẹp", "Giá rẻ bất ngờ nhưng không có bảo hành rõ ràng", "Có nhiều ảnh"], a: 2, f: "Cần kiểm tra nguồn gốc, chất lượng, chính sách đổi trả và bảo hành." },
  { tag: "SIÊU RẺ", title: "Hải sản chế biến sẵn", copy: "Rẻ hơn nhiều so với hàng tươi sống!", q: "Thông tin nào quan trọng nhất?", o: ["Nguồn gốc, hạn dùng, nơi bán và cách bảo quản", "Chỉ cần giá rẻ", "Bao bì đẹp", "Bạn bè nói ngon"], a: 0, f: "Thực phẩm ảnh hưởng trực tiếp tới sức khỏe, vì vậy an toàn luôn là ưu tiên." }
];

const situations = [
  { title: "100.000đ mua đồ dùng học tập", copy: "H được mẹ đưa tiền mua vở và bút nhưng lại thấy một món đồ chơi rất đẹp.", q: "Em sẽ khuyên H thế nào?", o: ["Mua đồ chơi trước", "Thích thì cứ mua", "Ưu tiên vở và bút; còn tiền mới cân nhắc món khác", "Không mua gì"], a: 2, f: "Ưu tiên nhu cầu thiết yếu là biểu hiện của tiêu dùng có kế hoạch." },
  { title: "Chiếc bình nước đang ‘hot’", copy: "M vẫn có bình nước dùng tốt nhưng muốn mua bình mới vì sợ bị cho là lỗi thời.", q: "M nên làm gì?", o: ["Mua để giống bạn", "Không mua vì bình cũ vẫn tốt", "Mua hai chiếc", "Vay tiền để mua"], a: 1, f: "Biết phân biệt nhu cầu thật và mong muốn nhất thời là một kĩ năng quan trọng." },
  { title: "Hàng nội hay hàng ngoại?", copy: "N cho rằng hàng ngoại luôn tốt hơn, dù có cặp Việt Nam chất lượng tốt và giá phù hợp.", q: "Em có đồng ý với N không?", o: ["Đồng ý hoàn toàn", "Không; cần so chất lượng, giá, nguồn gốc và nhu cầu", "Đồng ý vì hàng ngoại sang hơn", "Thích gì mua nấy"], a: 1, f: "Đánh giá sản phẩm bằng chất lượng và độ phù hợp, không phải định kiến xuất xứ." },
  { title: "Tai nghe giảm giá 50%", copy: "T đã có tai nghe dùng tốt nhưng muốn mua thêm vì sợ hết khuyến mãi.", q: "T nên làm gì?", o: ["Mua ngay", "Mua hai chiếc", "Kiểm tra nhu cầu, chất lượng và kế hoạch chi tiêu", "Nhờ bạn mua hộ"], a: 2, f: "Giảm giá không tạo ra nhu cầu. Nếu không cần, mua rẻ vẫn là tốn tiền." },
  { title: "Thực phẩm online siêu rẻ", copy: "Món hải sản không ghi rõ nguồn gốc và hạn sử dụng.", q: "P nên làm gì?", o: ["Mua ngay", "Hỏi đủ thông tin; không rõ thì không mua", "Mua thử một ít", "Rủ bạn mua chung"], a: 1, f: "Với thực phẩm, không nên ham rẻ mà bỏ qua an toàn sức khỏe." }
];

const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const blankExpense = () => ({ item: "", amount: "", kind: "Nhu cầu", note: "" });
const defaultJournal = () => days.map(() => [blankExpense()]);

let state = { active: 0, completed: [], ad: 0, adAnswers: {}, sit: 0, sitAnswers: {}, journal: defaultJournal() };
try {
  const saved = JSON.parse(localStorage.getItem("smart-consumer-static") || "{}");
  state = { ...state, ...saved };
  state.active = Math.min(Number(state.active) || 0, 5);
  const oldCompleted = Array.isArray(state.completed) ? state.completed : [];
  state.completed = oldCompleted.filter(i => i >= 0 && i <= 4);
  if (oldCompleted.includes(7) && !state.completed.includes(5)) state.completed.push(5);
  if (!Array.isArray(state.journal) || state.journal.length !== days.length) state.journal = defaultJournal();
  state.journal = state.journal.map(day => {
    if (Array.isArray(day)) return day.length ? day : [blankExpense()];
    return day && typeof day === "object" ? [{ ...blankExpense(), ...day }] : [blankExpense()];
  });
} catch (_) {
  state.journal = defaultJournal();
}

const $ = selector => document.querySelector(selector);
const money = value => `${(Number(value) || 0).toLocaleString("vi-VN")}đ`;
const escapeHtml = value => String(value ?? "").replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));

function save() {
  localStorage.setItem("smart-consumer-static", JSON.stringify(state));
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
  if (state.active === 3) renderAd();
  if (state.active === 4) renderSituation();
  if (state.active === 5) renderJournal();
}

function complete(index, next = index + 1) {
  if (!state.completed.includes(index)) state.completed.push(index);
  save();
  go(next);
}

document.querySelectorAll("[data-complete]").forEach(button => button.addEventListener("click", () => complete(Number(button.dataset.complete))));

function questionHtml(data, index, total, selected) {
  const answered = selected !== undefined;
  return `<div class="question"><div class="meta"><span>CÂU ${index + 1}/${total}</span><span>${"●".repeat(index + 1)}${"○".repeat(total - index - 1)}</span></div><h3>${data.q}</h3><div class="options">${data.o.map((option, optionIndex) => `<button data-answer="${optionIndex}" ${answered ? "disabled" : ""} class="${answered ? (optionIndex === data.a ? "correct" : optionIndex === selected ? "wrong" : "") : ""}"><b>${String.fromCharCode(65 + optionIndex)}</b>${option}</button>`).join("")}</div>${answered ? `<div class="feedback"><b>${selected === data.a ? "Lựa chọn rất hợp lí!" : "Mình cùng xem lại nhé!"}</b><p>${data.f}</p><button data-next>${index === total - 1 ? "Hoàn thành phần này →" : "Câu tiếp theo →"}</button></div>` : ""}</div>`;
}

function renderAd() {
  const root = $("#adActivity");
  const data = ads[state.ad];
  const selected = state.adAnswers[state.ad];
  root.innerHTML = `<div class="promo"><span>${data.tag}</span><div class="emoji">🛍️</div><h3>${data.title}</h3><p>${data.copy}</p><small>* Quảng cáo giả định</small></div>${questionHtml(data, state.ad, ads.length, selected)}`;
  root.querySelectorAll("[data-answer]").forEach(button => button.addEventListener("click", () => {
    state.adAnswers[state.ad] = Number(button.dataset.answer);
    save();
    renderAd();
  }));
  const nextButton = root.querySelector("[data-next]");
  if (nextButton) nextButton.addEventListener("click", () => {
    if (state.ad < ads.length - 1) {
      state.ad += 1;
      save();
      renderAd();
    } else complete(3);
  });
}

function renderSituation() {
  const root = $("#situationActivity");
  const data = situations[state.sit];
  const selected = state.sitAnswers[state.sit];
  root.innerHTML = `<div class="story"><span>TÌNH HUỐNG ${state.sit + 1}</span><h3>${data.title}</h3><p>${data.copy}</p></div>${questionHtml(data, state.sit, situations.length, selected)}`;
  root.querySelectorAll("[data-answer]").forEach(button => button.addEventListener("click", () => {
    state.sitAnswers[state.sit] = Number(button.dataset.answer);
    save();
    renderSituation();
  }));
  const nextButton = root.querySelector("[data-next]");
  if (nextButton) nextButton.addEventListener("click", () => {
    if (state.sit < situations.length - 1) {
      state.sit += 1;
      save();
      renderSituation();
    } else complete(4);
  });
}

function updateJournalSummary() {
  const entries = state.journal.flat().filter(entry => entry.item || Number(entry.amount) || entry.note);
  $("#weekTotal").textContent = money(entries.reduce((total, entry) => total + (Number(entry.amount) || 0), 0));
  $("#needCount").textContent = entries.filter(entry => entry.kind === "Nhu cầu").length;
  $("#wantCount").textContent = entries.filter(entry => entry.kind === "Mong muốn").length;
}

function renderJournal() {
  const root = $("#journalDays");
  root.innerHTML = days.map((day, dayIndex) => {
    const entries = state.journal[dayIndex];
    const subtotal = entries.reduce((total, entry) => total + (Number(entry.amount) || 0), 0);
    return `<section class="dayCard" data-day="${dayIndex}"><div class="dayHead"><div><span>NGÀY ${dayIndex + 1}/7</span><h3>${day}</h3></div><b>${money(subtotal)}</b></div><div class="expenseList">${entries.map((entry, entryIndex) => `<div class="expenseRow" data-entry="${entryIndex}"><label class="expenseName"><span>Khoản chi</span><input data-field="item" value="${escapeHtml(entry.item)}" placeholder="Ví dụ: mua bút, trà sữa..."></label><label><span>Số tiền</span><input data-field="amount" type="number" min="0" inputmode="numeric" value="${escapeHtml(entry.amount)}" placeholder="0"></label><label><span>Phân loại</span><select data-field="kind"><option ${entry.kind === "Nhu cầu" ? "selected" : ""}>Nhu cầu</option><option ${entry.kind === "Mong muốn" ? "selected" : ""}>Mong muốn</option></select></label><label class="expenseNote"><span>Em có hài lòng? Vì sao?</span><input data-field="note" value="${escapeHtml(entry.note)}" placeholder="Ghi nhận xét ngắn"></label><button class="removeExpense" type="button" data-remove="${entryIndex}" aria-label="Xóa khoản chi">×</button></div>`).join("")}</div><button class="addExpense" type="button" data-add="${dayIndex}">＋ Thêm một khoản chi</button></section>`;
  }).join("");

  root.querySelectorAll("input, select").forEach(control => control.addEventListener("input", () => {
    const dayCard = control.closest(".dayCard");
    const expenseRow = control.closest(".expenseRow");
    state.journal[Number(dayCard.dataset.day)][Number(expenseRow.dataset.entry)][control.dataset.field] = control.value;
    save();
    updateJournalSummary();
    const subtotal = state.journal[Number(dayCard.dataset.day)].reduce((total, entry) => total + (Number(entry.amount) || 0), 0);
    dayCard.querySelector(".dayHead > b").textContent = money(subtotal);
  }));

  root.querySelectorAll("[data-add]").forEach(button => button.addEventListener("click", () => {
    state.journal[Number(button.dataset.add)].push(blankExpense());
    save();
    renderJournal();
  }));

  root.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", () => {
    const dayIndex = Number(button.closest(".dayCard").dataset.day);
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

$("#clearJournal").addEventListener("click", () => {
  state.journal = defaultJournal();
  save();
  renderJournal();
});

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

setupNav();
renderJournal();
go(state.active);
