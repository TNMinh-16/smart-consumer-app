// ARCADE ENGINE — Smart Consumer GDCD 9
// Phiên bản 3: âm thanh Web Audio, hiệu ứng chém đôi, rung màn hình, animation mượt.

// ─── State ───────────────────────────────────────────────────────────────────
const arcadeBadges = ["Ví tiền tỉnh táo","Kính lúp kiểm chứng","Bản đồ 6 bước","Lá chắn trước cám dỗ"];
let currentGame = null;
let gameLoopId  = null;

// ─── WEB AUDIO ENGINE (không cần file âm thanh ngoài) ───────────────────────
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Tạo âm thanh tổng hợp
function playTone(freq, type, duration, volume=0.25, decay=0.6) {
  try {
    const ac = getAudio();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = type; osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime); osc.stop(ac.currentTime + duration);
  } catch(e) {}
}
function playNoise(duration=0.12, volume=0.15) {
  try {
    const ac = getAudio();
    const buf = ac.createBuffer(1, ac.sampleRate * duration, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i=0; i<data.length; i++) data[i] = Math.random()*2-1;
    const src = ac.createBufferSource();
    const gain = ac.createGain();
    src.buffer = buf; src.connect(gain); gain.connect(ac.destination);
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    src.start(); src.stop(ac.currentTime + duration);
  } catch(e) {}
}

// Âm thanh theo sự kiện
const SFX = {
  collect:  () => { playTone(660, 'sine', 0.15, 0.3);  playTone(880, 'sine', 0.1, 0.2); },
  wrong:    () => { playTone(150, 'sawtooth', 0.3, 0.2); playNoise(0.15, 0.2); },
  slice:    () => { playNoise(0.08, 0.25); playTone(440, 'sine', 0.1, 0.15); },
  sliceWrong:()=>{ playTone(200, 'square', 0.25, 0.2); playNoise(0.2, 0.2); },
  tap:      () => playTone(523, 'sine', 0.12, 0.25),
  tapWrong: () => { playTone(250, 'sawtooth', 0.2, 0.2); },
  shield:   () => { playTone(784,'triangle',0.2,0.3); playTone(1047,'sine',0.15,0.2); },
  shieldMiss:()=>{ playTone(180,'square',0.18,0.15); },
  win:      () => {
    [523,659,784,1047].forEach((f,i) => setTimeout(()=>playTone(f,'sine',0.3,0.35), i*90));
  },
  lose:     () => {
    [392,330,261].forEach((f,i) => setTimeout(()=>playTone(f,'sawtooth',0.3,0.3), i*80));
  },
  heartLost:() => { playTone(220,'sawtooth',0.4,0.3); playNoise(0.15, 0.25); },
  combo:    () => { [880,1047,1319].forEach((f,i)=>setTimeout(()=>playTone(f,'sine',0.18,0.35),i*60)); }
};

// Nhạc nền (vòng lặp đơn giản bằng Web Audio)
let bgmNode = null, bgmGain = null;
function startBGM(gameId) {
  stopBGM();
  try {
    const ac = getAudio();
    bgmGain = ac.createGain();
    bgmGain.gain.setValueAtTime(0.06, ac.currentTime);
    bgmGain.connect(ac.destination);

    const patterns = {
      1: [261,294,329,349,392,349,329,294],   // Đô trưởng — vui tươi
      2: [220,246,261,220,196,220,246,261],   // Thứ — hồi hộp
      3: [392,440,494,523,494,440,392,349],   // Sol trưởng — phấn khởi
      4: [174,196,220,196,174,164,174,196]    // Tông thấp — căng thẳng
    };
    const notes = patterns[gameId] || patterns[1];
    let idx = 0;
    const tempo = gameId === 4 ? 0.32 : 0.28;

    function tick() {
      if (!bgmGain) return;
      const osc = ac.createOscillator();
      const g   = ac.createGain();
      osc.connect(g); g.connect(bgmGain);
      osc.type = gameId === 2 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(notes[idx % notes.length], ac.currentTime);
      g.gain.setValueAtTime(0.8, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + tempo * 0.85);
      osc.start(ac.currentTime); osc.stop(ac.currentTime + tempo);
      idx++;
      bgmNode = setTimeout(tick, tempo * 1000);
    }
    tick();
  } catch(e) {}
}
function stopBGM() {
  if (bgmNode) { clearTimeout(bgmNode); bgmNode = null; }
  if (bgmGain) { try { bgmGain.disconnect(); } catch(e) {} bgmGain = null; }
}


// ─── DOM refs (chỉ khai báo một lần) ─────────────────────────────────────────
const arcadeMenu        = document.getElementById("arcadeMenu");
const gameViewport      = document.getElementById("gameViewport");
const exitGameBtn       = document.getElementById("exitGameBtn");
const gameCanvas        = document.getElementById("gameCanvas");
const domGame           = document.getElementById("domGame");
const gameOverlay       = document.getElementById("gameOverlay");
const gameScoreDisplay  = document.getElementById("gameScoreDisplay");
const gameTimeDisplay   = document.getElementById("gameTimeDisplay");
const gameHeartsDisplay = document.getElementById("gameHeartsDisplay");
const ctx               = gameCanvas.getContext("2d");

// ─── Global game state ────────────────────────────────────────────────────────
let gameState = { score:0, hearts:3, time:60, active:false, entities:[], lastTime:0 };

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
function initArcade() {
  // Nút "Kiểm tra bài học" → mở menu game
  const checkBtn = document.getElementById("checkLessonBtn");
  if (checkBtn) {
    checkBtn.addEventListener("click", () => {
      document.getElementById("knowledgeSummaryView").hidden = true;
      document.getElementById("arcadeMenu").hidden = false;
    });
  }

  // Nút chọn game
  document.querySelectorAll(".arcadeBtn").forEach(btn => {
    btn.addEventListener("click", () => startGame(Number(btn.dataset.game)));
  });

  // Nút Thoát
  exitGameBtn.addEventListener("click", () => {
    const introHidden = document.getElementById("gameIntroOverlay").hidden;
    if (!introHidden) { endGameContext(); return; }

    if (gameState.active || gameOverlay.hidden) {
      const wasActive = gameState.active;
      gameState.active = false;
      showConfirmOverlay("Tạm dừng","Em muốn thoát thử thách này chứ?","Thoát","Tiếp tục chơi",
        () => endGameContext(),
        () => {
          if (wasActive) { gameState.active = true; gameState.lastTime = performance.now(); }
        }
      );
    } else {
      endGameContext();
    }
  });

  updateArcadeUI();
}

// ─────────────────────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function updateArcadeUI() {
  if (!state.arcade) state.arcade = {};
  let totalStars = 0;
  for (let i = 1; i <= 4; i++) {
    const stars = state.arcade[`g${i}`] || 0;
    totalStars += stars;
    const starEl = document.getElementById(`starsG${i}`);
    if (starEl) starEl.textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    const badgeContainer = document.getElementById("arcadeBadgesDisplay");
    if (!badgeContainer.querySelector(`[data-b="${i}"]`)) {
      badgeContainer.innerHTML += `<div class="badgeIcon" data-b="${i}" title="${arcadeBadges[i-1]}">${["🎒","🔍","🗺️","🛡️"][i-1]}</div>`;
    }
    const badgeEl = badgeContainer.querySelector(`[data-b="${i}"]`);
    if (badgeEl) badgeEl.classList.toggle("unlocked", stars >= 2);
  }
  document.getElementById("totalArcadeStars").textContent = totalStars;
  const unlockBtn = document.getElementById("arcadeUnlockBtn");
  if (totalStars >= 6) {
    unlockBtn.disabled = false;
    unlockBtn.textContent = "Tiếp tục đến Quảng cáo →";
    document.getElementById("arcadeResultView").hidden = false;
    document.getElementById("arcadeFinalMessage").textContent = "Tuyệt vời! Em đã sẵn sàng xử lý quảng cáo và tình huống thực tế.";
  } else {
    unlockBtn.disabled = true;
    unlockBtn.textContent = "Chưa đủ 6 sao";
  }
}

function updateGameHeader() {
  gameScoreDisplay.textContent = `Điểm: ${gameState.score}`;
  gameTimeDisplay.textContent  = `⏱ ${Math.ceil(gameState.time)}s`;
  gameHeartsDisplay.textContent = "❤️".repeat(Math.max(0,gameState.hearts)) + "🖤".repeat(Math.max(0,3-gameState.hearts));
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERLAY HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function showOverlay(title, text, btnText, onAction, btnClass="primary") {
  gameState.active = false;
  document.getElementById("overlayTitle").textContent = title;
  document.getElementById("overlayText").textContent  = text;
  const actions = document.getElementById("overlayActions");
  actions.innerHTML = `<button class="${btnClass}">${btnText}</button>`;
  actions.querySelector("button").addEventListener("click", () => {
    gameOverlay.hidden = true;
    if (onAction) onAction();
  });
  gameOverlay.hidden = false;
}

function showConfirmOverlay(title, text, confirmTxt, cancelTxt, onConfirm, onCancel) {
  gameState.active = false;
  document.getElementById("overlayTitle").textContent = title;
  document.getElementById("overlayText").textContent  = text;
  const actions = document.getElementById("overlayActions");
  actions.innerHTML = `
    <button class="ghost" id="overlayCancelBtn">${cancelTxt}</button>
    <button class="primary" id="overlayConfirmBtn">${confirmTxt}</button>
  `;
  actions.querySelector("#overlayCancelBtn").addEventListener("click", () => {
    gameOverlay.hidden = true;
    if (onCancel) onCancel();
  });
  actions.querySelector("#overlayConfirmBtn").addEventListener("click", () => {
    gameOverlay.hidden = true;
    if (onConfirm) onConfirm();
  });
  gameOverlay.hidden = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────
function startGame(gameId) {
  arcadeMenu.hidden    = true;
  gameViewport.hidden  = false;
  gameCanvas.hidden    = true;
  domGame.hidden       = true;
  gameOverlay.hidden   = true;
  document.getElementById("gameIntroOverlay").hidden = false;

  gameCanvas.width  = gameViewport.clientWidth  || 360;
  gameCanvas.height = (gameViewport.clientHeight || 600) - 60; // minus header

  const intros = {
    1: {
      title: "Giỏ hàng thông thái",
      visual: "🛒 📝 💰",
      rules: `<ul>
        <li>Di chuột hoặc vuốt để di chuyển <b>Giỏ hàng</b> bên dưới.</li>
        <li>Hứng các món <b>Nhu cầu</b> (Gạo, Sữa, Sách) trong danh sách mua.</li>
        <li>Tránh <b>Mong muốn</b> (Trà sữa, Đồ chơi) — sẽ bị trừ ngân sách!</li>
        <li>Hứng đủ hết danh sách trong 60 giây để chiến thắng.</li>
        <li><b>Bảng giá</b> hiện ngay dưới mỗi vật phẩm để em cân nhắc.</li>
      </ul>`
    },
    2: {
      title: "Mắt thần mua sắm",
      visual: "⚔️ 🏷️ 🛡️",
      rules: `<ul>
        <li>Kéo chuột hoặc vuốt để <b>chém</b> các thẻ bài.</li>
        <li>Chém thẻ <b style="color:#ef4444">Rủi ro</b> (Giá siêu rẻ, Không đổi trả) để ghi điểm.</li>
        <li><b>Đừng chém</b> thẻ <b style="color:#22c55e">Tốt</b> (Nguồn gốc rõ ràng, Bảo hành).</li>
        <li>Combo 5 nhát đúng → kích hoạt <b>Làm chậm thời gian!</b></li>
      </ul>`
    },
    3: {
      title: "Nhịp mua thông minh",
      visual: "🎵 🎹 🎯",
      rules: `<ul>
        <li>Các thẻ rơi xuống theo 3 làn.</li>
        <li>Bấm vào thẻ chứa <b>Bước mua sắm đúng</b> khi nó rơi xuống.</li>
        <li><b>Không bấm</b> thẻ Cám dỗ (đỏ).</li>
        <li>Game <b>nhanh dần</b> theo thời gian — phản xạ nhanh nhé!</li>
      </ul>`
    },
    4: {
      title: "Bảo vệ túi tiền",
      visual: "🛡️ 💰 ⚔️",
      rules: `<ul>
        <li>Cám dỗ tấn công túi tiền từ 4 phía.</li>
        <li>Bấm <b>đúng lá chắn</b> tương ứng để tiêu diệt:
          <br>🔍 Kính lúp → Sale ảo
          <br>⏱️ Chờ 24h → Sợ lỡ mất
          <br>🛡️ Kiên định → Bạn bè rủ
          <br>📝 Danh sách → Thích là mua
        </li>
        <li>Bấm sai hoặc để cám dỗ chạm ví → mất 1 tim!</li>
      </ul>`
    }
  };

  document.getElementById("introTitle").textContent  = intros[gameId].title;
  document.getElementById("introVisual").innerHTML   = intros[gameId].visual;
  document.getElementById("introRules").innerHTML    = intros[gameId].rules;

  const startBtn = document.getElementById("startBtn");
  startBtn.onclick = () => {
    document.getElementById("gameIntroOverlay").hidden = true;
    const timeMap = { 1:60, 2:45, 3:60, 4:60 };
    gameState = {
      score:0, hearts:3, time: timeMap[gameId] || 60,
      active:true, entities:[], lastTime: performance.now(), gameId
    };
    updateGameHeader();
    startBGM(gameId);  // Bắt đầu nhạc nền
    if      (gameId === 1) startCartGame();
    else if (gameId === 2) startSlicerGame();
    else if (gameId === 3) startRhythmGame();
    else if (gameId === 4) startDefenseGame();
  };
}

function stopGameLoop() {
  if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
  stopBGM();
  gameCanvas.onmousemove  = null;
  gameCanvas.ontouchmove  = null;
  gameCanvas.onmousedown  = null;
  gameCanvas.onmouseup    = null;
  gameCanvas.onmouseleave = null;
  gameCanvas.ontouchstart = null;
  gameCanvas.ontouchend   = null;
  domGame.innerHTML = "";
}

function endGameContext() {
  gameState.active = false;
  stopGameLoop();
  gameViewport.hidden = true;
  arcadeMenu.hidden   = false;
  updateArcadeUI();
  save();
}

function calculateStars() {
  if (gameState.hearts <= 0) return 0;
  if (gameState.score >= 100) return 3;
  if (gameState.score >= 50)  return 2;
  return 1;
}

function gameOver(reason) {
  gameState.active = false;
  stopGameLoop();
  let stars = 0;
  let msg   = "";
  if (gameState.hearts <= 0) {
    msg = "Em đã hết tim! Hãy chú ý và cẩn thận hơn ở lần sau.";
  } else {
    stars = calculateStars();
    const msgs = {
      1: "Ghi nhớ: Ưu tiên 'Nhu cầu' trước, cân nhắc 'Mong muốn' sau!",
      2: "Ghi nhớ: Luôn kiểm tra nguồn gốc và chính sách đổi trả.",
      3: "Ghi nhớ: Xác định nhu cầu → Tìm hiểu → So sánh → Cân nhắc chi trả.",
      4: "Ghi nhớ: Hãy chờ 24h trước khi mua một món đồ không có trong kế hoạch."
    };
    msg = (msgs[gameState.gameId] || "");
    if (reason && reason !== "Hết tim") msg = reason + " " + msg;
  }
  const currentBest = state.arcade[`g${gameState.gameId}`] || 0;
  if (stars > currentBest) state.arcade[`g${gameState.gameId}`] = stars;
  if (stars > 0) SFX.win(); else SFX.lose();
  showOverlay(
    stars > 0 ? `Hoàn thành! (${stars} Sao)` : "Thử lại nhé",
    msg,
    "Quay lại Menu",
    () => endGameContext()
  );
}

function gameWin(msg) {
  gameState.active = false;
  stopGameLoop();
  const stars = calculateStars();
  const currentBest = state.arcade[`g${gameState.gameId}`] || 0;
  if (stars > currentBest) state.arcade[`g${gameState.gameId}`] = stars;
  SFX.win();
  showOverlay(
    `Chiến thắng! (${stars} Sao)`,
    msg || "Xuất sắc! Em đã hoàn thành thử thách.",
    "Quay lại Menu",
    () => endGameContext()
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME 1: CART — Giỏ hàng thông thái
// ─────────────────────────────────────────────────────────────────────────────
function startCartGame() {
  gameCanvas.hidden = false;
  domGame.hidden    = true;

  gameState.cart         = { x: gameCanvas.width / 2, width: 110, height: 40 };
  gameState.budget       = 500000;
  gameState.needs        = [
    { type:"Gạo",  icon:"🍚", count:2, collected:0, price:100000 },
    { type:"Sữa",  icon:"🥛", count:3, collected:0, price: 50000 },
    { type:"Sách", icon:"📚", count:2, collected:0, price: 40000 }
  ];
  gameState.items        = [];
  gameState.nextSpawn    = 1.5;
  gameState.speed        = 150;
  gameState.floatingTexts = [];
  gameState.firstMistake = false;

  // Bảng giá (hiện ở góc phải canvas)
  gameState.priceList = [
    { label:"🍚 Gạo",    price:"100k" },
    { label:"🥛 Sữa",    price:"50k"  },
    { label:"📚 Sách",   price:"40k"  },
    { label:"🧋 Trà sữa",price:"60k"  },
    { label:"🎮 Đồ chơi",price:"200k" },
    { label:"🍬 Bánh",   price:"30k"  }
  ];

  const updateCart = (clientX) => {
    const rect = gameCanvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (gameCanvas.width / rect.width);
    gameState.cart.x = Math.max(gameState.cart.width/2, Math.min(gameCanvas.width - gameState.cart.width/2, x));
  };
  gameCanvas.onmousemove  = e => { if (gameState.active) updateCart(e.clientX); };
  gameCanvas.ontouchmove  = e => { e.preventDefault(); if (gameState.active) updateCart(e.touches[0].clientX); };

  gameLoopId = requestAnimationFrame(cartLoop);
}

function cartLoop(now) {
  if (!gameState.active) return;
  const rawDt = (now - gameState.lastTime) / 1000;
  const dt    = Math.min(rawDt, 0.1); // giới hạn dt để tránh đồng hồ nhảy loạn
  gameState.lastTime = now;
  gameState.time -= dt;
  updateGameHeader();

  if (gameState.time <= 0) { gameOver("Hết giờ! Bạn chưa mua đủ đồ."); return; }

  updateCartGame(dt);
  drawCartGame();
  gameLoopId = requestAnimationFrame(cartLoop);
}

function updateCartGame(dt) {
  // Spawn
  gameState.nextSpawn -= dt;
  if (gameState.nextSpawn <= 0) {
    gameState.nextSpawn = 1.0 + Math.random() * 0.5;
    const isNeed = Math.random() > 0.45;
    let itemData;
    if (isNeed) {
      const needed = gameState.needs.filter(n => n.collected < n.count);
      itemData = needed.length > 0
        ? needed[Math.floor(Math.random() * needed.length)]
        : gameState.needs[0];
    } else {
      const wants = [
        { type:"Trà sữa", icon:"🧋", price:60000,  isWant:true },
        { type:"Đồ chơi", icon:"🎮", price:200000, isWant:true },
        { type:"Bánh",    icon:"🍬", price:30000,  isWant:true }
      ];
      itemData = wants[Math.floor(Math.random() * wants.length)];
    }
    gameState.items.push({ x: 30 + Math.random()*(gameCanvas.width-60), y:-40, data: itemData });
  }

  // Move & collide
  for (let i = gameState.items.length - 1; i >= 0; i--) {
    let item = gameState.items[i];
    item.y += gameState.speed * dt;

    const cart = gameState.cart;
    const hitY = item.y + 20 > gameCanvas.height - cart.height && item.y - 20 < gameCanvas.height;
    const hitX = Math.abs(item.x - cart.x) < cart.width / 2 + 15;

    if (hitY && hitX) {
      gameState.items.splice(i, 1);
      if (item.data.isWant) {
        const penalty = gameState.firstMistake ? item.data.price : item.data.price / 2;
        gameState.budget -= penalty;
        gameState.firstMistake = true;
        SFX.wrong();
        gameState.floatingTexts.push({ x:item.x, y:item.y, text:`-${penalty/1000}k Mong muốn!`, color:"#f59e0b", age:0 });
      } else {
        gameState.budget -= item.data.price;
        const ref = gameState.needs.find(n => n.type === item.data.type);
        if (ref && ref.collected < ref.count) {
          ref.collected++;
          gameState.score += 10;
          SFX.collect();
        }
        gameState.floatingTexts.push({ x:item.x, y:item.y, text:`+${item.data.type} ✓`, color:"#22c55e", age:0 });
      }
      updateGameHeader();

      if (gameState.budget < 0) { gameOver("Thủng ví! Bạn đã tiêu lạm ngân sách."); return; }
      const allMet = gameState.needs.every(n => n.collected >= n.count);
      if (allMet) {
        gameState.score += 50;
        gameWin("Tuyệt vời! Bạn đã mua đủ đồ và còn ngân sách dư.");
        return;
      }
      continue;
    }

    if (item.y > gameCanvas.height + 40) gameState.items.splice(i, 1);
  }

  gameState.floatingTexts.forEach(ft => ft.age += dt);
  gameState.floatingTexts = gameState.floatingTexts.filter(ft => ft.age < 1.2);
}

function drawCartGame() {
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  ctx.textBaseline = "top";

  // Ngân sách
  ctx.fillStyle = "#fff";
  ctx.font      = "bold 15px Montserrat, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Ngân sách: ${(gameState.budget/1000).toFixed(0)}k`, 10, 10);

  // Danh sách cần mua
  ctx.font = "13px Montserrat, sans-serif";
  let ly = 32;
  gameState.needs.forEach(n => {
    ctx.fillStyle = n.collected >= n.count ? "#64748b" : "#fff";
    ctx.fillText(`${n.icon} ${n.type}: ${n.collected}/${n.count}`, 10, ly);
    ly += 20;
  });

  // Bảng giá — góc phải
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  const pw = 120, ph = 14 + gameState.priceList.length * 16;
  const px = gameCanvas.width - pw - 6, py = 6;
  ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 11px Montserrat, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("BẢNG GIÁ", px + 6, py + 3);
  ctx.font = "11px Montserrat, sans-serif";
  gameState.priceList.forEach((p, i) => {
    ctx.fillText(`${p.label}: ${p.price}`, px + 6, py + 16 + i * 15);
  });

  // Cart
  const cart = gameState.cart;
  ctx.fillStyle = "#3b82f6";
  ctx.beginPath();
  ctx.roundRect(cart.x - cart.width/2, gameCanvas.height - cart.height, cart.width, cart.height, [4,4,12,12]);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "18px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🛒", cart.x, gameCanvas.height - cart.height/2);

  // Items với giá tiền
  gameState.items.forEach(item => {
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.data.icon, item.x, item.y - 10);

    // Nhãn giá
    const priceK = (item.data.price / 1000) + "k";
    const bg = item.data.isWant ? "#f59e0b" : "#3b82f6";
    const textW = ctx.measureText(priceK).width + 12;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(item.x - textW/2, item.y + 8, textW, 17, 4);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px Montserrat, sans-serif";
    ctx.fillText(priceK, item.x, item.y + 17);
  });

  // Floating texts
  ctx.textBaseline = "middle";
  gameState.floatingTexts.forEach(ft => {
    ctx.globalAlpha = Math.max(0, 1 - ft.age / 1.2);
    ctx.fillStyle   = ft.color;
    ctx.font        = "bold 14px Montserrat, sans-serif";
    ctx.textAlign   = "center";
    ctx.fillText(ft.text, ft.x, ft.y - ft.age * 50);
  });
  ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME 2: SLICER — Mắt thần mua sắm
// ─────────────────────────────────────────────────────────────────────────────
function startSlicerGame() {
  gameCanvas.hidden = false;
  domGame.hidden    = true;

  gameState.nextSpawn  = 1.5;
  gameState.combo      = 0;
  gameState.slowMo     = 1;
  gameState.cards      = [];
  gameState.mouse      = { x:0, y:0, active:false };
  gameState.sliceTrail = [];
  gameState.shakeTime  = 0;
  gameState.flashTime  = 0;

  // Lấy tọa độ chuẩn từ getBoundingClientRect (không dùng offsetX/Y vì bị lệch khi có scroll)
  const getPos = (e) => {
    const rect = gameCanvas.getBoundingClientRect();
    const scaleX = gameCanvas.width  / rect.width;
    const scaleY = gameCanvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x:(clientX - rect.left)*scaleX, y:(clientY - rect.top)*scaleY };
  };

  const onStart = e => {
    const p = getPos(e);
    gameState.mouse = { x:p.x, y:p.y, active:true };
    gameState.sliceTrail = [p];
  };
  const onMove = e => {
    if (!gameState.mouse.active) return;
    const p = getPos(e);
    gameState.mouse.x = p.x; gameState.mouse.y = p.y;
    gameState.sliceTrail.push(p);
    if (gameState.sliceTrail.length > 12) gameState.sliceTrail.shift();
  };
  const onEnd = () => { gameState.mouse.active = false; gameState.sliceTrail = []; };

  gameCanvas.onmousedown  = onStart;
  gameCanvas.onmousemove  = onMove;
  gameCanvas.onmouseup    = onEnd;
  gameCanvas.onmouseleave = onEnd;
  gameCanvas.ontouchstart = e => { e.preventDefault(); onStart(e); };
  gameCanvas.ontouchmove  = e => { e.preventDefault(); onMove(e); };
  gameCanvas.ontouchend   = onEnd;

  gameLoopId = requestAnimationFrame(slicerLoop);
}

function slicerLoop(time) {
  if (!gameState.active) return;
  const rawDt = (time - gameState.lastTime) / 1000;
  const dt    = Math.min(rawDt, 0.1) * gameState.slowMo;
  gameState.lastTime = time;
  gameState.time -= dt;
  updateGameHeader();
  if (gameState.time <= 0) { gameOver("Hết giờ"); return; }

  // Phục hồi slowmo
  if (gameState.slowMo < 1) gameState.slowMo = Math.min(1, gameState.slowMo + dt * 0.3);

  // Spawn cards
  gameState.nextSpawn -= dt;
  if (gameState.nextSpawn <= 0) {
    const x   = 60 + Math.random() * (gameCanvas.width - 120);
    const vx  = (Math.random() - 0.5) * 80;
    const vy  = -1000 - Math.random() * 200; // lực đẩy -1000 hợp lý
    const isBad = Math.random() < 0.6;
    const text  = isBad
      ? ["Giá siêu rẻ","Không đổi trả","Cam kết 100%","Sale 80%"][Math.floor(Math.random()*4)]
      : ["Nguồn gốc rõ","Có ảnh thật","Bảo hành 12th","Được đổi trả"][Math.floor(Math.random()*4)];
    gameState.cards.push({ x, y: gameCanvas.height, vx, vy, isBad, text,
      sliced:false, halves:null, rot:0, vrot:(Math.random()-0.5)*4, sliceAngle:0 });
    gameState.nextSpawn = 1.5 + Math.random();
  }

  // Shake effect
  if (gameState.shakeTime > 0) {
    gameState.shakeTime -= dt;
    ctx.save();
    const sx = (Math.random()-0.5)*14;
    const sy = (Math.random()-0.5)*14;
    ctx.translate(sx, sy);
  }

  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  // Red flash overlay khi chém sai
  if (gameState.flashTime > 0) {
    gameState.flashTime -= dt;
    const alpha = Math.min(0.45, gameState.flashTime * 1.5);
    ctx.fillStyle = `rgba(239,68,68,${alpha})`;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
  }

  // Update & draw cards
  for (let i = gameState.cards.length - 1; i >= 0; i--) {
    let c = gameState.cards[i];
    c.vy  += 750 * (dt/gameState.slowMo);
    c.x   += c.vx * dt;
    c.y   += c.vy * dt;
    c.rot += c.vrot * dt;

    if (!c.sliced) {
      // Check slice
      if (gameState.mouse.active && gameState.sliceTrail.length > 1) {
        const last = gameState.sliceTrail[gameState.sliceTrail.length-1];
        const prev = gameState.sliceTrail[gameState.sliceTrail.length-2] || last;
        const dist = Math.hypot(c.x - last.x, c.y - last.y);
        if (dist < 48) {
          // Tính góc đường chém để cắt đôi thẻ theo đúng hướng đó
          c.sliceAngle = Math.atan2(last.y - prev.y, last.x - prev.x);
          c.sliced = true;
          // Hai nửa bay ra hai phía theo góc vuông với đường chém
          const perpX = Math.cos(c.sliceAngle + Math.PI/2);
          const perpY = Math.sin(c.sliceAngle + Math.PI/2);
          c.halves = [
            { dx: perpX*90, dy: perpY*90 - 40, rot:  0.04, age:0 },
            { dx:-perpX*90, dy:-perpY*90 - 40, rot: -0.04, age:0 }
          ];
          if (c.isBad) {
            SFX.slice();
            gameState.score += 10;
            gameState.combo++;
            if (gameState.combo >= 5) { gameState.combo = 0; gameState.slowMo = 0.3; SFX.combo(); }
          } else {
            SFX.sliceWrong();
            gameState.combo = 0;
            gameState.hearts--;
            gameState.shakeTime = 0.35;
            gameState.flashTime = 0.35;
            updateGameHeader();
            SFX.heartLost();
            if (gameState.hearts <= 0) { gameOver("Hết tim"); return; }
          }
          updateGameHeader();
        }
      }
      // Missed bad card
      if (c.y > gameCanvas.height + 80 && c.vy > 0) {
        if (c.isBad) {
          gameState.hearts--;
          gameState.combo = 0;
          gameState.shakeTime = 0.2;
          gameState.flashTime = 0.2;
          SFX.heartLost();
          updateGameHeader();
          if (gameState.hearts <= 0) { gameOver("Hết tim"); return; }
        }
        gameState.cards.splice(i, 1);
        continue;
      }
    } else {
      // Cập nhật vị trí của hai nửa thẻ bị cắt đôi
      if (c.halves) c.halves.forEach(h => { h.age += dt; h.dy += 400*dt; });
      if (c.y > gameCanvas.height + 120) { gameState.cards.splice(i, 1); continue; }
    }

    if (c.sliced && c.halves) {
      // Vẽ hai nửa tờ bị cắt đôi
      c.halves.forEach((h, hi) => {
        ctx.save();
        ctx.translate(c.x + h.dx * h.age * 2, c.y + h.dy);
        ctx.rotate(c.rot + h.rot * h.age * 20);
        // Clip nửa trên / nửa dưới theo đường chém
        ctx.beginPath();
        ctx.rotate(c.sliceAngle);
        if (hi === 0) ctx.rect(-80, 0, 160, 80);
        else          ctx.rect(-80, -80, 160, 80);
        ctx.rotate(-c.sliceAngle);
        ctx.clip();
        // Vẽ thẻ gốc bên trong vùng clip
        const alpha = Math.max(0, 1 - h.age * 1.4);
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = c.isBad ? "#fee2e2" : "#dcfce7";
        ctx.strokeStyle = c.isBad ? "#ef4444" : "#22c55e";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(-62,-32,124,64,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = c.isBad ? "#dc2626" : "#16a34a";
        ctx.font = "bold 11px Montserrat";
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(c.text, 0, 0);
        ctx.restore();
      });
    } else if (!c.sliced) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle   = c.isBad ? "#fee2e2" : "#dcfce7";
      ctx.strokeStyle = c.isBad ? "#ef4444" : "#22c55e";
      ctx.lineWidth   = 2;
      ctx.beginPath(); ctx.roundRect(-62,-32,124,64,8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = c.isBad ? "#dc2626" : "#16a34a";
      ctx.font = "bold 12px Montserrat, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(c.text, 0, 0);
      const tag = c.isBad ? "⚠️ Rủi ro" : "✅ Tốt";
      ctx.font = "10px Arial"; ctx.fillStyle = c.isBad ? "#ef4444" : "#22c55e";
      ctx.fillText(tag, 0, 20);
      ctx.restore();
    }
  }

  if (gameState.shakeTime > 0) ctx.restore();

  // Slice trail
  if (gameState.sliceTrail.length > 1) {
    ctx.beginPath();
    ctx.moveTo(gameState.sliceTrail[0].x, gameState.sliceTrail[0].y);
    for (let i=1; i<gameState.sliceTrail.length; i++) ctx.lineTo(gameState.sliceTrail[i].x, gameState.sliceTrail[i].y);
    ctx.strokeStyle = "rgba(255,220,100,0.9)";
    ctx.lineWidth   = 5;
    ctx.lineCap     = "round";
    ctx.stroke();
  }

  gameLoopId = requestAnimationFrame(slicerLoop);
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME 3: RHYTHM — Nhịp mua thông minh (3 làn, tăng tốc)
// ─────────────────────────────────────────────────────────────────────────────
function startRhythmGame() {
  gameCanvas.hidden = true;
  domGame.hidden    = false;

  gameState.currentStep = 0;
  gameState.tiles       = [];
  gameState.speed       = 90;   // px/s ban đầu
  gameState.nextSpawn   = 1.8;
  gameState.speedMult   = 1;

  domGame.innerHTML = `
    <div class="rhythmGrid" style="position:relative;width:100%;height:100%;display:flex;overflow:hidden;background:#0f172a;">
      <div class="rhythmCol" id="rCol0" style="flex:1;position:relative;border-right:1px dashed rgba(255,255,255,0.1);"></div>
      <div class="rhythmCol" id="rCol1" style="flex:1;position:relative;border-right:1px dashed rgba(255,255,255,0.1);"></div>
      <div class="rhythmCol" id="rCol2" style="flex:1;position:relative;"></div>
      <div class="rhythmTarget" style="position:absolute;bottom:20px;left:0;right:0;height:70px;
        border-top:3px solid rgba(255,255,255,0.5);background:linear-gradient(to bottom,rgba(255,255,255,0.08),transparent);
        pointer-events:none;"></div>
    </div>
  `;

  gameLoopId = requestAnimationFrame(rhythmLoop);
}

function spawnRhythmRow() {
  const steps = ["Xác định nhu cầu","Tìm hiểu sản phẩm","So sánh lựa chọn","Cân nhắc chi trả","Kiểm tra quảng cáo","Mua theo kế hoạch"];
  const traps  = ["Mua ngay kẻo hết","Tin review đầu tiên","Mua vì giảm giá","Mua theo cảm xúc","Hỏi bạn rồi mua theo"];
  const correctStep = steps[gameState.currentStep] || steps[0];
  const isCorrect = Math.random() > 0.35;

  // 3 làn: 1 ô được chọn làm mục tiêu
  const cols = [0,1,2].sort(() => Math.random()-0.5);
  const targetCol = cols[0];

  const el = document.createElement("div");
  el.className = `rhythmTile ${isCorrect ? "correct" : "trap"}`;
  el.textContent = isCorrect ? correctStep : traps[Math.floor(Math.random()*traps.length)];
  // Màu phân biệt nhẹ: bước đúng tông xanh lam trung tính, bẫy tông nâu đất
  // Không dùng đỏ/xanh sặc sỡ để học sinh vẫn phải đọc nội dung
  const bgStyle = isCorrect
    ? "linear-gradient(135deg,#1e40af,#1d4ed8)"   // Xanh lam đậm — bước mua sắm
    : "linear-gradient(135deg,#78350f,#92400e)";  // Nâu đất — cám dỗ
  el.style.cssText = `
    position:absolute; width:88%; left:6%; top:-90px;
    height:72px; border-radius:12px; display:flex; align-items:center; justify-content:center;
    color:#e2e8f0; font-weight:700; font-size:12px; text-align:center; padding:6px; box-sizing:border-box;
    cursor:pointer; user-select:none;
    background:${bgStyle};
    box-shadow:0 4px 16px rgba(0,0,0,0.5);
    border:2px solid rgba(255,255,255,0.12);
    letter-spacing:0.02em;
  `;

  const colEl = document.getElementById(`rCol${targetCol}`);
  if (!colEl) return;
  colEl.appendChild(el);

  const tileObj = { el, y:-90, isTrap:!isCorrect, clicked:false, isCorrect };
  el.onmousedown  = () => handleRhythmClick(tileObj);
  el.ontouchstart = e => { e.preventDefault(); handleRhythmClick(tileObj); };
  gameState.tiles.push(tileObj);
}

function handleRhythmClick(t) {
  if (t.clicked || !gameState.active) return;
  t.clicked = true;

  if (t.isTrap) {
    SFX.tapWrong();
    t.el.style.background  = "linear-gradient(135deg,#dc2626,#991b1b)";
    t.el.style.opacity     = "0.7";
    t.el.style.transform   = "scale(0.92)";
    gameState.hearts--;
    updateGameHeader();
    if (gameState.hearts <= 0) { gameOver("Hết tim"); return; }
  } else if (t.isCorrect) {
    SFX.tap();
    t.el.style.background  = "linear-gradient(135deg,#16a34a,#15803d)";
    t.el.style.boxShadow   = "0 0 20px #22c55e, 0 0 40px rgba(34,197,94,0.4)";
    t.el.style.transform   = "scale(1.06)";
    gameState.score += 20;
    gameState.currentStep++;
    updateGameHeader();

    const hints = [
      "Trước khi xem giá, biết mình có thật sự cần không?",
      "Tìm thông tin rõ ràng — đừng tin quảng cáo một chiều.",
      "Không bao giờ chọn ngay lựa chọn đầu tiên.",
      "Kiểm tra xem nó có nằm trong ngân sách không?",
      "Đừng tin 100% vào quảng cáo hấp dẫn!",
      "Chốt đơn đúng với những gì đã định — không thêm!"
    ];
    const toast = document.createElement("div");
    toast.textContent = hints[(gameState.currentStep - 1) % hints.length];
    Object.assign(toast.style, {
      position:"absolute", top:"15%", left:"50%", transform:"translateX(-50%)",
      background:"rgba(0,0,0,0.85)", color:"#fff", padding:"10px 18px",
      borderRadius:"10px", zIndex:"100", fontSize:"13px", maxWidth:"85%",
      textAlign:"center", lineHeight:"1.4", pointerEvents:"none"
    });
    domGame.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);

    if (gameState.currentStep >= 6) {
      setTimeout(() => gameOver("Hoàn thành chuỗi 6 bước! Xuất sắc!"), 800);
    }
  }
}

function rhythmLoop(time) {
  if (!gameState.active) return;
  const rawDt = (time - gameState.lastTime) / 1000;
  const dt    = Math.min(rawDt, 0.1);
  gameState.lastTime = time;

  gameState.time -= dt;
  updateGameHeader();
  if (gameState.time <= 0) { gameOver("Hết giờ"); return; }

  // Tăng tốc dần
  gameState.speed += dt * 6;

  gameState.nextSpawn -= dt;
  if (gameState.nextSpawn <= 0) {
    spawnRhythmRow();
    // Giảm dần khoảng cách spawn theo thời gian
    const elapsed = 60 - gameState.time;
    gameState.nextSpawn = Math.max(0.8, 1.8 - elapsed * 0.012);
  }

  const h = domGame.clientHeight;
  for (let i = gameState.tiles.length - 1; i >= 0; i--) {
    let t = gameState.tiles[i];
    t.y += gameState.speed * dt;
    t.el.style.top = t.y + "px";

    if (t.y > h) {
      if (!t.clicked && t.isCorrect) {
        gameState.hearts--;
        updateGameHeader();
        if (gameState.hearts <= 0) { gameOver("Hết tim"); return; }
      }
      t.el.remove();
      gameState.tiles.splice(i, 1);
    }
  }

  gameLoopId = requestAnimationFrame(rhythmLoop);
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME 4: DEFENSE — Bảo vệ túi tiền
// ─────────────────────────────────────────────────────────────────────────────
function startDefenseGame() {
  gameCanvas.hidden = true;
  domGame.hidden    = false;

  gameState.enemies   = [];
  gameState.nextSpawn = 2.5;
  gameState.speed     = 8; // % per sec

  gameState.enemyTypes = [
    { type:"sale",    icon:"📢", label:"Sale ảo",     weakness:"kinhlup"  },
    { type:"fomo",    icon:"🔥", label:"Sợ lỡ mất",  weakness:"cho24h"   },
    { type:"peer",    icon:"👥", label:"Bạn bè rủ",  weakness:"kiendinh" },
    { type:"impulse", icon:"🛍️", label:"Thích là mua",weakness:"danhsach" }
  ];

  const shieldIcons = {
    kinhlup:  { icon:"🔍", label:"Kính lúp"  },
    cho24h:   { icon:"⏱️", label:"Chờ 24h"   },
    kiendinh: { icon:"🛡️", label:"Kiên định" },
    danhsach: { icon:"📝", label:"Danh sách" }
  };

  domGame.innerHTML = `
    <div id="defenseArena" style="position:relative;width:100%;height:280px;overflow:hidden;background:radial-gradient(circle at 50% 50%,#1e3a5f,#0f172a);border-radius:12px;margin-bottom:12px;">
      <div id="walletBase" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
        width:64px;height:64px;background:linear-gradient(135deg,#eab308,#ca8a04);border-radius:50%;
        display:flex;align-items:center;justify-content:center;font-size:32px;z-index:10;
        box-shadow:0 0 24px rgba(234,179,8,0.5),0 0 48px rgba(234,179,8,0.2);">💰</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <button class="primary" id="btn-kinhlup"  style="padding:12px 8px;font-size:14px;">🔍 Kính lúp<br><small style="opacity:0.7;font-size:10px;">chống Sale ảo</small></button>
      <button class="primary" id="btn-cho24h"   style="padding:12px 8px;font-size:14px;">⏱️ Chờ 24h<br><small style="opacity:0.7;font-size:10px;">chống Sợ lỡ mất</small></button>
      <button class="primary" id="btn-kiendinh" style="padding:12px 8px;font-size:14px;">🛡️ Kiên định<br><small style="opacity:0.7;font-size:10px;">chống Bạn bè rủ</small></button>
      <button class="primary" id="btn-danhsach" style="padding:12px 8px;font-size:14px;">📝 Danh sách<br><small style="opacity:0.7;font-size:10px;">chống Thích là mua</small></button>
    </div>
  `;

  const handleShield = (type) => {
    if (!gameState.active) return;
    let target = null, maxProg = -1;
    for (let e of gameState.enemies) {
      if (e.data.weakness === type && e.progress > maxProg) { maxProg = e.progress; target = e; }
    }
    if (target) {
      SFX.shield();
      // Lưu DOM element của địch trước khi xóa khỏi mảng
      const enemyEl = target.domEl || null;
      target.dead = true;
      gameState.score += 15;
      updateGameHeader();
      spawnShieldEffect(type, target.angle, shieldIcons[type].icon, enemyEl);
    } else {
      SFX.shieldMiss();
      spawnMissEffect();
    }
    // Không gọi renderDefenseGame ở đây ngay, để animation chạy xong rồi loop sẽ xóa
  };

  document.getElementById("btn-kinhlup").onclick  = () => handleShield("kinhlup");
  document.getElementById("btn-cho24h").onclick   = () => handleShield("cho24h");
  document.getElementById("btn-kiendinh").onclick = () => handleShield("kiendinh");
  document.getElementById("btn-danhsach").onclick = () => handleShield("danhsach");

  gameLoopId = requestAnimationFrame(defenseLoop);
}

// Hiệu ứng khiên: bay ra gặp địch, địch bị đẩy lùi và biến mất
function spawnShieldEffect(type, angle, icon, enemyEl) {
  const arena = document.getElementById("defenseArena");
  if (!arena) return;

  // 1. Tạo biểu tượng khiên bay ra từ túi tiền
  const shield = document.createElement("div");
  shield.textContent = icon;
  const dist = 110; // khoảng cách bay ra
  const finalX = Math.cos(angle) * dist;
  const finalY = Math.sin(angle) * dist;
  shield.style.cssText = `
    position:absolute; left:50%; top:50%; font-size:32px; z-index:30;
    transform:translate(-50%,-50%) scale(0.3);
    opacity:1; pointer-events:none;
    transition:transform 0.3s cubic-bezier(0.22,0.61,0.36,1), opacity 0.15s ease;
  `;
  arena.appendChild(shield);

  // Giai đoạn 1: Khiên bay đến vị trí địch (300ms)
  setTimeout(() => {
    shield.style.transform = `translate(calc(-50% + ${finalX}px), calc(-50% + ${finalY}px)) scale(1.4)`;
  }, 20);

  // Giai đoạn 2: Vụ chạm + hiệu ứng đẩy lùi enemy (sau 300ms)
  setTimeout(() => {
    // Flash va chạm
    shield.style.transition = "transform 0.2s ease, opacity 0.3s ease";
    shield.style.transform  = `translate(calc(-50% + ${finalX}px), calc(-50% + ${finalY}px)) scale(2.0)`;
    shield.style.opacity    = "0";

    // Enemy bị đẩy ngược ra ngoài màn hình theo cùng hướng angle
    if (enemyEl && enemyEl.parentNode) {
      enemyEl.dataset.dying = "true";
      const pushX = Math.cos(angle) * 140;
      const pushY = Math.sin(angle) * 140;
      enemyEl.style.transition = "transform 0.4s cubic-bezier(0.36,0.07,0.19,0.97), opacity 0.4s ease";
      enemyEl.style.transform  = `translate(calc(-50% + ${pushX}px), calc(-50% + ${pushY}px)) scale(0) rotate(${angle*60}deg)`;
      enemyEl.style.opacity    = "0";
      setTimeout(() => enemyEl.remove(), 420);
    }
  }, 300);

  setTimeout(() => shield.remove(), 550);

  // Flash xanh lá trên wallet
  const wallet = document.getElementById("walletBase");
  if (wallet) {
    wallet.style.boxShadow = "0 0 32px #22c55e, 0 0 64px #22c55e";
    setTimeout(() => { wallet.style.boxShadow = "0 0 24px rgba(234,179,8,0.5),0 0 48px rgba(234,179,8,0.2)"; }, 350);
  }
}

function spawnMissEffect() {
  const arena = document.getElementById("defenseArena");
  if (!arena) return;
  const eff = document.createElement("div");
  eff.textContent = "Hụt! ❌";
  eff.style.cssText = `
    position:absolute; left:50%; top:40%; transform:translateX(-50%);
    color:#ef4444; font-weight:bold; font-size:18px; z-index:20; pointer-events:none;
    opacity:1; transition:opacity 0.6s ease;
  `;
  arena.appendChild(eff);
  setTimeout(() => { eff.style.opacity = "0"; }, 100);
  setTimeout(() => eff.remove(), 700);
}

function defenseLoop(now) {
  if (!gameState.active) return;
  const rawDt = (now - gameState.lastTime) / 1000;
  const dt    = Math.min(rawDt, 0.1);
  gameState.lastTime = now;
  gameState.time -= dt;
  updateGameHeader();

  if (gameState.time <= 0) { gameWin("Bạn đã bảo vệ túi tiền thành công!"); return; }

  updateDefenseGame(dt);
  renderDefenseGame();
  gameLoopId = requestAnimationFrame(defenseLoop);
}

function updateDefenseGame(dt) {
  gameState.nextSpawn -= dt;
  if (gameState.nextSpawn <= 0) {
    // Spawn thư thả: 2-3.5 giây
    gameState.nextSpawn = 2.0 + Math.random() * 1.5;
    const angle    = Math.random() * Math.PI * 2;
    const enemy    = gameState.enemyTypes[Math.floor(Math.random() * gameState.enemyTypes.length)];
    gameState.enemies.push({ id: Math.random().toString(36).substr(2, 9), angle, progress:0, data:enemy });
  }

  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    let e = gameState.enemies[i];
    if (e.dead) { gameState.enemies.splice(i, 1); continue; }
    e.progress += gameState.speed * dt;
    if (e.progress >= 95) {
      gameState.hearts--;
      SFX.heartLost();
      updateGameHeader();
      gameState.enemies.splice(i, 1);
      // Flash đỏ wallet
      const wallet = document.getElementById("walletBase");
      if (wallet) {
        wallet.style.boxShadow = "0 0 32px #ef4444,0 0 64px #ef4444";
        setTimeout(() => { wallet.style.boxShadow = "0 0 24px rgba(234,179,8,0.5),0 0 48px rgba(234,179,8,0.2)"; }, 400);
      }
      if (gameState.hearts <= 0) { gameOver("Bạn đã tiêu hết tiền vào cám dỗ!"); return; }
    }
  }

  // Tăng tốc dần nhẹ
  gameState.speed += dt * 0.15;
}

function renderDefenseGame() {
  const arena = document.getElementById("defenseArena");
  if (!arena) return;

  // Chỉ xóa DOM của enemy đã biến mất hoặc không còn trong gameState
  // Để kích hoạt animation, ta render tăng dần thay vì xóa rồi tạo lại
  const activeIds = new Set(gameState.enemies.map(e => e.id));
  Array.from(arena.querySelectorAll(".enemyEl")).forEach(el => {
    if (!activeIds.has(el.dataset.id)) {
      // Giữ lại những enemy đố sẩp bị animation đẩy lùi (dead nhưng có transition)
      if (!el.dataset.dying) el.remove();
    }
  });

  gameState.enemies.forEach(e => {
    if (e.dead) return; // Bỏ qua enemy đả dead, animation sẽ tự xóa
    let el = arena.querySelector(`.enemyEl[data-id="${e.id}"]`);
    if (!el) {
      el = document.createElement("div");
      el.className = "enemyEl";
      el.dataset.id = e.id;
      const colors = { sale:"#f97316", fomo:"#ef4444", peer:"#8b5cf6", impulse:"#ec4899" };
      el.innerHTML = `
        <div style="font-size:22px;filter:drop-shadow(0 0 6px ${colors[e.data.type]});">${e.data.icon}</div>
        <div style="font-size:9px;color:#fff;background:rgba(0,0,0,0.6);padding:2px 5px;border-radius:4px;white-space:nowrap;margin-top:2px;">${e.data.label}</div>
      `;
      el.style.cssText = `
        position:absolute;
        display:flex; flex-direction:column; align-items:center;
        filter:drop-shadow(0 0 4px ${colors[e.data.type]});
      `;
      arena.appendChild(el);
      e.domEl = el; // Lưu tham chiếu DOM
    }

    const radius = 45 * (1 - e.progress / 100);
    const x = 50 + radius * Math.cos(e.angle);
    const y = 50 + radius * Math.sin(e.angle);
    el.style.left      = `${x}%`;
    el.style.top       = `${y}%`;
    el.style.transform = "translate(-50%,-50%)";
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
setTimeout(initArcade, 100);
