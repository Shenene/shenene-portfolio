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
