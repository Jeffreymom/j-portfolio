/* ============================================
   Reaction Speed Test
   - 5회 반응속도 측정, 평균/최고 기록
   - 클릭, 터치, 스페이스바 입력 지원
   ============================================ */

document.addEventListener("DOMContentLoaded", function () {

  var STORAGE_KEY = "ej-reaction-best";
  var TOTAL_ROUNDS = 5;
  var MIN_WAIT = 1500;
  var MAX_WAIT = 5000;

  var area = document.getElementById("reactionArea");
  var msg = document.getElementById("reactionMsg");
  var roundNumEl = document.getElementById("roundNum");
  var bestEl = document.getElementById("best");
  var historyEl = document.getElementById("reactionHistory");
  var startBtn = document.getElementById("startBtn");
  var restartBtn = document.getElementById("restartBtn");
  var resultBox = document.getElementById("gameResult");
  var resultText = document.getElementById("resultText");

  var phase = "idle"; // idle | waiting | ready | toosoon
  var waitTimeoutId = null;
  var nextRoundTimeoutId = null;
  var startTime = 0;
  var results = [];
  var round = 0;

  function rate(ms) {
    if (ms <= 180) return "Excellent";
    if (ms <= 250) return "Great";
    if (ms <= 350) return "Good";
    return "Keep Practicing";
  }

  function loadBest() {
    var best = localStorage.getItem(STORAGE_KEY);
    bestEl.textContent = best ? best + "ms" : "--";
    return best ? parseInt(best, 10) : null;
  }

  function saveBestIfNeeded(bestOfRun) {
    var best = loadBest();
    if (best === null || bestOfRun < best) {
      localStorage.setItem(STORAGE_KEY, String(bestOfRun));
      return true;
    }
    return false;
  }

  function setState(state, text) {
    area.className = "reaction-area state-" + state;
    msg.textContent = text;
  }

  function clearTimers() {
    if (waitTimeoutId) {
      clearTimeout(waitTimeoutId);
      waitTimeoutId = null;
    }
    if (nextRoundTimeoutId) {
      clearTimeout(nextRoundTimeoutId);
      nextRoundTimeoutId = null;
    }
  }

  function armRound() {
    phase = "waiting";
    setState("wait", "Wait...");
    var delay = MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT);
    waitTimeoutId = setTimeout(function () {
      waitTimeoutId = null;
      phase = "ready";
      startTime = performance.now();
      setState("ready", "CLICK!");
    }, delay);
  }

  function handleAction() {
    if (phase === "waiting") {
      clearTimers();
      phase = "toosoon";
      setState("toosoon", "Too Soon!");
      nextRoundTimeoutId = setTimeout(function () {
        nextRoundTimeoutId = null;
        armRound();
      }, 1000);
      return;
    }

    if (phase === "ready") {
      clearTimers();
      var reactionTime = Math.round(performance.now() - startTime);
      results.push(reactionTime);
      round++;
      roundNumEl.textContent = String(round);

      var li = document.createElement("li");
      li.textContent = round + "회: " + reactionTime + "ms";
      historyEl.appendChild(li);

      if (round >= TOTAL_ROUNDS) {
        finishGame();
      } else {
        setState("clicked", reactionTime + "ms · " + rate(reactionTime));
        nextRoundTimeoutId = setTimeout(function () {
          nextRoundTimeoutId = null;
          armRound();
        }, 900);
      }
      return;
    }
    /* idle 또는 toosoon 대기 중에는 입력을 무시 */
  }

  function finishGame() {
    phase = "idle";
    var sum = results.reduce(function (a, b) { return a + b; }, 0);
    var avg = Math.round(sum / results.length);
    var best = Math.min.apply(null, results);
    var isBest = saveBestIfNeeded(best);
    loadBest();

    setState("idle", "측정 완료!");
    resultText.textContent =
      "평균 " + avg + "ms (" + rate(avg) + ") · 최고 " + best + "ms" +
      (isBest ? " · 개인 최고 기록 갱신!" : "");
    resultBox.hidden = false;
    startBtn.hidden = true;
    restartBtn.hidden = false;
  }

  function startGame() {
    clearTimers();
    phase = "idle";
    results = [];
    round = 0;
    roundNumEl.textContent = "0";
    historyEl.innerHTML = "";
    resultBox.hidden = true;
    startBtn.hidden = true;
    restartBtn.hidden = false;
    armRound();
  }

  area.addEventListener("click", handleAction);

  /* 스페이스바 입력: area에 포커스가 없어도 동작하도록 document 레벨에서만 처리 */
  document.addEventListener("keydown", function (e) {
    if (e.code !== "Space" && e.key !== " ") return;
    if (phase !== "waiting" && phase !== "ready") return;
    e.preventDefault();
    handleAction();
  });

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", startGame);

  loadBest();
});
