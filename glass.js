// Cursor spotlight: sets --mx/--my/--spot on the glass card under the pointer.
(() => {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const SEL =
    ".home-card,.hx-card,.home-stat,.profile-stat-card,.profile-chart-card,.profile-opening-card,.profile-settings-card,.ach-card";
  let active = null;
  let raf = 0;
  let ev = null;

  const clear = () => {
    if (active) active.style.setProperty("--spot", "0");
    active = null;
  };
  const apply = () => {
    raf = 0;
    const card = ev.target.closest?.(SEL);
    if (card !== active) {
      clear();
      active = card;
    }
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", ev.clientX - r.left + "px");
    card.style.setProperty("--my", ev.clientY - r.top + "px");
    card.style.setProperty("--spot", "1");
  };
  document.addEventListener(
    "pointermove",
    (e) => {
      ev = e;
      if (!raf) raf = requestAnimationFrame(apply);
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", clear);
  window.addEventListener("blur", clear);
})();
