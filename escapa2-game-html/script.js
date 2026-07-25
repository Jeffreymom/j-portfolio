const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const timeText = document.getElementById("timeText");
const bestText = document.getElementById("bestText");
const startOverlay = document.getElementById("startOverlay");
const resultOverlay = document.getElementById("resultOverlay");
const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const showResultBtn = document.getElementById("showResultBtn");
const resultTitle = document.getElementById("resultTitle");
const recordMessage = document.getElementById("recordMessage");
const soundBtn = document.getElementById("soundBtn");

const STORAGE_KEY = "escapa_best_score";
let bestScore = Number(localStorage.getItem(STORAGE_KEY) || 0);
let soundOn = true;

let gameState = "idle";
let startTime = 0;
let elapsed = 0;
let animationId = null;
let dragging = false;
let pointerOffset = { x: 0, y: 0 };
let scaleX = 1;
let scaleY = 1;

const player = {
  x: 0,
  y: 0,
  w: 58,
  h: 58,
  color: "#b70f14"
};

let obstacles = [];

function updateBestText() {
  bestText.textContent = `${bestScore.toFixed(1)}초`;
}
updateBestText();

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);

  scaleX = canvas.width / rect.width;
  scaleY = canvas.height / rect.height;

  ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

  if (gameState === "idle") {
    resetEntities();
    draw();
  }
}

function resetEntities() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  player.w = Math.max(42, Math.min(62, w * 0.075));
  player.h = player.w;
  player.x = w / 2 - player.w / 2;
  player.y = h / 2 - player.h / 2;

  const speedFactor = Math.max(0.75, Math.min(1.2, w / 760));

  obstacles = [
    { x: w * 0.06, y: h * 0.08, w: w * 0.16, h: h * 0.16, vx: 150 * speedFactor, vy: 110 * speedFactor },
    { x: w * 0.69, y: h * 0.05, w: w * 0.16, h: h * 0.14, vx: -125 * speedFactor, vy: 150 * speedFactor },
    { x: w * 0.06, y: h * 0.76, w: w * 0.08, h: h * 0.17, vx: 185 * speedFactor, vy: -120 * speedFactor },
    { x: w * 0.76, y: h * 0.79, w: w * 0.28, h: h * 0.07, vx: -165 * speedFactor, vy: -145 * speedFactor }
  ];
}

function drawRoundedRect(x, y, w, h, radius, color) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = color;
  ctx.fill();
}

function draw() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#050506";
  ctx.fillRect(0, 0, w, h);

  const boardMargin = Math.max(26, w * 0.06);
  const boardTop = Math.max(30, h * 0.07);

  ctx.fillStyle = "#f7f7f8";
  ctx.fillRect(boardMargin, boardTop, w - boardMargin * 2, h - boardTop * 2);

  obstacles.forEach((o) => {
    drawRoundedRect(o.x, o.y, o.w, o.h, 2, "#2813b7");
  });

  drawRoundedRect(player.x, player.y, player.w, player.h, 3, player.color);
}

function getBoardBounds() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const margin = Math.max(26, w * 0.06);
  const top = Math.max(30, h * 0.07);

  return {
    left: margin,
    top,
    right: w - margin,
    bottom: h - top
  };
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function playerHitsWall() {
  const b = getBoardBounds();
  return (
    player.x < b.left ||
    player.y < b.top ||
    player.x + player.w > b.right ||
    player.y + player.h > b.bottom
  );
}

function obstacleHitsPlayer() {
  return obstacles.some((o) => rectsOverlap(player, o));
}

function updateObstacles(dt) {
  const b = getBoardBounds();

  // 시간이 지날수록 아주 조금씩 빨라짐
  // 10초마다 약 8% 정도 증가
  //  const speedMultiplier = 1 + elapsed * 0.008;
  // 10초마다 약 20%% 증가
  const speedMultiplier = 1 + elapsed * 0.020;

  obstacles.forEach((o) => {
    o.x += o.vx * speedMultiplier * dt;
    o.y += o.vy * speedMultiplier * dt;

    if (o.x <= b.left) {
      o.x = b.left;
      o.vx *= -1;
    } else if (o.x + o.w >= b.right) {
      o.x = b.right - o.w;
      o.vx *= -1;
    }

    if (o.y <= b.top) {
      o.y = b.top;
      o.vy *= -1;
    } else if (o.y + o.h >= b.bottom) {
      o.y = b.bottom - o.h;
      o.vy *= -1;
    }
  });
}

const speedMultiplier = Math.min(
  1 + elapsed * 0.020,
  2.2
);

function beep(freq = 520, duration = 0.08) {
  if (!soundOn) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const audio = new AudioCtx();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.frequency.value = freq;
  oscillator.type = "sine";
  gain.gain.setValueAtTime(0.05, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
}

function startGame() {
  cancelAnimationFrame(animationId);
  resetEntities();
  elapsed = 0;
  timeText.textContent = "0.0";
  startTime = performance.now();
  gameState = "playing";
  dragging = false;
  startOverlay.hidden = true;
  resultOverlay.hidden = true;
  beep(660, 0.07);
  animationId = requestAnimationFrame(loop);
}

let previousTime = 0;
function loop(now) {
  if (gameState !== "playing") return;

  if (!previousTime) previousTime = now;
  const dt = Math.min((now - previousTime) / 1000, 0.03);
  previousTime = now;

  elapsed = (now - startTime) / 1000;
  timeText.textContent = elapsed.toFixed(1);

  updateObstacles(dt);

  if (obstacleHitsPlayer()) {
    endGame();
    return;
  }

  draw();
  animationId = requestAnimationFrame(loop);
}

function endGame() {
  gameState = "ended";
  dragging = false;
  previousTime = 0;
  cancelAnimationFrame(animationId);

  const score = Number(elapsed.toFixed(1));
  const isNewRecord = score > bestScore;

  if (isNewRecord) {
    bestScore = score;
    localStorage.setItem(STORAGE_KEY, String(bestScore));
    recordMessage.textContent = "★ 최고 기록 갱신!";
    recordMessage.style.color = "#ffd96b";
  } else {
    recordMessage.textContent = `★ 최고: ${bestScore.toFixed(1)}초`;
    recordMessage.style.color = "#c5c8d8";
  }

  updateBestText();
  resultTitle.textContent = `${score.toFixed(1)}초 동안 생존했습니다!`;
  resultOverlay.hidden = false;
  beep(210, 0.16);
  draw();
}

function getPointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const p = event.touches ? event.touches[0] : event;
  return {
    x: p.clientX - rect.left,
    y: p.clientY - rect.top
  };
}

function pointerDown(event) {
  if (gameState !== "playing") return;

  const pos = getPointerPosition(event);
  if (
    pos.x >= player.x &&
    pos.x <= player.x + player.w &&
    pos.y >= player.y &&
    pos.y <= player.y + player.h
  ) {
    dragging = true;
    pointerOffset.x = pos.x - player.x;
    pointerOffset.y = pos.y - player.y;
    canvas.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }
}

function pointerMove(event) {
  if (!dragging || gameState !== "playing") return;

  const pos = getPointerPosition(event);
  const b = getBoardBounds();

  // 빨간 네모가 흰색 경기장 밖으로 나가지 못하게 제한
  player.x = Math.max(
    b.left,
    Math.min(pos.x - pointerOffset.x, b.right - player.w)
  );

  player.y = Math.max(
    b.top,
    Math.min(pos.y - pointerOffset.y, b.bottom - player.h)
  );

  // 파란 장애물에 닿을 때만 게임 종료
  if (obstacleHitsPlayer()) {
    endGame();
  } else {
    draw();
  }

  event.preventDefault();
}

function pointerUp(event) {
  dragging = false;
  canvas.releasePointerCapture?.(event.pointerId);
}

startBtn.addEventListener("click", startGame);
retryBtn.addEventListener("click", startGame);

showResultBtn.addEventListener("click", () => {
  resultOverlay.hidden = true;
  gameState = "idle";
});

soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? "🔊" : "🔇";
});

canvas.addEventListener("pointerdown", pointerDown);
canvas.addEventListener("pointermove", pointerMove);
canvas.addEventListener("pointerup", pointerUp);
canvas.addEventListener("pointercancel", pointerUp);

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", () => setTimeout(resizeCanvas, 200));

resizeCanvas();
