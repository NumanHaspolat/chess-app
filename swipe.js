// Mobile: swipe left/right on an empty board area = next/previous move.
// Re-uses the existing ArrowLeft/ArrowRight handling, so it works on every page.
(() => {
  if (!("ontouchstart" in window) && !(navigator.maxTouchPoints > 0)) return;
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
      if (!t.closest?.(".board") || t.closest(".home-board")) return;
      if (t.closest(".piece")) return; // pieces are for dragging
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
      const key = dx < 0 ? "ArrowRight" : "ArrowLeft";
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
      );
      try {
        navigator.vibrate?.(8);
      } catch {}
    },
    { passive: true },
  );
})();
