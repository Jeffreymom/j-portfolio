/* ============================================
   EJ Portfolio - app.js
   기능 목록:
   1. 부드러운 스크롤 (+ 모바일 메뉴 자동 닫기)
   2. Navbar active 효과 (현재 보고 있는 섹션 강조)
   3. Top 버튼 (위로 가기)
   4. 스크롤 등장 애니메이션 (카드가 스르륵 나타남)
   ============================================ */

/* HTML이 모두 로드된 후에 실행 (안전장치) */
document.addEventListener("DOMContentLoaded", function () {

  /* ============================================
     1. 부드러운 스크롤 + 모바일 메뉴 자동 닫기
     - 메뉴 클릭 시 해당 섹션으로 부드럽게 이동
     - 모바일에서는 이동 후 햄버거 메뉴가 자동으로 닫힘
     ============================================ */
  const navLinks = document.querySelectorAll('a[href^="#"]');  // #으로 시작하는 모든 링크
  const navMenu = document.getElementById("navMenu");          // 모바일 메뉴 영역

  navLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      const targetId = link.getAttribute("href");   // 예: "#works"
      const target = document.querySelector(targetId);
      if (!target) return;   // 대상 섹션이 없으면 아무것도 안 함

      e.preventDefault();    // 기본 순간이동 막기
      target.scrollIntoView({ behavior: "smooth" });  // 부드럽게 이동

      /* 모바일에서 열려있는 햄버거 메뉴 닫기 */
      if (navMenu.classList.contains("show")) {
        bootstrap.Collapse.getInstance(navMenu).hide();
      }
    });
  });

  /* ============================================
     2. Navbar active 효과
     - 스크롤 위치를 감지해서 지금 보고 있는 섹션의
       메뉴에 'active' 클래스를 붙여줌
     - 스타일은 style.css의 .nav-link.active에서 지정
     ============================================ */
  const sections = document.querySelectorAll("section[id], header[id]");
  const menuLinks = document.querySelectorAll(".navbar .nav-link");

  function updateActiveMenu() {
    let currentId = "";

    sections.forEach(function (section) {
      /* 섹션 상단이 화면 위에서 120px 지점을 지나면 '현재 섹션'으로 판단
         (숫자를 키우면 더 일찍 활성화됨) */
      const sectionTop = section.getBoundingClientRect().top;
      if (sectionTop <= 120) {
        currentId = section.id;
      }
    });

    /* 모든 메뉴에서 active를 뗀 후, 현재 섹션 메뉴에만 붙이기 */
    menuLinks.forEach(function (link) {
      link.classList.remove("active");
      if (link.getAttribute("href") === "#" + currentId) {
        link.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", updateActiveMenu);
  updateActiveMenu();  // 페이지 처음 열릴 때도 한 번 실행

  /* ============================================
     3. Top 버튼 (위로 가기)
     - JS가 버튼을 자동으로 만들어서 화면 우하단에 추가
     - 400px 이상 스크롤하면 나타남
     - 스타일은 style.css의 .top-btn에서 지정
     ============================================ */
  const topBtn = document.createElement("button");
  topBtn.className = "top-btn";
  topBtn.innerHTML = "↑";
  topBtn.setAttribute("aria-label", "맨 위로 이동");
  document.body.appendChild(topBtn);

  /* 버튼 클릭 → 맨 위로 부드럽게 이동 */
  topBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* 스크롤 위치에 따라 버튼 보이기/숨기기 */
  window.addEventListener("scroll", function () {
    if (window.scrollY > 400) {        // 400을 바꾸면 나타나는 시점 조절 가능
      topBtn.classList.add("show");
    } else {
      topBtn.classList.remove("show");
    }
  });

  /* ============================================
     4. 스크롤 등장 애니메이션 ✨ (고급 기능)
     - 카드와 섹션 제목이 화면에 들어올 때 스르륵 나타남
     - IntersectionObserver: 요소가 화면에 보이는지
       감시해주는 브라우저 내장 기능 (성능도 좋음)
     ============================================ */
  const revealTargets = document.querySelectorAll(".work-card, section h2, #about .lead");

  /* 나타나기 전 상태(투명 + 살짝 아래)를 미리 적용 */
  revealTargets.forEach(function (el) {
    el.classList.add("reveal");
  });

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-show");  // 화면에 들어오면 나타남
          observer.unobserve(entry.target);           // 한 번만 실행 (반복 X)
        }
      });
    },
    { threshold: 0.15 }  // 요소가 15% 보이면 실행 (0~1 사이로 조절)
  );

  revealTargets.forEach(function (el) {
    observer.observe(el);
  });

});