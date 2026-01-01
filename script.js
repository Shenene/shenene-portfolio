"use strict";

// Lightbox Gallery
(() => {
  const gallery = document.querySelector("[data-gallery]");
  const lightbox = document.querySelector("[data-lightbox]");
  if (!gallery || !lightbox) return;

  const lbImg = lightbox.querySelector("[data-lightbox-img]");
  const lbCaption = lightbox.querySelector("[data-lightbox-caption]");
  const btnPrev = lightbox.querySelector("[data-prev]");
  const btnNext = lightbox.querySelector("[data-next]");
  const closeEls = lightbox.querySelectorAll("[data-close]");

  const thumbs = Array.from(gallery.querySelectorAll("button.thumb, button.thumb_block"));
  if (thumbs.length === 0) return;

  let currentIndex = 0;
  let lastFocusedEl = null;

  const render = () => {
    const btn = thumbs[currentIndex];
    const fullSrc = btn.getAttribute("data-full");
    const alt = btn.getAttribute("data-alt") || "";

    lbImg.src = fullSrc;
    lbImg.alt = alt;
    if (lbCaption) lbCaption.textContent = alt;

    btnPrev.disabled = currentIndex === 0;
    btnNext.disabled = currentIndex === thumbs.length - 1;
  };

  const open = (index) => {
    currentIndex = index;
    lastFocusedEl = document.activeElement;

    lightbox.hidden = false;
    document.body.style.overflow = "hidden";

    render();

    const closeBtn = lightbox.querySelector("[data-close]");
    closeBtn?.focus();
  };

  const close = () => {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    lbImg.removeAttribute("src");
    lastFocusedEl?.focus();
  };

  const prev = () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      render();
    }
  };

  const next = () => {
    if (currentIndex < thumbs.length - 1) {
      currentIndex += 1;
      render();
    }
  };

  gallery.addEventListener("click", (e) => {
    const btn = e.target.closest("button.thumb, button.thumb_block");
    if (!btn) return;

    const index = thumbs.indexOf(btn);
    if (index >= 0) open(index);
  });

  closeEls.forEach((el) => el.addEventListener("click", close));
  btnPrev.addEventListener("click", prev);
  btnNext.addEventListener("click", next);

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;

    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  });
})();

// ========== Carousel ========== //
(function () {
  const track = document.querySelector("[data-carousel-track]");
  const dotsWrap = document.querySelector("[data-carousel-dots]");
  const prevBtn = document.querySelector(".cert-carousel_btn--prev");
  const nextBtn = document.querySelector(".cert-carousel_btn--next");

  if (!track || !dotsWrap) return;

  let stops = []; // scrollLeft "snap" targets navigate between

  function getMaxScrollLeft() {
    return Math.max(0, track.scrollWidth - track.clientWidth);
  }

  function getCards() {
    return Array.from(track.querySelectorAll(".certificate"));
  }

  function isMobileOneCardMode() {
    const cards = getCards();
    if (!cards.length) return false;

    const cardW = cards[0].getBoundingClientRect().width;
    if (!cardW) return false;

    // If only ~1 card fits in the visible width, treat as "snap per card"
    const approxVisibleCards = track.clientWidth / cardW;
    return approxVisibleCards < 1.35;
  }

  function dedupeWithTolerance(arr, tol = 6) {
    const out = [];
    for (const x of arr) {
      if (!out.length || Math.abs(x - out[out.length - 1]) > tol) out.push(x);
    }
    return out;
  }

  function buildStops() {
    const max = getMaxScrollLeft();
    const pageWidth = track.clientWidth;

    // If no scroll, only one stop
    if (max <= 0 || pageWidth <= 0) {
      stops = [0];
      return;
    }

    if (isMobileOneCardMode()) {
      // Mobile: each certificate card is a snap point
      const cards = getCards();

      let lefts = cards
        .map((c) => c.offsetLeft)
        .map((x) => Math.max(0, Math.min(x, max)))
        .sort((a, b) => a - b);

      // Always include max as final stop (in case last card offset isn't exactly max)
      lefts.push(max);

      stops = dedupeWithTolerance(lefts, 8);
      return;
    }

    // Desktop/tablet: navigate by "pages" (track width)
    const lefts = [0];
    let next = pageWidth;

    while (next < max) {
      lefts.push(next);
      next += pageWidth;
    }

    lefts.push(max);
    stops = dedupeWithTolerance(lefts, 10);
  }

  function countStops() {
    return stops.length || 1;
  }

  function nearestStopIndex(left) {
    let best = 0;
    let bestDist = Infinity;

    for (let i = 0; i < stops.length; i++) {
      const d = Math.abs(left - stops[i]);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  function scrollToIndex(i) {
    const max = getMaxScrollLeft();
    const idx = Math.max(0, Math.min(i, countStops() - 1));
    const target = Math.max(0, Math.min(stops[idx] ?? 0, max));
    track.scrollTo({ left: target, behavior: "smooth" });
  }

  function updateActiveDot() {
    if (!stops.length) buildStops();

    const index = nearestStopIndex(track.scrollLeft);
    const dots = dotsWrap.querySelectorAll(".cert-carousel_dot");

    dots.forEach((dot, i) => {
      dot.setAttribute("aria-current", i === index ? "true" : "false");
    });
  }

  function buildDots() {
    buildStops();
    dotsWrap.innerHTML = "";

    const count = countStops();

    for (let i = 0; i < count; i++) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "cert-carousel_dot";
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => scrollToIndex(i));
      dotsWrap.appendChild(dot);
    }

    updateActiveDot();
  }

  function goPrev() {
    buildStops();
    const current = nearestStopIndex(track.scrollLeft);
    scrollToIndex(current - 1);
  }

  function goNext() {
    buildStops();
    const current = nearestStopIndex(track.scrollLeft);
    scrollToIndex(current + 1);
  }

  if (prevBtn) prevBtn.addEventListener("click", goPrev);
  if (nextBtn) nextBtn.addEventListener("click", goNext);

  let scrollTimer;
  track.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    // Let scroll-snap settle
    scrollTimer = setTimeout(updateActiveDot, 180);
  });

  window.addEventListener("resize", buildDots);
  window.addEventListener("load", buildDots);

  buildDots();
})();
