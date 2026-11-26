// Card effects in one module (imported from main.js, so it always loads):
//  - cursor spotlight on glass cards, 3D tilt on hero cards, swipe on boards (mobile).
if (!window.__cardFx) {
  window.__cardFx = true;

  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SPOT =
    ".home-card,.hx-card,.home-stat,.profile-stat-card,.profile-chart-card,.profile-opening-card,.profile-settings-card,.ach-card";
  const TILT = ".home-card,.hx-card,.home-stat,.profile-stat-card";
  const MAX = 6;

  let spotEl = null;
  let tiltEl = null;
  let raf = 0;
  let ev = null;

  const resetTilt = (el) => {
    if (!el) return;
    el.style.transition = "transform .35s cubic-bezier(.2,.8,.2,1)";
    el.style.transform = "";
  };
  const clearSpot = () => {
    if (spotEl) spotEl.style.setProperty("--spot", "0");
    spotEl = null;
  };

  const frame = () => {
    raf = 0;
    if (!ev || ev.pointerType === "touch" || reduced()) return;
    const t = ev.target;

    const s = t.closest?.(SPOT);
    if (s !== spotEl) {
      clearSpot();
      spotEl = s;
    }
    if (s) {
      const r = s.getBoundingClientRect();
      s.style.setProperty("--mx", ev.clientX - r.left + "px");
      s.style.setProperty("--my", ev.clientY - r.top + "px");
      s.style.setProperty("--spot", "1");
    }

    const c = t.closest?.(TILT);
    if (c !== tiltEl) {
      resetTilt(tiltEl);
      tiltEl = c;
    }
    if (c) {
      const r = c.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width - 0.5;
      const py = (ev.clientY - r.top) / r.height - 0.5;
      c.style.transition =
        "transform .08s ease-out, border-color .25s, box-shadow .25s";
      c.style.transform = `perspective(700px) rotateX(${(-py * MAX).toFixed(2)}deg) rotateY(${(px * MAX).toFixed(2)}deg) translateY(-3px)`;
    }
  };

  document.addEventListener(
    "pointermove",
    (e) => {
      ev = e;
      if (!raf) raf = requestAnimationFrame(frame);
    },
    { passive: true },
  );
  const leave = () => {
    clearSpot();
    resetTilt(tiltEl);
    tiltEl = null;
  };
  document.addEventListener("pointerleave", leave);
  document.documentElement.addEventListener("mouseleave", leave);
  window.addEventListener("blur", leave);

  // ---- swipe on the board (touch): next / previous move via arrow-key handlers
  let sx = 0,
    sy = 0,
    st = 0,
    ok = false;
  document.addEventListener(
    "touchstart",
    (e) => {
      ok = false;
      if (e.touches.length !== 1) return;
      const t = e.target;
      if (
        !t.closest?.(".board") ||
        t.closest(".home-board") ||
        t.closest(".piece")
      )
        return;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      st = Date.now();
      ok = true;
    },
    { passive: true },
  );
  document.addEventListener(
    "touchend",
    (e) => {
      if (!ok) return;
      ok = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (
        Date.now() - st > 600 ||
        Math.abs(dx) < 50 ||
        Math.abs(dx) < Math.abs(dy) * 1.6
      )
        return;
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: dx < 0 ? "ArrowRight" : "ArrowLeft",
          bubbles: true,
          cancelable: true,
        }),
      );
      try {
        navigator.vibrate?.(8);
      } catch {}
    },
    { passive: true },
  );
}
