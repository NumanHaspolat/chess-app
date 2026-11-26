// Subtle 3D tilt for hero cards on desktop (works with the glass spotlight in glass.js).
(() => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const SEL = ".home-card,.hx-card,.home-stat,.profile-stat-card";
  const MAX = 6; // degrees
  let cur = null;
  let raf = 0;
  let ev = null;

  const reset = (el) => {
    if (!el) return;
    el.style.transition = "transform .35s cubic-bezier(.2,.8,.2,1)";
    el.style.transform = "";
  };
  const apply = () => {
    raf = 0;
    const el = ev.target.closest?.(SEL);
    if (el !== cur) {
      reset(cur);
      cur = el;
    }
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width - 0.5;
    const py = (ev.clientY - r.top) / r.height - 0.5;
    el.style.transition =
      "transform .08s ease-out, border-color .25s, box-shadow .25s";
    el.style.transform = `perspective(700px) rotateX(${(-py * MAX).toFixed(2)}deg) rotateY(${(px * MAX).toFixed(2)}deg) translateY(-3px)`;
  };
  document.addEventListener(
    "pointermove",
    (e) => {
      ev = e;
      if (!raf) raf = requestAnimationFrame(apply);
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => {
    reset(cur);
    cur = null;
  });
  window.addEventListener("blur", () => {
    reset(cur);
    cur = null;
  });
})();
