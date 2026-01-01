"use strict";

// ========== Lightbox Gallery ========== //
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

  let pageLefts = [];

  function getPageWidth() {
    return track.clientWidth; // track is the scroller in your setup
  }

  function getMaxScrollLeft() {
    return Math.max(0, track.scrollWidth - track.clientWidth);
  }

  function buildPageLefts() {
    const pageWidth = getPageWidth();
    const max = getMaxScrollLeft();

    if (pageWidth <= 0) {
      pageLefts = [0];
      return;
    }

    // Build page positions: 0, pageWidth, 2*pageWidth... and ensure final is exactly max
    const lefts = [];
    lefts.push(0);

    let next = pageWidth;
    while (next < max) {
      lefts.push(next);
      next += pageWidth;
    }

    // Always include the real end position (this is the key!)
    if (max > 0) lefts.push(max);

    // Remove duplicates (in case max equals a multiple)
    pageLefts = [...new Set(lefts)];
  }

  function pagesCount() {
    return pageLefts.length || 1;
  }

  function nearestPageIndex(left) {
    let bestIndex = 0;
    let bestDist = Infinity;

    for (let i = 0; i < pageLefts.length; i++) {
      const dist = Math.abs(left - pageLefts[i]);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  function scrollToPage(i) {
    const count = pagesCount();
    const index = Math.max(0, Math.min(i, count - 1));
    track.scrollTo({ left: pageLefts[index] ?? 0, behavior: "smooth" });
  }

  function buildDots() {
    buildPageLefts();
    dotsWrap.innerHTML = "";

    const count = pagesCount();

    for (let i = 0; i < count; i++) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "cert-carousel_dot";
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => scrollToPage(i));
      dotsWrap.appendChild(dot);
    }

    updateActiveDot();
  }

  function updateActiveDot() {
    if (!pageLefts.length) buildPageLefts();

    const index = nearestPageIndex(track.scrollLeft);
    const dots = dotsWrap.querySelectorAll(".cert-carousel_dot");

    dots.forEach((dot, i) => {
      dot.setAttribute("aria-current", i === index ? "true" : "false");
    });
  }

  function goPrev() {
    buildPageLefts();
    const current = nearestPageIndex(track.scrollLeft);
    scrollToPage(current - 1);
  }

  function goNext() {
    buildPageLefts();
    const current = nearestPageIndex(track.scrollLeft);
    scrollToPage(current + 1);
  }

  if (prevBtn) prevBtn.addEventListener("click", goPrev);
  if (nextBtn) nextBtn.addEventListener("click", goNext);

  let scrollTimer;
  track.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    // wait for scroll-snap / momentum to settle
    scrollTimer = setTimeout(updateActiveDot, 180);
  });

  window.addEventListener("resize", buildDots);
  window.addEventListener("load", buildDots);

  buildDots();
})();
