/* ============================================================
   TodayMeal · 홈 인터랙션
   - 추천 메뉴: 좌우 스와이프 캐러셀 (터치 / 마우스 드래그 / 방향키 / 도트)
   ============================================================ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 토스트 ────────────────────────────────────────────── */
  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }

  /* ── 캐러셀 ────────────────────────────────────────────── */
  var carousel = $('#mealCarousel');
  var slides   = $$('.carousel-slide', carousel);
  var dots     = $$('.dot', $('#mealDots'));
  var index    = 0;

  function slideWidth() { return carousel.clientWidth; }

  function syncDots(i) {
    index = i;
    dots.forEach(function (d, n) {
      var on = n === i;
      d.classList.toggle('active', on);
      d.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function goTo(i, smooth) {
    var n = slides.length;
    i = ((i % n) + n) % n;
    carousel.scrollTo({
      left: i * slideWidth(),
      behavior: (smooth !== false && !reduceMotion) ? 'smooth' : 'auto'
    });
    syncDots(i);
  }

  /* 스크롤 위치 → 도트 동기화 (터치 스와이프 포함) */
  var rafPending = false;
  carousel.addEventListener('scroll', function () {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      var i = Math.round(carousel.scrollLeft / slideWidth());
      i = Math.max(0, Math.min(slides.length - 1, i));
      if (i !== index) syncDots(i);
    });
  }, { passive: true });

  /* 마우스/펜 드래그 (터치는 브라우저 기본 스크롤에 맡김)
     - 실제로 일정 거리 이상 움직였을 때만 드래그 모드로 전환한다.
       pointerdown 즉시 전환하면 자식의 pointer-events 가 꺼져
       단순 클릭의 타깃이 버튼에서 캐러셀로 바뀌어 버린다. */
  var DRAG_START = 4;
  var dragging = false, activeDrag = false;
  var startX = 0, startLeft = 0, moved = 0, suppressClick = false;

  carousel.addEventListener('pointerdown', function (e) {
    suppressClick = false;
    if (e.pointerType === 'touch' || e.button !== 0) return;
    dragging = true;
    activeDrag = false;
    moved = 0;
    startX = e.clientX;
    startLeft = carousel.scrollLeft;
  });

  carousel.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));

    if (!activeDrag) {
      if (moved <= DRAG_START) return;
      activeDrag = true;
      carousel.classList.add('is-dragging');
      if (e.pointerId != null) carousel.setPointerCapture(e.pointerId);
    }
    carousel.scrollLeft = startLeft - dx;
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;

    if (e && e.pointerId != null && carousel.hasPointerCapture(e.pointerId)) {
      carousel.releasePointerCapture(e.pointerId);
    }
    if (!activeDrag) return;              /* 그냥 클릭이었던 경우 */
    activeDrag = false;
    suppressClick = moved > 8;

    var w = slideWidth();
    var delta = carousel.scrollLeft - startLeft;
    var target = Math.round(startLeft / w);
    if (Math.abs(delta) > w * 0.16) target += (delta > 0 ? 1 : -1);
    target = Math.max(0, Math.min(slides.length - 1, target));

    /* scroll-snap 이 먼저 되살아나면 브라우저가 원래 위치로 되돌리므로
       목표 위치로 옮긴 뒤 다음 프레임에서 스냅을 복구한다. */
    carousel.scrollLeft = target * w;
    syncDots(target);
    requestAnimationFrame(function () { carousel.classList.remove('is-dragging'); });
  }
  carousel.addEventListener('pointerup', endDrag);
  carousel.addEventListener('pointercancel', endDrag);

  /* 드래그 직후의 클릭 한 번만 무시 */
  carousel.addEventListener('click', function (e) {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); }
    suppressClick = false;
  }, true);

  /* 방향키 */
  carousel.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(index - 1); }
  });

  /* 도트 클릭 */
  dots.forEach(function (d, i) {
    d.addEventListener('click', function () { goTo(i); });
  });

  /* 창 크기 변경 시 현재 슬라이드 유지 */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { goTo(index, false); }, 120);
  });

  /* ── 카드 안 버튼 ──────────────────────────────────────── */
  $$('.recommend-card').forEach(function (card, i) {
    var name = $('.meal-title', card).firstChild.textContent.trim();

    $('[data-action="pick"]', card).addEventListener('click', function () {
      toast('오늘 저녁은 ' + name + '으로 정했어요! 🍚');
    });

    $('[data-action="next"]', card).addEventListener('click', function () {
      goTo(i + 1);
      toast('다른 메뉴를 골라봤어요 ✨');
    });
  });

  /* ── 나머지 인터랙션 ───────────────────────────────────── */
  var quickMsg = {
    fridge:   '냉장고 사진 화면으로 연결하세요 🧊',
    shopping: '장보기 리스트로 연결하세요 🧺',
    recipe:   '저장한 레시피로 연결하세요 📖',
    verify:   '집밥 인증 카메라로 연결하세요 📸'
  };
  $$('.quick-card').forEach(function (c) {
    c.addEventListener('click', function () { toast(quickMsg[c.dataset.action]); });
  });

  var rouletteBtn = $('#rouletteBtn');
  if (rouletteBtn) {
    rouletteBtn.addEventListener('click', function () { toast('룰렛 화면으로 연결하세요 🎲'); });
  }

  $$('.nav-item').forEach(function (n) {
    n.addEventListener('click', function () {
      $$('.nav-item').forEach(function (x) {
        x.classList.remove('active');
        x.removeAttribute('aria-current');
      });
      n.classList.add('active');
      n.setAttribute('aria-current', 'page');
    });
  });

  syncDots(0);
})();
