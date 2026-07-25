const grid = document.getElementById("grid");
const introOverlay = document.getElementById("introOverlay");
const levelOverlay = document.getElementById("levelOverlay");
const finalOverlay = document.getElementById("finalOverlay");

const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const retryBtn = document.getElementById("retryBtn");
const resetBestBtn = document.getElementById("resetBestBtn");
const soundBtn = document.getElementById("soundBtn");

const levelText = document.getElementById("levelText");
const totalLevelText = document.getElementById("totalLevelText");
const timeText = document.getElementById("timeText");
const mistakeText = document.getElementById("mistakeText");
const levelScore = document.getElementById("levelScore");
const levelMessage = document.getElementById("levelMessage");

const finalTime = document.getElementById("finalTime");
const gradeText = document.getElementById("gradeText");
const finalMessage = document.getElementById("finalMessage");
const summaryTime = document.getElementById("summaryTime");
const summaryMistakes = document.getElementById("summaryMistakes");
const summaryAccuracy = document.getElementById("summaryAccuracy");
const summaryBest = document.getElementById("summaryBest");

const TOTAL_LEVELS = 30;
const STORAGE_KEY = "odd_one_out_best_time";
totalLevelText.textContent = TOTAL_LEVELS;

let level = 1;
let mistakes = 0;
let totalClicks = 0;
let levelStart = 0;
let gameStart = 0;
let timerId = null;
let running = false;
let soundOn = true;
let currentAnswer = 0;
let focusedIndex = 0;
let levelTimes = [];

const families = [
  ["A","A","À"], ["M","M","N"], ["U","U","V"], ["S","S","5"],
  ["O","O","0"], ["C","C","G"], ["B","B","8"], ["P","P","R"],
  ["3","3","8"], ["6","6","9"], ["2","2","Z"], ["1","1","I"],
  ["😀","😀","😊"], ["😂","😂","🤣"], ["🍎","🍎","🍏"], ["🍌","🍌","🍋"],
  ["🐱","🐱","🐯"], ["🐶","🐶","🐺"], ["★","★","☆"], ["●","●","◉"],
  ["▲","▲","△"], ["◆","◆","◇"], ["■","■","□"], ["✦","✦","✧"],
  ["☀","☀","☼"], ["♠","♠","♣"], ["♥","♥","♦"], ["↗","↗","↖"],
  ["⌁","⌁","≈"], ["가","가","카"], ["ㅅ","ㅅ","ㅈ"], ["大","大","犬"]
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gridSpecForLevel(lv) {
  if (lv <= 4) return { cols: 4, rows: 3 };
  if (lv <= 8) return { cols: 6, rows: 5 };
  if (lv <= 12) return { cols: 7, rows: 5 };
  if (lv <= 16) return { cols: 8, rows: 6 };
  if (lv <= 20) return { cols: 9, rows: 7 };
  if (lv <= 24) return { cols: 10, rows: 8 };
  if (lv <= 27) return { cols: 11, rows: 9 };
  return { cols: 12, rows: 10 };
}

function getLevelFamily(lv) {
  const index = (lv * 7 + Math.floor(lv / 3)) % families.length;
  return families[index];
}

function getFontSize(cols) {
  if (cols <= 4) return "clamp(2.2rem,8vw,4.5rem)";
  if (cols <= 6) return "clamp(1.45rem,5vw,3rem)";
  if (cols <= 8) return "clamp(1.15rem,3.8vw,2.2rem)";
  if (cols <= 10) return "clamp(.95rem,3vw,1.8rem)";
  return "clamp(.78rem,2.5vw,1.45rem)";
}

function renderLevel() {
  const spec = gridSpecForLevel(level);
  const family = getLevelFamily(level);
  const normal = family[0];
  const odd = family[2];
  const count = spec.cols * spec.rows;

  currentAnswer = randomInt(0, count - 1);
  focusedIndex = 0;

  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `repeat(${spec.cols}, minmax(0, 1fr))`;
  grid.style.gridTemplateRows = `repeat(${spec.rows}, minmax(0, 1fr))`;

  const maxGridWidth = Math.min(760, window.innerWidth - 40);
  const estimatedHeight = Math.min(520, window.innerHeight - 280);
  const cellByWidth = maxGridWidth / spec.cols;
  const cellByHeight = estimatedHeight / spec.rows;
  const cell = Math.max(25, Math.min(cellByWidth, cellByHeight));
  grid.style.width = `${Math.min(maxGridWidth, cell * spec.cols)}px`;

  for (let i = 0; i < count; i++) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "symbol";
    button.dataset.index = i;
    button.textContent = i === currentAnswer ? odd : normal;
    button.style.fontSize = getFontSize(spec.cols);
    button.setAttribute("aria-label", `항목 ${i + 1}`);
    button.addEventListener("click", () => selectItem(i, button));
    grid.appendChild(button);
  }

  levelText.textContent = level;
  requestAnimationFrame(() => grid.children[0]?.focus({ preventScroll: true }));
}

function startLevel() {
  running = true;
  levelOverlay.hidden = true;
  finalOverlay.hidden = true;
  levelStart = performance.now();
  renderLevel();
  updateTimer();
}

function updateTimer() {
  cancelAnimationFrame(timerId);
  const tick = () => {
    if (!running) return;
    const seconds = (performance.now() - levelStart) / 1000;
    timeText.textContent = `${seconds.toFixed(3)}s`;
    timerId = requestAnimationFrame(tick);
  };
  timerId = requestAnimationFrame(tick);
}

function selectItem(index, button) {
  if (!running) return;
  totalClicks++;

  if (index === currentAnswer) {
    running = false;
    cancelAnimationFrame(timerId);

    const elapsed = (performance.now() - levelStart) / 1000;
    levelTimes.push(elapsed);
    button.classList.add("correct");
    beep(880, .08);

    setTimeout(() => {
      if (level >= TOTAL_LEVELS) {
        showFinalResult();
      } else {
        levelScore.textContent = `${elapsed.toFixed(3)}s`;
        levelMessage.textContent = messageForTime(elapsed);
        levelOverlay.hidden = false;
        nextBtn.textContent = "다음 레벨";
      }
    }, 220);
  } else {
    mistakes++;
    mistakeText.textContent = mistakes;
    button.classList.remove("wrong");
    void button.offsetWidth;
    button.classList.add("wrong");
    beep(220, .08);
  }
}

function messageForTime(seconds) {
  if (seconds < .8) return "번개처럼 빨랐어요!";
  if (seconds < 1.5) return "매우 빠르고 정확해요.";
  if (seconds < 3) return "좋은 집중력이에요!";
  if (seconds < 6) return "정확하게 찾았어요.";
  return "다음에는 더 빠르게 찾아보세요.";
}

function showFinalResult() {
  const total = (performance.now() - gameStart) / 1000;
  const accuracy = totalClicks ? ((TOTAL_LEVELS / totalClicks) * 100) : 100;
  const oldBest = Number(localStorage.getItem(STORAGE_KEY) || 0);
  const isNewBest = !oldBest || total < oldBest;

  if (isNewBest) {
    localStorage.setItem(STORAGE_KEY, String(total));
  }

  const best = Number(localStorage.getItem(STORAGE_KEY) || total);
  const adjusted = total + mistakes * 1.2;

  finalTime.textContent = `${total.toFixed(3)}s`;
  summaryTime.textContent = `${total.toFixed(1)}초`;
  summaryMistakes.textContent = `${mistakes}회`;
  summaryAccuracy.textContent = `${accuracy.toFixed(1)}%`;
  summaryBest.textContent = `${best.toFixed(1)}초`;

  if (adjusted < 35) {
    gradeText.textContent = "프로 관측자";
    finalMessage.textContent = "미세한 차이를 매우 빠르게 구별했어요.";
  } else if (adjusted < 55) {
    gradeText.textContent = "매의 눈";
    finalMessage.textContent = "속도와 정확도가 모두 뛰어난 편이에요.";
  } else if (adjusted < 85) {
    gradeText.textContent = "집중력 우수";
    finalMessage.textContent = "안정적인 관찰력으로 끝까지 잘 찾아냈어요.";
  } else if (adjusted < 130) {
    gradeText.textContent = "초보 관측자";
    finalMessage.textContent = "조금 더 연습하면 훨씬 빨라질 수 있어요.";
  } else {
    gradeText.textContent = "천천히 보는 탐색가";
    finalMessage.textContent = "속도보다 정확성을 먼저 익혀보세요.";
  }

  if (isNewBest) {
    finalMessage.textContent += " 최고 기록도 갱신했어요!";
  }

  finalOverlay.hidden = false;
  beep(1040, .14);
}

function startGame() {
  level = 1;
  mistakes = 0;
  totalClicks = 0;
  levelTimes = [];
  mistakeText.textContent = "0";
  timeText.textContent = "0.000s";
  introOverlay.hidden = true;
  finalOverlay.hidden = true;
  gameStart = performance.now();
  startLevel();
}

function beep(freq = 500, duration = .06) {
  if (!soundOn) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const audio = new AudioCtx();
  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(.045, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);

  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}

startBtn.addEventListener("click", startGame);
retryBtn.addEventListener("click", startGame);

nextBtn.addEventListener("click", () => {
  level++;
  startLevel();
});

resetBestBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  summaryBest.textContent = "-";
  finalMessage.textContent = "저장된 최고 기록을 초기화했어요.";
});

soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? "🔊" : "🔇";
});

document.addEventListener("keydown", (event) => {
  if (!running || !grid.children.length) return;

  const spec = gridSpecForLevel(level);
  const count = grid.children.length;

  if (event.key === "ArrowRight") focusedIndex = Math.min(count - 1, focusedIndex + 1);
  else if (event.key === "ArrowLeft") focusedIndex = Math.max(0, focusedIndex - 1);
  else if (event.key === "ArrowDown") focusedIndex = Math.min(count - 1, focusedIndex + spec.cols);
  else if (event.key === "ArrowUp") focusedIndex = Math.max(0, focusedIndex - spec.cols);
  else if (event.key === "Enter" || event.key === " ") {
    grid.children[focusedIndex]?.click();
    event.preventDefault();
    return;
  } else return;

  grid.children[focusedIndex]?.focus({ preventScroll: true });
  event.preventDefault();
});

window.addEventListener("resize", () => {
  if (running) renderLevel();
});
