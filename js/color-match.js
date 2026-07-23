/* ============================================
   Color Match Game
   - 30초 동안 목표 색상과 같은 버튼 찾기
   - 점수 / 콤보 / 난이도 상승 / 최고 점수(localStorage)
   ============================================ */

document.addEventListener("DOMContentLoaded", function () {

  var COLORS = [
    { name: "보라", hex: "#7C5FD6" },
    { name: "빨강", hex: "#E4574C" },
    { name: "파랑", hex: "#3B82F6" },
    { name: "초록", hex: "#22A06B" },
    { name: "노랑", hex: "#F5B942" },
    { name: "주황", hex: "#F2784B" },
    { name: "분홍", hex: "#EC4899" },
    { name: "청록", hex: "#14B8A6" },
    { name: "남색", hex: "#3730A3" },
    { name: "라임", hex: "#84CC16" },
    { name: "고동", hex: "#7C4A32" },
    { name: "회색", hex: "#6B7280" }
  ];

  var STORAGE_KEY = "ej-color-match-best";
  var GAME_TIME = 30;
  var MAX_OPTIONS = 9;
  var MIN_OPTIONS = 4;

  var scoreEl = document.getElementById("score");
  var timeEl = document.getElementById("timeLeft");
  var comboEl = document.getElementById("combo");
  var bestEl = document.getElementById("best");
  var targetBox = document.getElementById("targetBox");
  var targetName = document.getElementById("targetName");
  var optionsWrap = document.getElementById("colorOptions");
  var startBtn = document.getElementById("startBtn");
  var restartBtn = document.getElementById("restartBtn");
  var resultBox = document.getElementById("gameResult");
  var resultText = document.getElementById("resultText");

  var score = 0;
  var combo = 0;
  var timeLeft = GAME_TIME;
  var timerId = null;
  var optionCount = MIN_OPTIONS;
  var isRunning = false;
  var currentTarget = null;
  var roundLockTimeoutId = null;

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function loadBest() {
    var best = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    bestEl.textContent = String(best);
    return best;
  }

  function saveBestIfNeeded() {
    var best = loadBest();
    if (score > best) {
      localStorage.setItem(STORAGE_KEY, String(score));
      return true;
    }
    return false;
  }

  function nextRound() {
    optionsWrap.innerHTML = "";

    var pool = shuffle(COLORS).slice(0, optionCount);
    currentTarget = pool[Math.floor(Math.random() * pool.length)];

    targetBox.style.background = currentTarget.hex;
    targetName.textContent = currentTarget.name;

    shuffle(pool).forEach(function (color) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "color-option";
      btn.style.background = color.hex;
      btn.textContent = color.name;
      btn.setAttribute("aria-label", color.name + " 선택");
      btn.addEventListener("click", function () {
        handlePick(color, btn);
      });
      optionsWrap.appendChild(btn);
    });
  }

  function handlePick(color, btn) {
    if (!isRunning || roundLockTimeoutId) return;

    if (color.hex === currentTarget.hex) {
      score += 10;
      combo++;
      btn.classList.add("correct-flash");
      if (combo > 0 && combo % 5 === 0 && optionCount < MAX_OPTIONS) {
        optionCount++;
      }
    } else {
      score = Math.max(0, score - 5);
      combo = 0;
      btn.classList.add("wrong-flash");
    }

    scoreEl.textContent = String(score);
    comboEl.textContent = String(combo);

    roundLockTimeoutId = setTimeout(function () {
      roundLockTimeoutId = null;
      if (isRunning) nextRound();
    }, 150);
  }

  function tick() {
    timeLeft--;
    timeEl.textContent = String(timeLeft);
    if (timeLeft <= 0) {
      endGame();
    }
  }

  function startGame() {
    score = 0;
    combo = 0;
    timeLeft = GAME_TIME;
    optionCount = MIN_OPTIONS;
    isRunning = true;

    scoreEl.textContent = "0";
    comboEl.textContent = "0";
    timeEl.textContent = String(GAME_TIME);
    resultBox.hidden = true;
    startBtn.hidden = true;
    restartBtn.hidden = false;

    if (timerId) clearInterval(timerId);
    timerId = setInterval(tick, 1000);

    if (roundLockTimeoutId) {
      clearTimeout(roundLockTimeoutId);
      roundLockTimeoutId = null;
    }

    nextRound();
  }

  function endGame() {
    isRunning = false;

    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    if (roundLockTimeoutId) {
      clearTimeout(roundLockTimeoutId);
      roundLockTimeoutId = null;
    }

    optionsWrap.innerHTML = "";
    targetName.textContent = "게임 종료";

    var isBest = saveBestIfNeeded();
    loadBest();

    resultText.textContent =
      "종료! 최종 점수 " + score + "점" + (isBest ? " · 최고 기록 갱신!" : "");
    resultBox.hidden = false;
    restartBtn.hidden = false;
  }

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", startGame);

  loadBest();
});
