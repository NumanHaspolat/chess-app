// Small "feel good" touches: floating cheers after wins, a LEVEL UP banner, the
// tab title streak, and the footer heart. Listens to "cxess:event" (see progress.js).
import { sparkleAt, confetti, visibleBoard } from "./fx.js";
import { track } from "./progress.js";
import {
  goldRain,
  embers,
  fireworks,
  crownDrop,
  starBurst,
} from "./celebrate.js";

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const WIN_WORDS = [
  "Nice!",
  "Sharp!",
  "Clean!",
  "Well seen!",
  "Crisp!",
  "Great find!",
];

function anchorRect() {
  const board =
    [document.getElementById("puzzle-board"), visibleBoard()].find(
      (b) =>
        b && b.offsetParent !== null && b.getBoundingClientRect().width > 0,
    ) || null;
  if (board) return board.getBoundingClientRect();
  return {
    left: innerWidth / 2 - 120,
    top: innerHeight / 2 - 60,
    width: 240,
    height: 120,
  };
}

// Floating text that rises from the board and fades away.
export function cheer(text, tone = "good") {
  const r = anchorRect();
  const el = document.createElement("div");
  el.className = `cheer cheer-${tone}`;
  el.textContent = text;
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top + r.height * 0.42}px`;
  document.body.appendChild(el);
  if (reduced()) {
    setTimeout(() => el.remove(), 1500);
  } else {
    el.animate(
      [
        { opacity: 0, transform: "translate(-50%, 10px) scale(.6)" },
        {
          opacity: 1,
          transform: "translate(-50%, -8px) scale(1.12)",
          offset: 0.2,
        },
        {
          opacity: 1,
          transform: "translate(-50%, -24px) scale(1)",
          offset: 0.7,
        },
        { opacity: 0, transform: "translate(-50%, -56px) scale(1)" },
      ],
      { duration: 1500, easing: "ease-out", fill: "forwards" },
    ).onfinish = () => el.remove();
  }
  if (tone === "good")
    sparkleAt(r.left + r.width / 2, r.top + r.height * 0.42, 14);
}

function levelBanner({ level, title }) {
  const el = document.createElement("div");
  el.className = "lvl-banner";
  el.innerHTML = `<div class="lvl-box"><div class="lvl-glyph"></div><small>LEVEL UP</small><strong></strong><span></span></div>`;
  el.querySelector(".lvl-glyph").textContent = title.glyph;
  el.querySelector("strong").textContent = `Level ${level}`;
  el.querySelector("span").textContent = title.name;
  const close = () => {
    if (!el.isConnected) return;
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 260);
  };
  el.addEventListener("click", close);
  document.body.appendChild(el);
  setTimeout(close, 2600);
}

function firstWinEver() {
  try {
    if (localStorage.getItem("chexel-first-win")) return false;
    localStorage.setItem("chexel-first-win", "1");
    return true;
  } catch {
    return false;
  }
}

function onEvent(e) {
  const { event, d = {}, levelUp, run } = e.detail || {};
  switch (event) {
    case "puzzle":
      if (d.won && !d.hint) {
        if (run >= 5 && run % 5 === 0) {
          cheer(`${run} in a row!`, "fire");
          embers();
        } else cheer(run >= 3 ? `${run} in a row!` : pick(WIN_WORDS));
      } else if (d.won) cheer("Solved!");
      else cheer("So close! Next one.", "soft");
      break;
    case "drill":
      if (d.mistakes) cheer("Line complete!");
      else {
        cheer("Flawless!", "gold");
        starBurst();
      }
      break;
    case "learn":
      cheer("Line learned!");
      starBurst(8);
      break;
    case "train":
      cheer("Nicely trained!");
      break;
    case "bot":
      if (d.outcome === "w") {
        if (firstWinEver()) {
          cheer("Your first win!", "gold");
          crownDrop();
        } else {
          cheer("You win!");
          confetti({ count: 70 });
        }
      } else if (d.outcome === "d") cheer("Hard-fought draw", "soft");
      else cheer("Good fight. Check the analysis?", "soft");
      break;
    case "daily":
      cheer("Daily goal complete!", "gold");
      fireworks();
      break;
  }
  if (levelUp) {
    goldRain();
    setTimeout(() => levelBanner(levelUp), event === "daily" ? 1200 : 300);
  }
}

export function initDelight({ daily } = {}) {
  window.addEventListener("cxess:event", onEvent);

  const base = document.title.split(" · ")[0] || "Chexel";
  const title = () => {
    try {
      const s = daily?.().streak || 0;
      document.title = s > 0 ? `${base} · ${s} day streak` : base;
    } catch {}
  };
  title();
  window.addEventListener("cxess:progress", title);

  let hearts = 0;
  document.getElementById("footer-heart")?.addEventListener("click", (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    sparkleAt(r.left + r.width / 2, r.top + r.height / 2, 14);
    e.currentTarget.classList.remove("beat");
    void e.currentTarget.offsetWidth;
    e.currentTarget.classList.add("beat");
    if (++hearts === 5) track("egg", { id: "heart" });
  });
}
