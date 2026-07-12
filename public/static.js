const steps = ["Trang chủ", "Mục tiêu", "Bài học", "Quảng cáo", "Tình huống", "Vận dụng"];
const QUESTION_COUNT = 5;

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

let state = { active: 0, completed: [], adSet: [], adPosition: 0, adResponses: {}, sitSet: [], sitPosition: 0, sitResponses: {}, journal: defaultJournal() };
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

function save() { localStorage.setItem("smart-consumer-static", JSON.stringify(state)); }

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
  root.innerHTML = `<div class="openQuestion"><div class="meta"><span>CÂU ${position + 1}/${QUESTION_COUNT}</span><span>${"●".repeat(position + 1)}${"○".repeat(QUESTION_COUNT - position - 1)}</span></div><h3>${question.title}</h3><p>${question.copy}</p><div class="hintBox"><b>Gợi ý</b><span>${question.hint}</span></div><label>Trả lời của em<textarea id="openResponse" placeholder="Viết suy nghĩ và cách xử lí của em ở đây...">${escapeHtml(response)}</textarea></label><div class="openActions"><small>Hãy nêu rõ lí do cho lựa chọn của em.</small><button class="primary" id="saveOpenAnswer" ${response.trim().length < 8 ? "disabled" : ""}>${position === QUESTION_COUNT - 1 ? "Lưu câu trả lời" : "Lưu & câu tiếp theo →"}</button></div></div>`;
  const textarea = root.querySelector("#openResponse");
  const saveButton = root.querySelector("#saveOpenAnswer");
  textarea.addEventListener("input", () => { saveButton.disabled = textarea.value.trim().length < 8; });
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

setupNav();
renderJournal();
go(state.active);
