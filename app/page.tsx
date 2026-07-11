"use client";

import { useEffect, useMemo, useState } from "react";

const steps = ["Trang chủ", "Mục tiêu", "Bài học", "Quảng cáo", "Tình huống", "Kế hoạch chi tiêu", "Quiz", "Vận dụng"];

const objectives = [
  ["01", "Hiểu đúng", "Nhận biết tiêu dùng thông minh và những lợi ích thiết thực."],
  ["02", "Kiểm chứng", "Nhận diện quảng cáo và kiểm tra thông tin trước khi mua."],
  ["03", "Ra quyết định", "Đánh giá hành vi tiêu dùng trong các tình huống đời sống."],
  ["04", "Lập kế hoạch", "Cân đối nhu cầu, mong muốn và khả năng tài chính."],
  ["05", "Hành động", "Thực hiện hành vi tiêu dùng thông minh mỗi ngày."],
  ["06", "Lan tỏa", "Khích lệ người thân, bạn bè cùng tiêu dùng có trách nhiệm."],
];

const lessonCards = [
  { icon: "?", title: "Tiêu dùng thông minh là gì?", text: "Là biết lựa chọn, mua sắm và sử dụng sản phẩm hợp lí: đúng nhu cầu, vừa khả năng tài chính, bảo đảm chất lượng, an toàn và tránh lãng phí.", tip: "Trước khi mua, hãy dừng lại 10 giây và hỏi: Mình cần hay chỉ đang muốn?" },
  { icon: "+", title: "Lợi ích", text: "Giúp tiết kiệm tiền và thời gian, bảo vệ sức khỏe, quyền lợi; đồng thời hình thành thói quen quản lí tài chính tốt.", tip: "Một quyết định tốt hôm nay sẽ tạo nên thói quen tốt ngày mai." },
  { icon: "✓", title: "6 bước mua thông minh", text: "Xác định nhu cầu → tìm hiểu → so sánh → cân nhắc khả năng chi trả → kiểm tra quảng cáo → theo đúng kế hoạch.", tip: "Đừng chỉ so giá. Hãy so cả chất lượng, nguồn gốc, đổi trả và bảo hành." },
  { icon: "!", title: "Điều cần tránh", text: "Mua theo cảm xúc, chạy theo bạn bè, ham khuyến mãi, ham rẻ không rõ nguồn gốc hoặc chi tiêu không có kế hoạch.", tip: "Khuyến mãi chỉ tiết kiệm khi đó là món em thật sự cần." },
];

const ads = [
  { tag: "FLASH SALE", title: "Trà sữa đồng giá 9.000đ", copy: "Đặt ngay trong 5 phút — số lượng có hạn!", q: "Em cần làm gì trước khi đặt mua?", options: ["Đặt ngay vì giá rẻ", "Kiểm tra cửa hàng, đánh giá, phí giao và nguyên liệu", "Rủ bạn đặt càng nhiều càng tốt", "Chỉ xem ảnh là đủ"], answer: 1, feedback: "Em đã nhìn xa hơn mức giá: kiểm tra độ tin cậy, chất lượng và cả chi phí phát sinh." },
  { tag: "CHỈ HÔM NAY", title: "Mua 2 áo giảm 20%", copy: "Ưu đãi kết thúc lúc nửa đêm!", q: "Cách xử lí nào hợp lí nhất?", options: ["Mua ngay 2 áo", "Không bao giờ mua đồ giảm giá", "Xem mình có cần áo, kiểm tra chất lượng và khả năng chi trả", "Mua nhiều vì sợ hết"], answer: 2, feedback: "Khuyến mãi không xấu, nhưng mua quá nhu cầu vẫn là lãng phí." },
  { tag: "HÀNG NHẬP", title: "Giày cao cấp, giá rẻ bất ngờ", copy: "Không cần bảo hành — chốt đơn ngay!", q: "Dấu hiệu nào cần cẩn thận?", options: ["Sản phẩm là giày", "Màu sản phẩm đẹp", "Giá rẻ bất ngờ nhưng không có bảo hành rõ ràng", "Có nhiều ảnh"], answer: 2, feedback: "Cần kiểm tra nguồn gốc, chất lượng, chính sách đổi trả và bảo hành." },
  { tag: "SIÊU RẺ", title: "Hải sản chế biến sẵn", copy: "Rẻ hơn nhiều so với hàng tươi sống!", q: "Thông tin nào quan trọng nhất?", options: ["Nguồn gốc, hạn dùng, nơi bán và cách bảo quản", "Chỉ cần giá rẻ", "Bao bì đẹp", "Bạn bè nói ngon"], answer: 0, feedback: "Thực phẩm ảnh hưởng trực tiếp tới sức khỏe, vì vậy an toàn luôn là ưu tiên." },
];

const situations = [
  { title: "100.000đ mua đồ dùng học tập", text: "H được mẹ đưa tiền mua vở và bút nhưng lại thấy một món đồ chơi rất đẹp.", q: "Em sẽ khuyên H thế nào?", options: ["Mua đồ chơi trước", "Thích thì cứ mua", "Ưu tiên vở và bút; còn tiền mới cân nhắc món khác", "Không mua gì"], answer: 2, feedback: "Ưu tiên nhu cầu thiết yếu là biểu hiện của tiêu dùng có kế hoạch." },
  { title: "Chiếc bình nước đang ‘hot’", text: "M vẫn có bình nước dùng tốt nhưng muốn mua bình mới vì sợ bị cho là lỗi thời.", q: "M nên làm gì?", options: ["Mua để giống bạn", "Không mua vì bình cũ vẫn tốt", "Mua hai chiếc", "Vay tiền để mua"], answer: 1, feedback: "Biết phân biệt nhu cầu thật và mong muốn nhất thời là một kĩ năng quan trọng." },
  { title: "Hàng nội hay hàng ngoại?", text: "N cho rằng hàng ngoại luôn tốt hơn, dù có cặp Việt Nam chất lượng tốt và giá phù hợp.", q: "Em có đồng ý với N không?", options: ["Đồng ý hoàn toàn", "Không; cần so chất lượng, giá, nguồn gốc và nhu cầu", "Đồng ý vì hàng ngoại sang hơn", "Thích gì mua nấy"], answer: 1, feedback: "Sản phẩm nên được đánh giá bằng chất lượng và độ phù hợp, không phải định kiến xuất xứ." },
  { title: "Tai nghe giảm giá 50%", text: "T đã có tai nghe dùng tốt nhưng muốn mua thêm vì sợ hết khuyến mãi.", q: "T nên làm gì?", options: ["Mua ngay", "Mua hai chiếc", "Kiểm tra nhu cầu, chất lượng và kế hoạch chi tiêu", "Nhờ bạn mua hộ"], answer: 2, feedback: "Giảm giá không tạo ra nhu cầu. Nếu không cần, mua rẻ vẫn là tốn tiền." },
  { title: "Thực phẩm online siêu rẻ", text: "Món hải sản không ghi rõ nguồn gốc và hạn sử dụng.", q: "P nên làm gì?", options: ["Mua ngay", "Hỏi đủ thông tin; không rõ thì không mua", "Mua thử một ít", "Rủ bạn mua chung"], answer: 1, feedback: "Với thực phẩm, không nên ham rẻ mà bỏ qua an toàn sức khỏe." },
];

const quiz = [
  ["Tiêu dùng thông minh là gì?", ["Mua thật nhiều khi có tiền", "Mua theo sở thích", "Lựa chọn phù hợp nhu cầu, tài chính và an toàn", "Chỉ mua hàng đắt"], 2],
  ["Đâu là biểu hiện tiêu dùng thông minh?", ["Mua vì bạn bè đều mua", "Kiểm tra thông tin trước khi mua", "Mua nhiều lúc giảm giá", "Chọn rẻ nhất, bỏ qua nguồn gốc"], 1],
  ["Quảng cáo nói ‘giảm sốc, chỉ còn 5 phút’. Em nên?", ["Mua ngay", "Chia sẻ để bạn cùng mua", "Bình tĩnh kiểm tra sản phẩm, nơi bán, giá và nhu cầu", "Mua nhiều dự trữ"], 2],
  ["Lợi ích của tiêu dùng thông minh?", ["Mua phù hợp, tiết kiệm và bảo vệ quyền lợi", "Mua nhiều nhất", "Theo xu hướng nhanh", "Không cần lập kế hoạch"], 0],
  ["Hành vi nào kém thông minh?", ["So sánh giá", "Đọc bao bì", "Mua đồ ăn rẻ không rõ nguồn gốc", "Mua đúng nhu cầu"], 2],
  ["Khi lập kế hoạch chi tiêu, nên làm gì trước?", ["Mua món thích nhất", "Xác định số tiền và mục tiêu", "Xem bạn mua gì", "Chọn đồ đắt nhất"], 1],
  ["Khi mua thực phẩm cần kiểm tra?", ["Bao bì đẹp", "Quảng cáo hấp dẫn", "Nguồn gốc, hạn dùng, thành phần, bảo quản", "Nhiều người mua"], 2],
  ["Mua theo cảm xúc có thể dẫn đến?", ["Tiết kiệm", "Mua thứ không cần và hỏng kế hoạch", "Luôn mua hàng tốt", "Không ảnh hưởng"], 1],
  ["Bạn muốn mua món đang ‘hot’ dù không cần. Em nên?", ["Khuyên bạn xem lại nhu cầu và khả năng chi trả", "Rủ mua thêm", "Chê bai", "Không quan tâm"], 0],
  ["Cách tiêu dùng thông minh là?", ["Tìm hiểu, dùng an toàn, nhận diện quảng cáo và thanh toán phù hợp", "Mua theo người nổi tiếng", "Mua càng nhanh càng tốt", "Chỉ quan tâm mẫu mã"], 0],
] as const;

const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

type JournalRow = { item: string; amount: string; kind: string; note: string };

export default function Home() {
  const [active, setActive] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [points, setPoints] = useState(0);
  const [openGoal, setOpenGoal] = useState<number | null>(null);
  const [lesson, setLesson] = useState(0);
  const [adIndex, setAdIndex] = useState(0);
  const [adAnswers, setAdAnswers] = useState<Record<number, number>>({});
  const [sitIndex, setSitIndex] = useState(0);
  const [sitAnswers, setSitAnswers] = useState<Record<number, number>>({});
  const [money, setMoney] = useState(300000);
  const [goal, setGoal] = useState("Tiết kiệm mua quà cho mẹ");
  const [need, setNeed] = useState(80000);
  const [saving, setSaving] = useState(100000);
  const [want, setWant] = useState(50000);
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizDone, setQuizDone] = useState(false);
  const [journal, setJournal] = useState<JournalRow[]>(days.map(() => ({ item: "", amount: "", kind: "Nhu cầu", note: "" })));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("smart-consumer") || "{}");
      if (saved.completed) setCompleted(saved.completed);
      if (saved.points) setPoints(saved.points);
      if (saved.money) setMoney(saved.money);
      if (saved.goal) setGoal(saved.goal);
      if (saved.need !== undefined) setNeed(saved.need);
      if (saved.saving !== undefined) setSaving(saved.saving);
      if (saved.want !== undefined) setWant(saved.want);
      if (saved.journal) setJournal(saved.journal);
    } catch { /* keep friendly defaults */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("smart-consumer", JSON.stringify({ completed, points, money, goal, need, saving, want, journal }));
  }, [completed, points, money, goal, need, saving, want, journal, loaded]);

  const progress = Math.round((completed.length / steps.length) * 100);
  const total = need + saving + want;
  const remaining = money - total;
  const quizScore = useMemo(() => quiz.reduce((sum, q, i) => sum + (quizAnswers[i] === q[2] ? 1 : 0), 0), [quizAnswers]);

  function goTo(index: number) {
    setActive(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finish(index: number, next = index + 1) {
    if (!completed.includes(index)) setCompleted((x) => [...x, index]);
    if (next < steps.length) goTo(next);
  }

  function answerAd(choice: number) {
    if (adAnswers[adIndex] !== undefined) return;
    setAdAnswers((x) => ({ ...x, [adIndex]: choice }));
    if (choice === ads[adIndex].answer) setPoints((x) => x + 10);
  }

  function answerSituation(choice: number) {
    if (sitAnswers[sitIndex] !== undefined) return;
    setSitAnswers((x) => ({ ...x, [sitIndex]: choice }));
    if (choice === situations[sitIndex].answer) setPoints((x) => x + 10);
  }

  function download(name: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  }

  function updateJournal(index: number, field: keyof JournalRow, value: string) {
    setJournal((rows) => rows.map((row, i) => i === index ? { ...row, [field]: value } : row));
  }

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={() => goTo(0)} aria-label="Về trang chủ">
          <span className="brandMark">S</span><span>SMART<br/><b>CONSUMER</b></span>
        </button>
        <div className="headerProgress" aria-label={`Tiến độ ${progress}%`}>
          <div className="progressText"><span>Hành trình của em</span><b>{progress}%</b></div>
          <div className="progressTrack"><i style={{ width: `${progress}%` }} /></div>
        </div>
        <div className="points"><span>★</span><div><b>{points}</b><small>điểm thông minh</small></div></div>
      </header>

      <nav className="stepNav" aria-label="Các phần bài học">
        {steps.map((s, i) => <button key={s} className={`${active === i ? "active" : ""} ${completed.includes(i) ? "done" : ""}`} onClick={() => goTo(i)}><span>{completed.includes(i) ? "✓" : i + 1}</span>{s}</button>)}
      </nav>

      <div className="pageShell">
        {active === 0 && <section className="hero sectionPanel">
          <div className="heroCopy">
            <div className="eyebrow">GDCD 9 · BÀI HỌC TƯƠNG TÁC</div>
            <h1>Tiêu dùng<br/><em>thông minh.</em></h1>
            <p>Mỗi ngày em đều đưa ra quyết định mua sắm. Hãy học cách chọn đúng nhu cầu, kiểm tra thông tin và chi tiêu có kế hoạch.</p>
            <div className="motto"><span>01</span> Mua đúng nhu cầu <i/> <span>02</span> Kiểm tra thông tin <i/> <span>03</span> Chi tiêu có kế hoạch</div>
            <div className="actions"><button className="primary" onClick={() => finish(0)}>Bắt đầu hành trình <b>→</b></button><button className="secondary" onClick={() => goTo(1)}>Xem mục tiêu</button></div>
          </div>
          <div className="heroVisual" aria-label="Minh họa kế hoạch chi tiêu">
            <div className="orbit orbitOne"/><div className="orbit orbitTwo"/>
            <div className="walletCard"><div className="cardTop"><span>NGÂN SÁCH TUẦN</span><b>•••</b></div><strong>300.000<small>đ</small></strong><div className="miniChart"><i/><i/><i/><i/><i/></div><div className="cardBottom"><span>CẦN THIẾT<br/><b>50%</b></span><span>TIẾT KIỆM<br/><b>30%</b></span><span>SỞ THÍCH<br/><b>20%</b></span></div></div>
            <div className="floatTag tagOne"><span>✓</span> Đúng nhu cầu</div><div className="floatTag tagTwo"><span>★</span> +10 thông minh</div>
          </div>
        </section>}

        {active === 1 && <section className="sectionPanel learningSection">
          <SectionHead number="01" label="MỤC TIÊU" title="Sau bài học này, em có thể..." desc="Chạm vào từng mục tiêu để xem điều em sẽ chinh phục." />
          <div className="goalGrid">{objectives.map((g, i) => <button key={g[0]} className={`goalCard ${openGoal === i ? "open" : ""}`} onClick={() => setOpenGoal(openGoal === i ? null : i)}><span className="goalNo">{g[0]}</span><div><h3>{g[1]}</h3><p>{g[2]}</p></div><b>{openGoal === i ? "−" : "+"}</b></button>)}</div>
          <Continue onClick={() => finish(1)} label="Tôi đã hiểu mục tiêu" />
        </section>}

        {active === 2 && <section className="sectionPanel learningSection">
          <SectionHead number="02" label="BÀI HỌC" title="Bộ công cụ của người mua thông minh" desc="Kiến thức cốt lõi, ngắn gọn và gần với cuộc sống của em." />
          <div className="lessonTabs">{lessonCards.map((x, i) => <button key={x.title} className={lesson === i ? "active" : ""} onClick={() => setLesson(i)}><span>{x.icon}</span>{x.title}</button>)}</div>
          <div className="lessonFocus"><div className="focusIcon">{lessonCards[lesson].icon}</div><div><span className="miniLabel">KIẾN THỨC {lesson + 1}/4</span><h2>{lessonCards[lesson].title}</h2><p>{lessonCards[lesson].text}</p><div className="smartTip"><b>Gợi ý thông minh</b>{lessonCards[lesson].tip}</div></div></div>
          <div className="quickCheck"><div><span>KIỂM TRA NHANH</span><b>Mua nhiều chỉ vì đang giảm giá có phải là tiêu dùng thông minh?</b></div><button onClick={(e) => { e.currentTarget.parentElement?.classList.add("revealed"); }}>Xem đáp án</button><p>Chưa chắc. Nếu món đồ không cần thiết, mua rẻ vẫn là lãng phí.</p></div>
          <Continue onClick={() => finish(2)} label="Tiếp tục đến Quảng cáo" />
        </section>}

        {active === 3 && <section className="sectionPanel learningSection">
          <SectionHead number="03" label="QUẢNG CÁO" title="Đừng mua chỉ vì thấy hấp dẫn!" desc="Nhìn kĩ quảng cáo, phát hiện tín hiệu gây vội vàng và chọn cách kiểm chứng." />
          <div className="activityLayout">
            <div className="adMock"><div className="adStripe">{ads[adIndex].tag}</div><div className="adEmoji">🛍️</div><h2>{ads[adIndex].title}</h2><p>{ads[adIndex].copy}</p><button>ĐẶT NGAY</button><small>* Nội dung quảng cáo giả định</small></div>
            <QuestionCard index={adIndex} total={ads.length} question={ads[adIndex].q} options={ads[adIndex].options} answer={ads[adIndex].answer} selected={adAnswers[adIndex]} feedback={ads[adIndex].feedback} onAnswer={answerAd} onNext={() => adIndex < ads.length - 1 ? setAdIndex(adIndex + 1) : finish(3)} lastLabel="Hoàn thành phần Quảng cáo" />
          </div>
          <div className="checklist"><b>5 điều cần kiểm tra trước khi mua</b>{["Mình thật sự cần?", "Nguồn gốc rõ ràng?", "Giá cả hợp lí?", "Có bảo hành, đổi trả?", "Vừa khả năng chi trả?"].map((x, i) => <span key={x}><i>{i + 1}</i>{x}</span>)}</div>
        </section>}

        {active === 4 && <section className="sectionPanel learningSection">
          <SectionHead number="04" label="TÌNH HUỐNG" title="Em sẽ xử lí như thế nào?" desc="Không cần quyết định thật nhanh. Hãy đọc, suy nghĩ và chọn cách hợp lí nhất." />
          <div className="scenarioCard"><div className="scenarioStory"><span>TÌNH HUỐNG {sitIndex + 1}</span><h2>{situations[sitIndex].title}</h2><p>{situations[sitIndex].text}</p><div className="storyIcon">💭</div></div><QuestionCard index={sitIndex} total={situations.length} question={situations[sitIndex].q} options={situations[sitIndex].options} answer={situations[sitIndex].answer} selected={sitAnswers[sitIndex]} feedback={situations[sitIndex].feedback} onAnswer={answerSituation} onNext={() => sitIndex < situations.length - 1 ? setSitIndex(sitIndex + 1) : finish(4)} lastLabel="Xem tổng kết quyết định" /></div>
        </section>}

        {active === 5 && <section className="sectionPanel learningSection">
          <SectionHead number="05" label="KẾ HOẠCH CHI TIÊU" title="Mỗi đồng tiền đều có một nhiệm vụ" desc="Cân đối khoản cần thiết, tiết kiệm và sở thích trong ngân sách tuần của em." />
          <div className="budgetGrid">
            <div className="budgetForm">
              <label>Số tiền em có trong tuần <div className="moneyInput"><input type="number" min="0" value={money} onChange={(e) => setMoney(+e.target.value)} /><span>đ</span></div></label>
              <label>Mục tiêu chính <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ví dụ: tiết kiệm mua quà..." /></label>
              <div className="budgetRows"><BudgetInput color="blue" label="Khoản cần thiết" hint="Vở, bút, đi lại..." value={need} setValue={setNeed}/><BudgetInput color="teal" label="Khoản tiết kiệm" hint="Mục tiêu, dự phòng..." value={saving} setValue={setSaving}/><BudgetInput color="orange" label="Khoản muốn mua thêm" hint="Trà sữa, phụ kiện..." value={want} setValue={setWant}/></div>
              <div className="formActions"><button className="primary" onClick={() => { setBudgetSaved(true); if (!completed.includes(5)) setCompleted((x) => [...x, 5]); }}>Lưu kế hoạch</button><button className="secondary" onClick={() => download("ke-hoach-chi-tieu.txt", `KẾ HOẠCH CHI TIÊU\nNgân sách: ${money.toLocaleString("vi-VN")}đ\nMục tiêu: ${goal}\nCần thiết: ${need.toLocaleString("vi-VN")}đ\nTiết kiệm: ${saving.toLocaleString("vi-VN")}đ\nMuốn mua thêm: ${want.toLocaleString("vi-VN")}đ\nCòn lại: ${remaining.toLocaleString("vi-VN")}đ`)}>Tải bản kế hoạch</button></div>
              {budgetSaved && <p className="savedMsg">✓ Kế hoạch đã được lưu trên thiết bị này.</p>}
            </div>
            <div className={`budgetSummary ${remaining < 0 ? "over" : ""}`}><span>TỔNG QUAN</span><div className="donut" style={{ "--percent": `${Math.min(100, Math.round(total / Math.max(money, 1) * 100))}%` } as React.CSSProperties}><div><b>{Math.round(total / Math.max(money, 1) * 100)}%</b><small>đã phân bổ</small></div></div><div className="summaryLine"><span>Tổng dự kiến</span><b>{total.toLocaleString("vi-VN")}đ</b></div><div className="summaryLine big"><span>Còn lại</span><b>{remaining.toLocaleString("vi-VN")}đ</b></div><p>{remaining < 0 ? "Kế hoạch đang vượt ngân sách. Hãy giảm khoản muốn mua thêm trước nhé." : want > money * .3 ? "Khoản muốn mua thêm hơi cao. Em có thể cân nhắc dành thêm cho mục tiêu tiết kiệm." : "Kế hoạch khá hợp lí: không vượt ngân sách và có mục tiêu tiết kiệm rõ ràng."}</p>{budgetSaved && <button className="primary wide" onClick={() => goTo(6)}>Làm Quiz →</button>}</div>
          </div>
        </section>}

        {active === 6 && <section className="sectionPanel learningSection">
          <SectionHead number="06" label="QUIZ" title="Thử thách kiến thức" desc="10 câu hỏi ngắn. Em có thể suy nghĩ thoải mái và làm lại bất cứ lúc nào." />
          {!quizDone ? <div className="quizWrap"><QuestionCard index={quizIndex} total={quiz.length} question={quiz[quizIndex][0]} options={[...quiz[quizIndex][1]]} answer={quiz[quizIndex][2]} selected={quizAnswers[quizIndex]} feedback={quizAnswers[quizIndex] === quiz[quizIndex][2] ? "Lựa chọn hợp lí! Em đang nắm rất chắc nội dung." : "Cùng ghi nhớ đáp án phù hợp nhất và tiếp tục nhé."} onAnswer={(choice) => setQuizAnswers((x) => ({ ...x, [quizIndex]: choice }))} onNext={() => { if (quizIndex < quiz.length - 1) setQuizIndex(quizIndex + 1); else { setQuizDone(true); if (!completed.includes(6)) setCompleted((x) => [...x, 6]); setPoints((x) => x + quizScore * 5); } }} lastLabel="Xem kết quả" /></div> : <div className="resultCard"><div className="resultScore"><b>{quizScore}</b><span>/10</span></div><h2>{quizScore >= 8 ? "Xuất sắc! Em đã sẵn sàng vận dụng." : quizScore >= 5 ? "Khá tốt! Cùng củng cố thêm một chút." : "Mỗi lần thử là một lần tiến bộ."}</h2><p>{quizScore >= 8 ? "Em đã nắm vững kiến thức cơ bản về tiêu dùng thông minh." : quizScore >= 5 ? "Hãy xem lại phần Quảng cáo và Kế hoạch chi tiêu." : "Hãy xem lại cách kiểm tra sản phẩm, phân biệt nhu cầu và mong muốn."}</p><div className="actions center"><button className="secondary" onClick={() => { setQuizDone(false); setQuizIndex(0); setQuizAnswers({}); }}>Làm lại Quiz</button><button className="primary" onClick={() => goTo(7)}>Nhận thử thách 7 ngày →</button></div></div>}
        </section>}

        {active === 7 && <section className="sectionPanel learningSection">
          <SectionHead number="07" label="VẬN DỤNG" title="Thử thách 7 ngày tiêu dùng thông minh" desc="Theo dõi những khoản chi nhỏ để nhìn ra thói quen lớn của chính mình." />
          <div className="journal"><div className="journalHead"><span>NGÀY</span><span>EM ĐÃ CHI VÀO VIỆC GÌ?</span><span>SỐ TIỀN</span><span>PHÂN LOẠI</span><span>EM CÓ HÀI LÒNG?</span></div>{days.map((day, i) => <div className="journalRow" key={day}><b>{day}</b><input value={journal[i].item} onChange={(e) => updateJournal(i, "item", e.target.value)} placeholder="Ví dụ: mua bút"/><input type="number" value={journal[i].amount} onChange={(e) => updateJournal(i, "amount", e.target.value)} placeholder="0đ"/><select value={journal[i].kind} onChange={(e) => updateJournal(i, "kind", e.target.value)}><option>Nhu cầu</option><option>Mong muốn</option></select><input value={journal[i].note} onChange={(e) => updateJournal(i, "note", e.target.value)} placeholder="Vì sao?"/></div>)}</div>
          <div className="challengeFooter"><div><span>THÔNG ĐIỆP CỦA EM</span><h3>“Đừng mua vì quảng cáo hấp dẫn,<br/>hãy mua vì em thật sự cần.”</h3></div><div className="formActions"><button className="secondary" onClick={() => { setJournal(days.map(() => ({ item: "", amount: "", kind: "Nhu cầu", note: "" }))); }}>Làm lại</button><button className="secondary" onClick={() => window.print()}>In bài làm</button><button className="primary" onClick={() => { download("nhat-ki-7-ngay.txt", journal.map((r, i) => `${days[i]}: ${r.item || "—"} | ${r.amount || "0"}đ | ${r.kind} | ${r.note}`).join("\n")); if (!completed.includes(7)) setCompleted((x) => [...x, 7]); }}>Lưu & tải xuống</button></div></div>
        </section>}
      </div>
      <footer><span>SMART CONSUMER · GDCD 9</span><p>Học để lựa chọn tốt hơn — mỗi ngày.</p><button onClick={() => goTo(Math.min(active + 1, 7))}>{active < 7 ? "Chặng tiếp theo →" : "Về đầu trang ↑"}</button></footer>
    </main>
  );
}

function SectionHead({ number, label, title, desc }: { number: string; label: string; title: string; desc: string }) {
  return <div className="sectionHead"><div><span>{number}</span><i/><b>{label}</b></div><h1>{title}</h1><p>{desc}</p></div>;
}

function Continue({ onClick, label }: { onClick: () => void; label: string }) {
  return <div className="continue"><button className="primary" onClick={onClick}>{label} <b>→</b></button></div>;
}

function QuestionCard({ index, total, question, options, answer, selected, feedback, onAnswer, onNext, lastLabel }: { index: number; total: number; question: string; options: readonly string[]; answer: number; selected?: number; feedback: string; onAnswer: (choice: number) => void; onNext: () => void; lastLabel: string }) {
  return <div className="questionCard"><div className="questionMeta"><span>CÂU {index + 1}/{total}</span><div>{Array.from({ length: total }, (_, i) => <i key={i} className={i <= index ? "on" : ""}/>)}</div></div><h2>{question}</h2><div className="options">{options.map((o, i) => <button key={o} disabled={selected !== undefined} className={selected !== undefined ? (i === answer ? "correct" : i === selected ? "chosen" : "") : ""} onClick={() => onAnswer(i)}><span>{String.fromCharCode(65 + i)}</span>{o}</button>)}</div>{selected !== undefined && <div className={`feedback ${selected === answer ? "good" : "learn"}`}><b>{selected === answer ? "Lựa chọn rất hợp lí!" : "Mình cùng xem lại nhé!"}</b><p>{feedback}</p><button onClick={onNext}>{index === total - 1 ? lastLabel : "Câu tiếp theo →"}</button></div>}</div>;
}

function BudgetInput({ color, label, hint, value, setValue }: { color: string; label: string; hint: string; value: number; setValue: (n: number) => void }) {
  return <label className="budgetInput"><i className={color}/><span><b>{label}</b><small>{hint}</small></span><div><input type="number" min="0" value={value} onChange={(e) => setValue(+e.target.value)}/><em>đ</em></div></label>;
}
