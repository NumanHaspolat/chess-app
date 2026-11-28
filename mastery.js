// Celebrates the first time a line reaches 5/5 mastery (and when a whole opening is mastered).
// It never blocks the screen: a banner slides in at the top, with confetti, and fades on its own.
// Stateless: "first time" = progress was below 90 before this Train run and is 90+ after it.
import {
  openingProgress,
  getOpeningProgress,
  getVariationProgress,
} from "./src/opening-progress.js";
import { masteryDots } from "./roadmap.js";
import { confetti } from "./src/fx.js";

const MASTERED = 90;
const esc = (t) =>
  String(t).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

export function progressOf(opening, variation) {
  return getVariationProgress(getOpeningProgress(opening, variation));
}

function masteredCount(opening) {
  const data = openingProgress[opening.id || opening.name]?.variations || {};
  const list = opening.variations || [];
  const n = list.filter(
    (v) => (data[v.id || v.name]?.progress || 0) >= MASTERED,
  ).length;
  return { n, total: list.length };
}

export function checkMastery(opening, variation, before) {
  const after = progressOf(opening, variation);
  if (before >= MASTERED || after < MASTERED) return false;
  const { n, total } = masteredCount(opening);
  const whole = total > 0 && n === total && total > 1;
  setTimeout(() => show(opening, variation, n, total, whole), 700);
  return true;
}

function show(opening, variation, n, total, whole) {
  document.querySelector(".mc-banner")?.remove();
  const el = document.createElement("div");
  el.className = "mc-banner" + (whole ? " whole" : "");
  el.setAttribute("role", "status");
  el.innerHTML = `<div class="mc-crown" aria-hidden="true">${whole ? "♛" : "♞"}</div>
    <div class="mc-text">
      <strong>${whole ? "Opening mastered!" : "Line mastered!"}</strong>
      <span class="mc-name">${esc(variation.name)}</span>
      <small>${whole ? `All ${total} lines of ${esc(opening.name)} are at 5/5.` : `${n} of ${total} line${total === 1 ? "" : "s"} mastered in ${esc(opening.name)}.`}</small>
      <span class="mc-dots"></span>
    </div>
    <button type="button" class="mc-x" aria-label="Close">✕</button>`;
  const dots = masteryDots(100);
  dots.classList.add("mc-lit");
  el.querySelector(".mc-dots").appendChild(dots);
  document.body.appendChild(el);
  const close = () => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 350);
  };
  el.querySelector(".mc-x").addEventListener("click", close);
  setTimeout(close, whole ? 9000 : 6500);
  try {
    confetti({ count: whole ? 140 : 80 });
    if (whole) setTimeout(() => confetti({ count: 90 }), 600);
  } catch {}
}
