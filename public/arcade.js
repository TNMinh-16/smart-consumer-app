// ARCADE ENGINE AND MINI-GAMES

// Arcade State Management
const arcadeBadges = ["Ví tiền tỉnh táo", "Kính lúp kiểm chứng", "Bản đồ 6 bước", "Lá chắn trước cám dỗ"];
let currentGame = null;
let gameLoopId = null;

// DOM Elements
const arcadeMenu = document.getElementById("arcadeMenu");
const gameViewport = document.getElementById("gameViewport");
const exitGameBtn = document.getElementById("exitGameBtn");
const gameCanvas = document.getElementById("gameCanvas");
const domGame = document.getElementById("domGame");

const gameOverlay = document.getElementById("gameOverlay");
const gameScoreDisplay = document.getElementById("gameScoreDisplay");
const gameTimeDisplay = document.getElementById("gameTimeDisplay");
const gameHeartsDisplay = document.getElementById("gameHeartsDisplay");

// Arcade Setup
function initArcade() {
  const checkBtn = document.getElementById("checkLessonBtn");
  if (checkBtn) {
    checkBtn.addEventListener("click", () => {
      document.getElementById("knowledgeSummaryView").hidden = true;
      document.getElementById("arcadeMenu").hidden = false;
    });
  }
  document.querySelectorAll(".arcadeBtn").forEach(btn => {
    btn.addEventListener("click", () => startGame(Number(btn.dataset.game)));
  });
  
  exitGameBtn.addEventListener("click", () => {
    if (!document.getElementById("gameIntroOverlay").hidden) {
      endGameContext();
      return;
    }
    
    if (gameState.active || document.getElementById("gameOverlay").hidden) {
      const wasActive = gameState.active;
      gameState.active = false;
      showConfirmOverlay("Tạm dừng", "Em muốn thoát thử thách này chứ?", "Thoát", "Tiếp tục chơi", () => {
        endGameContext();
      }, () => {
        if (wasActive) {
          gameState.active = true;
          gameState.lastTime = performance.now();
        }
      });
    } else {
      endGameContext();
    }
  });
  
  updateArcadeUI();
}

function updateArcadeUI() {
  if (!state.arcade) state.arcade = {};
  
  let totalStars = 0;
  for (let i = 1; i <= 4; i++) {
    const stars = state.arcade[`g${i}`] || 0;
    totalStars += stars;
    
    // Update menu stars
    const starEl = document.getElementById(`starsG${i}`);
    if (starEl) {
      starEl.textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    }
    
    // Update badge (earned if stars >= 2)
    let badgeContainer = document.getElementById("arcadeBadgesDisplay");
    if (!badgeContainer.querySelector(`[data-b="${i}"]`)) {
      badgeContainer.innerHTML += `<div class="badgeIcon" data-b="${i}" title="${arcadeBadges[i-1]}">${["🎒", "🔍", "🗺️", "🛡️"][i-1]}</div>`;
    }
    const badgeEl = badgeContainer.querySelector(`[data-b="${i}"]`);
    if (badgeEl) {
      badgeEl.classList.toggle("unlocked", stars >= 2);
    }
  }
  
  document.getElementById("totalArcadeStars").textContent = totalStars;
  
  // Unlock section 3 if stars >= 6
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

// Global Game State
const ctx = gameCanvas.getContext("2d");
let gameState = {
  score: 0,
  hearts: 3,
  time: 60,
  active: false,
  entities: [],
  lastTime: 0
};

function startGame(gameId) {
  arcadeMenu.hidden = true;
  gameViewport.hidden = false;
  gameCanvas.hidden = true;
  domGame.hidden = true;
  gameOverlay.hidden = true;
  document.getElementById("gameIntroOverlay").hidden = false;
  
  // Resize canvas
  gameCanvas.width = gameViewport.clientWidth || 300;
  gameCanvas.height = gameViewport.clientHeight || 500;
  
  const intros = {
    1: { title: "Giỏ hàng thông thái", visual: "🛒 📝 💰", rules: "<ul><li>Di chuột hoặc vuốt để di chuyển giỏ hàng.</li><li>Hứng các món đồ <b>Nhu cầu</b> (Gạo, Sữa, Sách) trong danh sách để hoàn thành mục tiêu.</li><li>Nếu hứng nhầm <b>Mong muốn</b> (Đồ chơi, Trà sữa) sẽ bị trừ Ngân sách.</li><li>Trò chơi kết thúc nếu Ngân sách cạn kiệt!</li></ul>" },
    2: { title: "Mắt thần mua sắm", visual: "⚔️ 🏷️ 🛡️", rules: "<ul><li>Kéo chuột hoặc vuốt để chém các thẻ bài rớt xuống.</li><li>Chém thẻ <b>Rủi ro</b> (Giá siêu rẻ, Không đổi trả) để lấy điểm.</li><li><b>Đừng chém</b> thẻ <b>Thông tin tốt</b> (Nguồn gốc rõ ràng, Có ảnh thật).</li><li>Chém đúng liên tục để kích hoạt làm chậm thời gian!</li></ul>" },
    3: { title: "Nhịp mua thông minh", visual: "🎵 🎹 🎯", rules: "<ul><li>Các thẻ nhạc sẽ rơi xuống vạch đích ở dưới.</li><li>Bấm vào ô chứa <b>Bước mua sắm đúng</b> (Ví dụ: Xác định nhu cầu, Tìm hiểu thông tin...).</li><li><b>Không bấm</b> vào thẻ Cám dỗ (Mua ngay, Tin review...).</li></ul>" },
    4: { title: "Bảo vệ túi tiền", visual: "🛡️ 💰 ⚔️", rules: "<ul><li>Các Cám dỗ sẽ tấn công túi tiền của bạn từ 4 phía.</li><li>Sử dụng các <b>Lá chắn</b> tương ứng (🔍 Kính lúp, 🛡️ Kiên định, 📝 Danh sách, ⏱️ Chờ 24h) để tiêu diệt cám dỗ.</li><li>Chọn sai lá chắn hoặc để cám dỗ chạm vào ví, bạn sẽ mất 1 tim!</li></ul>" }
  };
  
  document.getElementById("introTitle").textContent = intros[gameId].title;
  document.getElementById("introVisual").innerHTML = intros[gameId].visual;
  document.getElementById("introRules").innerHTML = intros[gameId].rules;
  
  const startBtn = document.getElementById("startBtn");
  startBtn.onclick = () => {
    document.getElementById("gameIntroOverlay").hidden = true;
    gameState = { score: 0, hearts: 3, time: gameId === 1 ? 60 : (gameId === 2 ? 45 : 60), active: true, entities: [], lastTime: performance.now(), gameId };
    updateGameHeader();
    
    if (gameId === 1) startCartGame();
    else if (gameId === 2) startSlicerGame();
    else if (gameId === 3) startRhythmGame();
    else if (gameId === 4) startDefenseGame();
  };
}

function updateGameHeader() {
  gameScoreDisplay.textContent = `Điểm: ${gameState.score}`;
  gameTimeDisplay.textContent = `⏱ ${Math.ceil(gameState.time)}s`;
  gameHeartsDisplay.textContent = "❤️".repeat(gameState.hearts) + "🖤".repeat(3 - gameState.hearts);
}

function showOverlay(title, text, btnText, onAction, btnClass="primary") {
  gameState.active = false;
  document.getElementById("overlayTitle").textContent = title;
  document.getElementById("overlayText").textContent = text;
  const actions = document.getElementById("overlayActions");
  actions.innerHTML = `<button class="${btnClass}">${btnText}</button>`;
  actions.querySelector("button").addEventListener("click", () => {
    gameOverlay.hidden = true;
    gameState.active = true;
    gameState.lastTime = performance.now();
    if (onAction) onAction();
  });
  gameOverlay.hidden = false;
}

function showConfirmOverlay(title, text, confirmBtnText, cancelBtnText, onConfirm, onCancel) {
  gameState.active = false;
  document.getElementById("overlayTitle").textContent = title;
  document.getElementById("overlayText").textContent = text;
  const actions = document.getElementById("overlayActions");
  actions.innerHTML = `
    <button class="ghost" id="overlayCancelBtn">${cancelBtnText}</button>
    <button class="primary" id="overlayConfirmBtn">${confirmBtnText}</button>
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

function stopGameLoop() {
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  domGame.innerHTML = "";
}

function endGameContext() {
  stopGameLoop();
  gameViewport.hidden = true;
  arcadeMenu.hidden = false;
  updateArcadeUI();
  save(); // from static.js
}

function calculateStars() {
  if (gameState.hearts <= 0) return 0;
  if (gameState.score >= 100) return 3;
  if (gameState.score >= 50) return 2;
  return 1;
}

function gameOver(reason) {
  stopGameLoop();
  gameState.active = false;
  
  let stars = 0;
  let msg = "";
  
  if (gameState.hearts <= 0) {
    msg = "Em đã hết tim! Hãy chú ý và cẩn thận hơn ở lần sau.";
  } else {
    stars = calculateStars();
    if (gameState.gameId === 1) {
      if (stars === 3) msg = "Em biết ưu tiên nhu cầu và né áp lực mua sắm.";
      else if (stars === 2) msg = "Em đã nhận ra nhiều cạm bẫy; thử chú ý hơn đến các khoản mua theo cảm xúc.";
      else msg = "Hãy dừng 10 giây trước khi quyết định mua.";
      msg += " Ghi nhớ: Ưu tiên 'Nhu cầu' trước, cân nhắc 'Mong muốn' sau!";
    } else if (gameState.gameId === 2) {
      msg = "Phát hiện dấu hiệu rủi ro giúp em: Tiết kiệm tiền, bảo vệ sức khỏe và quyền lợi!";
      msg += " Ghi nhớ: Luôn kiểm tra nguồn gốc và chính sách đổi trả.";
    } else if (gameState.gameId === 3) {
      msg = "Tuyệt vời, em đã nhớ được chuỗi logic mua sắm thông minh!";
      msg += " Ghi nhớ: Xác định nhu cầu → Tìm hiểu → So sánh → Cân nhắc chi trả.";
    } else if (gameState.gameId === 4) {
      msg = "Em đã dùng công cụ hợp lý để chống lại các cám dỗ tiêu dùng.";
      msg += " Ghi nhớ: Hãy chờ 24h trước khi mua một món đồ không có trong kế hoạch.";
    }
  }
  
  // Save max stars
  const currentStars = state.arcade[`g${gameState.gameId}`] || 0;
  if (stars > currentStars) {
    state.arcade[`g${gameState.gameId}`] = stars;
  }
  
  showOverlay(stars > 0 ? `Hoàn thành! (${stars} Sao)` : "Thử lại nhé", msg, "Quay lại Menu", () => {
    endGameContext();
  });
}

// ----------------------------------------------------
// GAME 1: CART (Giỏ hàng thông thái)
// ----------------------------------------------------
function startCartGame() {
  gameCanvas.hidden = false;
  
  // Game Setup
  gameState.cart = { x: gameCanvas.width / 2, width: 110, height: 40 };
  gameState.budget = 500000;
  gameState.needs = [
    { type: 'Gạo', icon: '🍚', count: 2, collected: 0, price: 100000 },
    { type: 'Sữa', icon: '🥛', count: 3, collected: 0, price: 50000 },
    { type: 'Sách', icon: '📚', count: 2, collected: 0, price: 40000 }
  ];
  gameState.items = [];
  gameState.nextSpawn = 2.0;
  gameState.speed = 150;
  gameState.firstMistakeMade = false;
  gameState.floatingTexts = [];
  
  // Mouse / Touch controls
  const updateCartPos = (clientX) => {
    const rect = gameCanvas.getBoundingClientRect();
    const x = clientX - rect.left;
    gameState.cart.x = Math.max(gameState.cart.width/2, Math.min(gameCanvas.width - gameState.cart.width/2, x));
  };
  
  gameCanvas.onmousemove = (e) => updateCartPos(e.clientX);
  gameCanvas.ontouchmove = (e) => { e.preventDefault(); updateCartPos(e.touches[0].clientX); };
  
  cartLoop();
}

function cartLoop() {
  if (!gameState.active) return;
  const now = performance.now();
  const dt = (now - gameState.lastTime) / 1000;
  gameState.lastTime = now;
  gameState.time -= dt;
  
  if (gameState.time <= 0) {
    gameOver("Hết giờ! Bạn chưa mua đủ đồ.");
    return;
  }
  
  updateCartGame(dt);
  drawCartGame();
  
  gameLoopId = requestAnimationFrame(cartLoop);
}

function updateCartGame(dt) {
  // Spawn items
  gameState.nextSpawn -= dt;
  if (gameState.nextSpawn <= 0) {
    gameState.nextSpawn = 1.0 + Math.random() * 0.5;
    const isNeed = Math.random() > 0.5;
    let itemData;
    if (isNeed) {
      const needed = gameState.needs.filter(n => n.collected < n.count);
      if (needed.length > 0) {
        itemData = needed[Math.floor(Math.random() * needed.length)];
      } else {
        itemData = gameState.needs[0]; // fallback
      }
    } else {
      const wants = [
        { type: 'Trà sữa', icon: '🧋', price: 60000 },
        { type: 'Đồ chơi', icon: '🎮', price: 200000 },
        { type: 'Bánh kẹo', icon: '🍬', price: 30000 }
      ];
      itemData = wants[Math.floor(Math.random() * wants.length)];
      itemData.isWant = true;
    }
    
    gameState.items.push({
      x: 30 + Math.random() * (gameCanvas.width - 60),
      y: -30,
      data: itemData
    });
  }
  
  // Update & collide
  for (let i = gameState.items.length - 1; i >= 0; i--) {
    let item = gameState.items[i];
    item.y += gameState.speed * dt;
    
    // Collision with cart
    const cart = gameState.cart;
    if (item.y + 15 > gameCanvas.height - cart.height && item.y - 15 < gameCanvas.height) {
      if (Math.abs(item.x - cart.x) < cart.width / 2 + 15) {
        // Collided!
        if (item.data.isWant) {
          if (!gameState.firstMistakeMade) {
            gameState.budget -= item.data.price / 2;
            gameState.floatingTexts.push({ x: item.x, y: item.y, text: "Đây là mong muốn!", color: "#f59e0b", age: 0 });
            gameState.firstMistakeMade = true;
          } else {
            gameState.budget -= item.data.price;
            gameState.floatingTexts.push({ x: item.x, y: item.y, text: "-" + item.data.price / 1000 + "k", color: "#ef4444", age: 0 });
          }
        } else {
          gameState.budget -= item.data.price;
          const needRef = gameState.needs.find(n => n.type === item.data.type);
          if (needRef && needRef.collected < needRef.count) {
            needRef.collected++;
            gameState.score += 10;
            updateGameHeader();
          }
          gameState.floatingTexts.push({ x: item.x, y: item.y, text: "Đã mua " + item.data.type, color: "#22c55e", age: 0 });
        }
        
        gameState.items.splice(i, 1);
        
        // Check win/loss
        if (gameState.budget < 0) {
          gameOver("Thủng ví! Bạn đã tiêu lạm vào Ngân sách.");
          return;
        }
        
        const allNeedsMet = gameState.needs.every(n => n.collected >= n.count);
        if (allNeedsMet) {
          gameState.score += 50; // Win bonus
          gameWin("Tuyệt vời! Bạn đã mua đủ đồ và vẫn giữ được ngân sách.");
          return;
        }
        
        continue;
      }
    }
    
    if (item.y > gameCanvas.height + 30) {
      gameState.items.splice(i, 1);
    }
  }
  
  gameState.floatingTexts.forEach(ft => ft.age += dt);
  gameState.floatingTexts = gameState.floatingTexts.filter(ft => ft.age < 1);
}

function drawCartGame() {
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  
  // Draw Budget
  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px Montserrat";
  ctx.textAlign = "left";
  ctx.fillText("Ngân sách: " + (gameState.budget / 1000) + "k", 10, 25);
  
  // Draw Needs list
  ctx.font = "14px Montserrat";
  let ly = 50;
  gameState.needs.forEach(n => {
    ctx.fillStyle = n.collected >= n.count ? "#888" : "#fff";
    ctx.fillText(n.icon + " " + n.type + ": " + n.collected + "/" + n.count, 10, ly);
    ly += 22;
  });
  
  // Draw Cart
  const cart = gameState.cart;
  ctx.fillStyle = "#3b82f6";
  ctx.beginPath();
  ctx.roundRect(cart.x - cart.width/2, gameCanvas.height - cart.height, cart.width, cart.height, [4, 4, 12, 12]);
  ctx.fill();
  
  // Draw Items
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "24px Arial";
  gameState.items.forEach(item => {
    ctx.fillText(item.data.icon, item.x, item.y);
  });
  
  // Draw floating texts
  gameState.floatingTexts.forEach(ft => {
    ctx.fillStyle = ft.color;
    ctx.font = "bold 16px Montserrat";
    ctx.globalAlpha = 1 - ft.age;
    ctx.fillText(ft.text, ft.x, ft.y - ft.age * 50);
  });
  ctx.globalAlpha = 1;
}

// ----------------------------------------------------
// GAME 2: SLICER (Mắt thần mua sắm)
// ----------------------------------------------------
function startSlicerGame() {
  gameCanvas.hidden = false;
  gameState.nextSpawn = 2.0;
  gameState.combo = 0;
  gameState.slowMo = 1;
  gameState.cards = [];
  gameState.mouse = { x: 0, y: 0, active: false };
  gameState.sliceTrail = [];
  
  const handleStart = (x, y) => { gameState.mouse = { x, y, active: true }; gameState.sliceTrail = [{x,y}]; };
  const handleMove = (x, y) => { if (gameState.mouse.active) { gameState.mouse.x = x; gameState.mouse.y = y; gameState.sliceTrail.push({x,y}); if(gameState.sliceTrail.length > 10) gameState.sliceTrail.shift(); }};
  const handleEnd = () => { gameState.mouse.active = false; gameState.sliceTrail = []; };
  
  gameCanvas.onmousedown = e => handleStart(e.offsetX, e.offsetY);
  gameCanvas.onmousemove = e => handleMove(e.offsetX, e.offsetY);
  gameCanvas.onmouseup = handleEnd;
  gameCanvas.onmouseleave = handleEnd;
  
  gameCanvas.ontouchstart = e => handleStart(e.touches[0].clientX - gameCanvas.getBoundingClientRect().left, e.touches[0].clientY - gameCanvas.getBoundingClientRect().top);
  gameCanvas.ontouchmove = e => handleMove(e.touches[0].clientX - gameCanvas.getBoundingClientRect().left, e.touches[0].clientY - gameCanvas.getBoundingClientRect().top);
  gameCanvas.ontouchend = handleEnd;
  
  requestAnimationFrame(slicerLoop);
}

function slicerLoop(time) {
  if (!gameState.active) return;
  const dt = ((time - gameState.lastTime) / 1000) * gameState.slowMo;
  gameState.lastTime = time;
  
  gameState.time -= dt;
  if (gameState.time <= 0) return gameOver("Hết giờ");
  
  if (gameState.slowMo < 1) gameState.slowMo += dt * 0.2; // Recover slowmo
  else gameState.slowMo = 1;
  
  gameState.nextSpawn -= dt;
  if (gameState.nextSpawn <= 0) {
    const x = 50 + Math.random() * (gameCanvas.width - 100);
    const vx = (Math.random() - 0.5) * 100;
    const vy = -400 - Math.random() * 200;
    const isBad = Math.random() < 0.6;
    const text = isBad ? ["Giá siêu rẻ", "Không đổi trả", "Cam kết khỏi 100%"][Math.floor(Math.random()*3)] : ["Nguồn gốc rõ ràng", "Có ảnh thật", "Bảo hành 12th"][Math.floor(Math.random()*3)];
    
    gameState.cards.push({ x, y: gameCanvas.height, vx, vy, isBad, text, sliced: false, rot: 0, vrot: (Math.random()-0.5)*5 });
    gameState.nextSpawn = 1.5 + Math.random();
  }
  
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  
  // Cards
  for (let i = gameState.cards.length - 1; i >= 0; i--) {
    let c = gameState.cards[i];
    if (c.sliced) {
      c.vy += 800 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vrot * dt;
    } else {
      c.vy += 800 * dt; // gravity
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rot += c.vrot * dt;
      
      // Check slice
      if (gameState.mouse.active && gameState.sliceTrail.length > 1) {
        const last = gameState.sliceTrail[gameState.sliceTrail.length - 1];
        const prev = gameState.sliceTrail[gameState.sliceTrail.length - 2];
        const dist = Math.hypot(c.x - last.x, c.y - last.y);
        if (dist < 40) {
          c.sliced = true;
          if (c.isBad) {
            gameState.score += 10;
            gameState.combo++;
            if (gameState.combo >= 5) {
              gameState.combo = 0;
              gameState.slowMo = 0.3;
            }
          } else {
            gameState.combo = 0;
            gameState.hearts--;
            if (gameState.hearts <= 0) return gameOver("Hết tim");
          }
          updateGameHeader();
        }
      }
      
      if (c.y > gameCanvas.height + 100 && c.vy > 0) {
        if (c.isBad && !c.sliced) {
          gameState.hearts--;
          gameState.combo = 0;
          updateGameHeader();
          if (gameState.hearts <= 0) return gameOver("Hết tim");
        }
        gameState.cards.splice(i, 1);
        continue;
      }
    }
    
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.fillStyle = c.sliced ? "#94a3b8" : (c.isBad ? "#fee2e2" : "#dcfce7");
    ctx.fillRect(-60, -30, 120, 60);
    ctx.strokeStyle = c.isBad ? "#ef4444" : "#22c55e";
    ctx.strokeRect(-60, -30, 120, 60);
    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(c.text, 0, 0);
    ctx.restore();
  }
  
  // Trail
  if (gameState.sliceTrail.length > 1) {
    ctx.beginPath();
    ctx.moveTo(gameState.sliceTrail[0].x, gameState.sliceTrail[0].y);
    for (let i=1; i<gameState.sliceTrail.length; i++) ctx.lineTo(gameState.sliceTrail[i].x, gameState.sliceTrail[i].y);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  
  gameLoopId = requestAnimationFrame(slicerLoop);
}

// ----------------------------------------------------
// GAME 3: RHYTHM (Nhịp mua thông minh)
// ----------------------------------------------------
function startRhythmGame() {
  domGame.hidden = false;
  
  const stepsList = [
    "Xác định nhu cầu",
    "Tìm hiểu sản phẩm",
    "So sánh lựa chọn",
    "Cân nhắc chi trả",
    "Kiểm tra quảng cáo",
    "Mua theo kế hoạch"
  ];
  
  gameState.currentStep = 0;
  gameState.tiles = [];
  gameState.speed = 100; // pixels per sec
  gameState.nextSpawn = 2.0;
  gameState.speedMult = 1;
  
  domGame.innerHTML = `
    <div class="rhythmGrid">
      <div class="rhythmCol" id="rCol0"></div>
      <div class="rhythmCol" id="rCol1"></div>
      <div class="rhythmCol" id="rCol2"></div>
      <div class="rhythmCol" id="rCol3"></div>
      <div class="rhythmTarget"></div>
    </div>
  `;
  
  requestAnimationFrame(rhythmLoop);
}

function spawnRhythmRow() {
  const isCorrect = Math.random() > 0.3; // 70% chance to spawn the correct step
  const correctStep = ["Xác định nhu cầu", "Tìm hiểu sản phẩm", "So sánh lựa chọn", "Cân nhắc chi trả", "Kiểm tra quảng cáo", "Mua theo kế hoạch"][gameState.currentStep];
  const traps = ["Mua ngay kẻo hết", "Tin review đầu tiên", "Hỏi bạn rồi mua theo", "Mua vì giảm giá", "Mua theo cảm xúc"];
  
  let colIndices = [0, 1, 2, 3];
  colIndices.sort(() => Math.random() - 0.5);
  
  const targetCol = colIndices.pop();
  const text = isCorrect ? correctStep : traps[Math.floor(Math.random()*traps.length)];
  const isTrap = !isCorrect;
  
  const el = document.createElement("div");
  el.className = `rhythmTile ${isTrap ? 'trap' : 'correct'}`;
  el.textContent = text;
  el.style.top = "-100px";
  
  document.getElementById(`rCol${targetCol}`).appendChild(el);
  
  const tileObj = { el, y: -100, isTrap, clicked: false, isCorrect };
  
  el.onmousedown = () => handleRhythmClick(tileObj);
  el.ontouchstart = (e) => { e.preventDefault(); handleRhythmClick(tileObj); };
  
  gameState.tiles.push(tileObj);
}

function handleRhythmClick(t) {
  if (t.clicked) return;
  t.clicked = true;
  t.el.classList.add("clicked");
  
  if (t.isTrap) {
    gameState.speedMult = 0.2; // slow down
    t.el.style.background = "#94a3b8";
    gameState.hearts--;
    updateGameHeader();
    if (gameState.hearts <= 0) gameOver("Hết tim");
  } else if (t.isCorrect) {
    gameState.score += 20;
    gameState.currentStep++;
    gameState.speedMult = 1;
    t.el.style.background = "#22c55e";
    updateGameHeader();
    
    // Brief explanation
    const msg = [
      "Trước khi xem giá, hãy biết mình có thật sự cần món này không.",
      "Tìm kiếm thông tin rõ ràng về sản phẩm.",
      "Không bao giờ chọn ngay lựa chọn đầu tiên.",
      "Kiểm tra xem nó có nằm trong ngân sách không.",
      "Đừng tin 100% vào quảng cáo hấp dẫn.",
      "Chốt đơn theo đúng những gì đã định."
    ][gameState.currentStep - 1];
    
    // Simple toast
    const toast = document.createElement("div");
    toast.style.position = "absolute";
    toast.style.top = "20%";
    toast.style.left = "50%";
    toast.style.transform = "translate(-50%, -50%)";
    toast.style.background = "rgba(0,0,0,0.8)";
    toast.style.color = "#fff";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "8px";
    toast.style.zIndex = "100";
    toast.textContent = msg;
    domGame.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
    
    if (gameState.currentStep >= 6) {
      setTimeout(() => gameOver("Hoàn thành chuỗi"), 1000);
    }
  }
}

function rhythmLoop(time) {
  if (!gameState.active) return;
  const dt = ((time - gameState.lastTime) / 1000) * gameState.speedMult;
  gameState.lastTime = time;
  
  gameState.time -= dt;
  if (gameState.time <= 0) return gameOver("Hết giờ");
  
  if (gameState.speedMult < 1) gameState.speedMult += dt * 0.5;
  else gameState.speedMult = 1;
  
  gameState.nextSpawn -= dt;
  if (gameState.nextSpawn <= 0) {
    spawnRhythmRow();
    gameState.nextSpawn = 1.5 + Math.random();
  }
  
  const h = domGame.clientHeight;
  const targetY = h - 120;
  
  for (let i = gameState.tiles.length - 1; i >= 0; i--) {
    let t = gameState.tiles[i];
    t.y += gameState.speed * dt;
    t.el.style.transform = `translateY(${t.y}px)`;
    
    if (t.y > h) {
      if (!t.clicked && t.isCorrect) {
        // Missed correct tile
        t.el.classList.add("missed");
        gameState.hearts--;
        updateGameHeader();
        if (gameState.hearts <= 0) return gameOver("Hết tim");
      }
      t.el.remove();
      gameState.tiles.splice(i, 1);
    }
  }
  
  gameLoopId = requestAnimationFrame(rhythmLoop);
}

function updateTemptBar() {
  const bar = document.getElementById("temptBar");
  if(bar) bar.style.width = `${gameState.temptation}%`;
}

function showDOMFloatingText(col, row, text, color, offsetY = 0) {
  const container = document.getElementById("mFloatContainer");
  if (!container) return;
  const el = document.createElement("div");
  el.textContent = text;
  el.style.position = "absolute";
  el.style.left = `calc(${(col + 0.5) * (100/6)}%)`;
  el.style.top = `calc(${(row + 0.5) * (100/6)}% + ${offsetY}px)`;
  el.style.transform = "translate(-50%, -50%)";
  el.style.color = color;
  el.style.fontWeight = "bold";
  el.style.fontSize = "16px";
  el.style.textShadow = "0 2px 4px rgba(0,0,0,0.8)";
  el.style.pointerEvents = "none";
  el.style.transition = "all 1s ease-out";
  el.style.whiteSpace = "nowrap";
  el.style.zIndex = "100";
  container.appendChild(el);
  
  setTimeout(() => {
    el.style.top = `calc(${(row + 0.5) * (100/6)}% - 50px + ${offsetY}px)`;
    el.style.opacity = "0";
  }, 50);
  
  setTimeout(() => el.remove(), 1050);
}

// ----------------------------------------------------
// GAME 4: DEFENSE (Bảo vệ túi tiền)
// ----------------------------------------------------
function startDefenseGame() {
  gameCanvas.hidden = true;
  domGame.hidden = false;
  
  gameState.enemies = [];
  gameState.nextSpawn = 2.0;
  gameState.speed = 10; // percent per sec
  
  gameState.enemyTypes = [
    { type: 'sale', icon: '📢', label: 'Sale ảo', weakness: 'kinhlup' },
    { type: 'fomo', icon: '🔥', label: 'Sợ lỡ mất', weakness: 'cho24h' },
    { type: 'peer', icon: '👥', label: 'Bạn bè rủ', weakness: 'kiendinh' },
    { type: 'impulse', icon: '🛍️', label: 'Thích là mua', weakness: 'danhsach' }
  ];
  
  domGame.innerHTML = `
    <div id="defenseArena" style="position:relative; width:100%; height:300px; overflow:hidden; background:#1e293b; border-radius:12px; margin-bottom:16px;">
      <div id="walletBase" style="position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); width:60px; height:60px; background:#eab308; border-radius:30px; display:flex; align-items:center; justify-content:center; font-size:32px; z-index:10; box-shadow:0 0 20px rgba(234, 179, 8, 0.4);">💰</div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      <button class="primary" id="btn-kinhlup" style="padding:12px 8px; font-size:14px;">🔍 Kính lúp</button>
      <button class="primary" id="btn-cho24h" style="padding:12px 8px; font-size:14px;">⏱️ Chờ 24h</button>
      <button class="primary" id="btn-kiendinh" style="padding:12px 8px; font-size:14px;">🛡️ Kiên định</button>
      <button class="primary" id="btn-danhsach" style="padding:12px 8px; font-size:14px;">📝 Danh sách</button>
    </div>
    <div id="mFloatContainer" style="position: absolute; inset: 0; pointer-events: none; z-index: 50;"></div>
  `;
  
  const handleShield = (type) => {
    if (!gameState.active) return;
    
    // Find closest enemy matching this weakness
    let target = null;
    let maxProgress = -1;
    for (let e of gameState.enemies) {
      if (e.data.weakness === type && e.progress > maxProgress) {
        maxProgress = e.progress;
        target = e;
      }
    }
    
    if (target) {
      target.dead = true;
      gameState.score += 15;
      updateGameHeader();
      showDOMFloatingText(target.progress, target.angle, "Chặn thành công!", "#22c55e", -20, true);
    } else {
      showDOMFloatingText(50, Math.random()*Math.PI*2, "Hụt!", "#94a3b8", -20, true);
    }
    renderDefenseGame();
  };
  
  document.getElementById("btn-kinhlup").onclick = () => handleShield("kinhlup");
  document.getElementById("btn-cho24h").onclick = () => handleShield("cho24h");
  document.getElementById("btn-kiendinh").onclick = () => handleShield("kiendinh");
  document.getElementById("btn-danhsach").onclick = () => handleShield("danhsach");
  
  defenseLoop();
}

function defenseLoop() {
  if (!gameState.active) return;
  const now = performance.now();
  const dt = (now - gameState.lastTime) / 1000;
  gameState.lastTime = now;
  gameState.time -= dt;
  
  if (gameState.time <= 0) {
    gameWin("Bạn đã bảo vệ túi tiền thành công!");
    return;
  }
  
  updateDefenseGame(dt);
  renderDefenseGame();
  
  gameLoopId = requestAnimationFrame(defenseLoop);
}

function updateDefenseGame(dt) {
  gameState.nextSpawn -= dt;
  if (gameState.nextSpawn <= 0) {
    gameState.nextSpawn = 1.0 + Math.random() * 0.8;
    const angle = Math.random() * Math.PI * 2;
    const enemyData = gameState.enemyTypes[Math.floor(Math.random() * gameState.enemyTypes.length)];
    gameState.enemies.push({
      angle: angle,
      progress: 0,
      data: enemyData,
      id: Math.random().toString(36).substr(2, 9)
    });
  }
  
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    let e = gameState.enemies[i];
    if (e.dead) {
      gameState.enemies.splice(i, 1);
      continue;
    }
    
    e.progress += gameState.speed * dt;
    if (e.progress >= 95) {
      gameState.hearts--;
      updateGameHeader();
      showDOMFloatingText(100, e.angle, "Bị cám dỗ!", "#ef4444", -30, true);
      gameState.enemies.splice(i, 1);
      
      if (gameState.hearts <= 0) {
        gameOver("Bạn đã tiêu hết tiền vào cám dỗ!");
        return;
      }
    }
  }
  
  gameState.speed += dt * 0.2;
}

function renderDefenseGame() {
  const arena = document.getElementById("defenseArena");
  if (!arena) return;
  
  Array.from(arena.children).forEach(child => {
    if (child.id !== "walletBase") child.remove();
  });
  
  gameState.enemies.forEach(e => {
    const el = document.createElement("div");
    el.innerHTML = `<div style="font-size:24px;">${e.data.icon}</div><div style="font-size:10px; color:#fff; background:rgba(0,0,0,0.5); padding:2px 4px; border-radius:4px; white-space:nowrap;">${e.data.label}</div>`;
    el.style.position = "absolute";
    
    const radius = 50 * (1 - e.progress / 100);
    const x = 50 + radius * Math.cos(e.angle);
    const y = 50 + radius * Math.sin(e.angle);
    
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.style.transform = "translate(-50%, -50%)";
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.alignItems = "center";
    
    arena.appendChild(el);
  });
}


// Init hook
setTimeout(initArcade, 100);
