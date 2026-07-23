/* ============================================
   Memory Card Game
   - 4x4(8쌍) 카드 뒤집기 게임
   - 이동 횟수 / 진행 시간 / 최고 기록(localStorage)
   ============================================ */

document.addEventListener("DOMContentLoaded", function () {

  var SYMBOLS = ["🍀", "🌸", "🍉", "🎈", "🎧", "🚀", "🌙", "⭐"];
  var STORAGE_KEY = "ej-memory-best-time";

  var grid = document.getElementById("memoryGrid");
  var movesEl = document.getElementById("moves");
  var timerEl = document.getElementById("timer");
  var bestEl = document.getElementById("best");
  var restartBtn = document.getElementById("restartBtn");
  var resultBox = document.getElementById("gameResult");
  var resultText = document.getElementById("resultText");

  var cards = [];
  var flipped = [];
  var matchedCount = 0;
  var moves = 0;
  var isChecking = false;
  var started = false;
  var timerId = null;
  var seconds = 0;
  var flipBackTimeoutId = null;

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

  function formatTime(total) {
    var m = Math.floor(total / 60);
    var s = total % 60;
    return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
  }

  function loadBest() {
    var best = localStorage.getItem(STORAGE_KEY);
    bestEl.textContent = best ? formatTime(parseInt(best, 10)) : "--:--";
  }

  function saveBestIfNeeded() {
    var best = localStorage.getItem(STORAGE_KEY);
    if (best === null || seconds < parseInt(best, 10)) {
      localStorage.setItem(STORAGE_KEY, String(seconds));
      return true;
    }
    return false;
  }

  function startTimer() {
    if (timerId) return;
    timerId = setInterval(function () {
      seconds++;
      timerEl.textContent = formatTime(seconds);
    }, 1000);
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function buildDeck() {
    var deck = shuffle(SYMBOLS.concat(SYMBOLS));
    grid.innerHTML = "";
    cards = [];

    deck.forEach(function (symbol, index) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "memory-card";
      btn.setAttribute("aria-label", "카드 " + (index + 1) + ", 뒤집어서 그림 확인하기");

      var inner = document.createElement("span");
      inner.className = "memory-card-inner";

      var front = document.createElement("span");
      front.className = "memory-card-front";
      front.textContent = "?";
      front.setAttribute("aria-hidden", "true");

      var back = document.createElement("span");
      back.className = "memory-card-back";
      back.textContent = symbol;
      back.setAttribute("aria-hidden", "true");

      inner.appendChild(front);
      inner.appendChild(back);
      btn.appendChild(inner);

      var cardData = { el: btn, symbol: symbol, matched: false };
      btn.addEventListener("click", function () {
        handleCardClick(cardData);
      });

      grid.appendChild(btn);
      cards.push(cardData);
    });
  }

  function handleCardClick(card) {
    if (isChecking) return;
    if (card.matched) return;
    if (card.el.classList.contains("flipped")) return;
    if (flipped.length >= 2) return;

    if (!started) {
      started = true;
      startTimer();
    }

    card.el.classList.add("flipped");
    flipped.push(card);

    if (flipped.length === 2) {
      moves++;
      movesEl.textContent = String(moves);
      isChecking = true;

      if (flipped[0].symbol === flipped[1].symbol) {
        flipped[0].matched = true;
        flipped[1].matched = true;
        flipped[0].el.classList.add("matched");
        flipped[1].el.classList.add("matched");
        matchedCount += 2;
        flipped = [];
        isChecking = false;

        if (matchedCount === cards.length) {
          finishGame();
        }
      } else {
        var pair = flipped;
        flipBackTimeoutId = setTimeout(function () {
          pair[0].el.classList.remove("flipped");
          pair[1].el.classList.remove("flipped");
          flipped = [];
          isChecking = false;
          flipBackTimeoutId = null;
        }, 800);
      }
    }
  }

  function finishGame() {
    stopTimer();
    var isBest = saveBestIfNeeded();
    loadBest();
    resultText.textContent =
      "완료! " + moves + "번 만에 " + formatTime(seconds) + " 기록으로 클리어했어요." +
      (isBest ? " 최고 기록 갱신!" : "");
    resultBox.hidden = false;
  }

  function resetGame() {
    stopTimer();
    if (flipBackTimeoutId) {
      clearTimeout(flipBackTimeoutId);
      flipBackTimeoutId = null;
    }

    cards = [];
    flipped = [];
    matchedCount = 0;
    moves = 0;
    seconds = 0;
    isChecking = false;
    started = false;

    movesEl.textContent = "0";
    timerEl.textContent = "00:00";
    resultBox.hidden = true;

    buildDeck();
  }

  restartBtn.addEventListener("click", resetGame);

  loadBest();
  resetGame();
});
