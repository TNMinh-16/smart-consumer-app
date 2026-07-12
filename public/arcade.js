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
  document.querySelectorAll(".arcadeBtn").forEach(btn => {
    btn.addEventListener("click", () => startGame(Number(btn.dataset.game)));
  });
  
  exitGameBtn.addEventListener("click", () => {
    endGameContext();
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
  
  // Resize canvas
  gameCanvas.width = gameViewport.clientWidth || 300;
  gameCanvas.height = gameViewport.clientHeight || 500;
  
  gameState = { score: 0, hearts: 3, time: gameId === 1 ? 60 : (gameId === 2 ? 45 : 60), active: true, entities: [], lastTime: performance.now(), gameId };
  updateGameHeader();
  
  if (gameId === 1) startRunnerGame();
  else if (gameId === 2) startSlicerGame();
  else if (gameId === 3) startRhythmGame();
  else if (gameId === 4) startMatch3Game();
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
    } else if (gameState.gameId === 2) {
      msg = "Phát hiện dấu hiệu rủi ro giúp em: Tiết kiệm tiền, bảo vệ sức khỏe và quyền lợi!";
    } else if (gameState.gameId === 3) {
      msg = "Tuyệt vời, em đã nhớ được chuỗi logic mua sắm thông minh!";
    } else if (gameState.gameId === 4) {
      msg = "Em đã dùng công cụ hợp lý để chống lại các cám dỗ tiêu dùng.";
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
// GAME 1: RUNNER (Đường đua lựa chọn)
// ----------------------------------------------------
function startRunnerGame() {
  gameCanvas.hidden = false;
  gameState.player = { lane: 1, y: gameCanvas.height - 100, targetLane: 1 };
  gameState.speed = 200; // pixels per sec
  gameState.nextSpawn = 1;
  gameState.gates = 0;
  
  gameCanvas.addEventListener("touchstart", handleTouchStart, {passive: false});
  gameCanvas.addEventListener("touchmove", handleTouchMove, {passive: false});
  gameCanvas.addEventListener("touchend", handleTouchEnd, {passive: false});
  window.addEventListener("keydown", handleKeyDown);
  
  requestAnimationFrame(runnerLoop);
}

// Touch Handling (Swipe)
let touchStartX = 0;
function handleTouchStart(e) { touchStartX = e.touches[0].clientX; e.preventDefault(); }
function handleTouchMove(e) { e.preventDefault(); }
function handleTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 30) {
    if (dx > 0 && gameState.player.targetLane < 2) gameState.player.targetLane++;
    else if (dx < 0 && gameState.player.targetLane > 0) gameState.player.targetLane--;
  }
}
function handleKeyDown(e) {
  if (e.key === "ArrowLeft" && gameState.player.targetLane > 0) gameState.player.targetLane--;
  if (e.key === "ArrowRight" && gameState.player.targetLane < 2) gameState.player.targetLane++;
}

function runnerLoop(time) {
  if (!gameState.active) return;
  const dt = (time - gameState.lastTime) / 1000;
  gameState.lastTime = time;
  
  gameState.time -= dt;
  if (gameState.time <= 0) return gameOver("Hết giờ");
  
  // Update Player
  gameState.player.lane += (gameState.player.targetLane - gameState.player.lane) * 10 * dt;
  
  // Spawn entities
  gameState.nextSpawn -= dt;
  if (gameState.nextSpawn <= 0) {
    const lane = Math.floor(Math.random() * 3);
    const r = Math.random();
    let type, icon;
    if (r < 0.4) { type = "need"; icon = ["📖","🖊️","💊","🥦"][Math.floor(Math.random()*4)]; }
    else if (r < 0.7) { type = "want"; icon = ["🧋","🎮","👕"][Math.floor(Math.random()*3)]; }
    else { type = "trap"; icon = ["💸","💣","📉"][Math.floor(Math.random()*3)]; }
    
    gameState.entities.push({ lane, y: -50, type, icon });
    gameState.nextSpawn = 0.8 + Math.random() * 0.5;
  }
  
  // Decision Gate every 15s
  if (Math.floor(gameState.time) % 15 === 0 && Math.floor(gameState.time) < 60 && gameState.gates < (4 - Math.floor(gameState.time)/15)) {
    gameState.gates++;
    showOverlay("Cổng Quyết Định", "Em có 100.000đ. Vở chưa mua, nhưng áo đang giảm giá 50%.\nEm chọn làn nào?", "Tiếp tục", () => {
      // In a real game, they'd have to physically choose the lane. Here we just give a small hint.
      alert("Đã tiếp tục! Chú ý ưu tiên Nhu cầu nhé.");
    });
  }
  
  // Update Entities & Collision
  const laneWidth = gameCanvas.width / 3;
  for (let i = gameState.entities.length - 1; i >= 0; i--) {
    let e = gameState.entities[i];
    e.y += gameState.speed * dt;
    
    if (e.y > gameCanvas.height) {
      gameState.entities.splice(i, 1);
      continue;
    }
    
    // Collision
    if (e.y > gameState.player.y - 30 && e.y < gameState.player.y + 30) {
      if (Math.abs(e.lane - gameState.player.lane) < 0.5) {
        if (e.type === "need") {
          gameState.score += 10;
        } else if (e.type === "trap") {
          gameState.hearts--;
          if (gameState.hearts <= 0) return gameOver("Hết tim");
        } else if (e.type === "want") {
          // No points, brief message
          ctx.fillStyle = "black";
          ctx.fillText("Mong muốn", e.lane * laneWidth + laneWidth/2, e.y - 20);
        }
        gameState.entities.splice(i, 1);
        updateGameHeader();
      }
    }
  }
  
  // Draw
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  
  // Lanes
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(laneWidth, 0); ctx.lineTo(laneWidth, gameCanvas.height);
  ctx.moveTo(laneWidth*2, 0); ctx.lineTo(laneWidth*2, gameCanvas.height);
  ctx.stroke();
  
  // Draw Entities
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let e of gameState.entities) {
    ctx.fillText(e.icon, e.lane * laneWidth + laneWidth/2, e.y);
  }
  
  // Draw Player
  ctx.font = "40px Arial";
  ctx.fillText("🏃", gameState.player.lane * laneWidth + laneWidth/2, gameState.player.y);
  
  gameLoopId = requestAnimationFrame(runnerLoop);
}

// ----------------------------------------------------
// GAME 2: SLICER (Mắt thần mua sắm)
// ----------------------------------------------------
function startSlicerGame() {
  gameCanvas.hidden = false;
  gameState.nextSpawn = 1;
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
  gameState.nextSpawn = 1;
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

// ----------------------------------------------------
// GAME 4: MATCH-3 (Xóa bẫy tiêu dùng)
// ----------------------------------------------------
function startMatch3Game() {
  domGame.hidden = false;
  gameState.board = [];
  gameState.selected = null;
  gameState.temptation = 0;
  
  const icons = ["🔥", "📢", "👥", "🏷️", "❓"];
  const toolIcons = ["🔍", "👛", "📝", "🛡️"];
  
  domGame.innerHTML = `
    <div class="matchTopBar">
      <div class="matchEventCard" id="matchEventCard">Ghép 3 biểu tượng rủi ro để xóa chúng. Ghép 4 để tạo công cụ!</div>
      <div class="matchTemptation">
        <div class="matchTemptationFill" id="matchTemptationFill" style="width: 0%"></div>
      </div>
    </div>
    <div class="matchBoard" id="matchBoard"></div>
  `;
  
  const boardEl = document.getElementById("matchBoard");
  
  // Init board
  for (let r=0; r<6; r++) {
    gameState.board[r] = [];
    for (let c=0; c<6; c++) {
      let type = Math.floor(Math.random() * 5);
      // Prevent initial match
      while ((c>=2 && gameState.board[r][c-1].type===type && gameState.board[r][c-2].type===type) ||
             (r>=2 && gameState.board[r-1][c].type===type && gameState.board[r-2][c].type===type)) {
        type = Math.floor(Math.random() * 5);
      }
      gameState.board[r][c] = { type, r, c };
      
      const cell = document.createElement("div");
      cell.className = "matchCell";
      cell.dataset.r = r; cell.dataset.c = c;
      boardEl.appendChild(cell);
    }
  }
  
  renderMatchBoard();
  
  // Simple event loop instead of requestAnimationFrame
  gameState.matchInterval = setInterval(() => {
    if (!gameState.active) return;
    gameState.temptation += 2; // Increase temptation over time
    if (gameState.temptation >= 100) {
      gameState.temptation = 0;
      gameState.hearts--;
      updateGameHeader();
      document.getElementById("matchEventCard").textContent = "Em đã bị cám dỗ! Mất 1 tim.";
      if (gameState.hearts <= 0) gameOver("Hết tim");
    }
    document.getElementById("matchTemptationFill").style.width = `${gameState.temptation}%`;
  }, 1000);
}

function renderMatchBoard() {
  const boardEl = document.getElementById("matchBoard");
  boardEl.innerHTML = ""; // lazy re-render
  
  const icons = ["🔥", "📢", "👥", "🏷️", "❓", "🔍", "👛", "📝", "🛡️"];
  
  for (let r=0; r<6; r++) {
    for (let c=0; c<6; c++) {
      const cell = document.createElement("div");
      cell.className = "matchCell";
      
      if (gameState.board[r][c]) {
        const item = document.createElement("div");
        item.className = `matchItem type-${gameState.board[r][c].type}`;
        if (gameState.selected && gameState.selected.r === r && gameState.selected.c === c) {
          item.style.transform = "scale(1.1)";
          item.style.zIndex = "10";
          item.style.boxShadow = "0 0 10px #fff";
        }
        item.textContent = icons[gameState.board[r][c].type];
        
        item.onmousedown = () => handleMatchClick(r, c);
        item.ontouchstart = (e) => { e.preventDefault(); handleMatchClick(r, c); };
        
        cell.appendChild(item);
      }
      boardEl.appendChild(cell);
    }
  }
}

function handleMatchClick(r, c) {
  if (gameState.board[r][c].type >= 5) {
    // Used a tool!
    gameState.score += 15;
    gameState.temptation = Math.max(0, gameState.temptation - 30);
    const tools = ["Kính lúp", "Ví tiền", "Danh sách", "Khiên"];
    document.getElementById("matchEventCard").textContent = `Em đã dùng ${tools[gameState.board[r][c].type - 5]} để vượt qua cám dỗ!`;
    gameState.board[r][c] = { type: Math.floor(Math.random() * 5), r, c }; // reset to random
    updateGameHeader();
    renderMatchBoard();
    if (gameState.score >= 100) setTimeout(() => gameOver("Tuyệt vời"), 1000);
    return;
  }
  
  if (!gameState.selected) {
    gameState.selected = {r, c};
    renderMatchBoard();
  } else {
    // Swap
    const sr = gameState.selected.r, sc = gameState.selected.c;
    if ((Math.abs(sr - r) === 1 && sc === c) || (Math.abs(sc - c) === 1 && sr === r)) {
      // Swap data
      let temp = gameState.board[sr][sc].type;
      gameState.board[sr][sc].type = gameState.board[r][c].type;
      gameState.board[r][c].type = temp;
      
      gameState.selected = null;
      renderMatchBoard();
      
      setTimeout(checkMatches, 300);
    } else {
      gameState.selected = {r, c};
      renderMatchBoard();
    }
  }
}

function checkMatches() {
  let matched = [];
  
  // Horizontal
  for (let r=0; r<6; r++) {
    for (let c=0; c<4; c++) {
      let type = gameState.board[r][c].type;
      if (type >= 5) continue; // tools don't match
      if (gameState.board[r][c+1].type === type && gameState.board[r][c+2].type === type) {
        matched.push({r, c}, {r, c: c+1}, {r, c: c+2});
      }
    }
  }
  // Vertical
  for (let c=0; c<6; c++) {
    for (let r=0; r<4; r++) {
      let type = gameState.board[r][c].type;
      if (type >= 5) continue;
      if (gameState.board[r+1][c].type === type && gameState.board[r+2][c].type === type) {
        matched.push({r, c}, {r: r+1, c}, {r: r+2, c});
      }
    }
  }
  
  if (matched.length > 0) {
    gameState.score += matched.length * 2;
    updateGameHeader();
    
    // Clear and drop (simplified for prototype)
    matched.forEach(m => {
      gameState.board[m.r][m.c] = null;
    });
    
    // Create tool if match >= 4 (simplified logic, just random chance if matched > 3)
    if (matched.length >= 4) {
      let m = matched[0];
      gameState.board[m.r][m.c] = { type: 5 + Math.floor(Math.random() * 4), r: m.r, c: m.c };
    }
    
    // Fill empty
    for (let c=0; c<6; c++) {
      for (let r=5; r>=0; r--) {
        if (!gameState.board[r][c]) {
          gameState.board[r][c] = { type: Math.floor(Math.random() * 5), r, c };
        }
      }
    }
    
    renderMatchBoard();
    setTimeout(checkMatches, 400); // cascade
  }
}

// ----------------------------------------------------
// Init hook
// ----------------------------------------------------
setTimeout(initArcade, 100);
