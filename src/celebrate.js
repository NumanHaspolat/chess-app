// Varied celebrations: gold rain, rising embers, fireworks, crown drop, star burst.
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const accent = () =>
  getComputedStyle(document.documentElement)
    .getPropertyValue("--accent-strong")
    .trim() || "#3fdef3";
const rnd = (a, b) => a + Math.random() * (b - a);

function layer(ms) {
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:9998";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
  return el;
}

function bit(parent, color, size, x, y, round = false) {
  const p = document.createElement("i");
  p.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${color};${round ? "border-radius:50%;" : ""}`;
  parent.appendChild(p);
  return p;
}

// Level up: golden coins and stars falling.
export function goldRain(count = 55) {
  if (reduced()) return;
  const L = layer(4200);
  const cols = ["#ffd166", "#ffe29a", "#f4b942", "#fff3c4"];
  for (let i = 0; i < count; i++) {
    const s = rnd(6, 11);
    const p = bit(
      L,
      cols[i % cols.length],
      s,
      rnd(0, innerWidth),
      -14,
      i % 3 === 0,
    );
    p.style.boxShadow = "0 0 6px rgba(255,209,102,.8)";
    p.animate(
      [
        { transform: "translate(0,0) rotate(0)", opacity: 1 },
        {
          transform: `translate(${rnd(-60, 60)}px,${innerHeight * 1.1}px) rotate(${rnd(200, 600)}deg)`,
          opacity: 0.8,
        },
      ],
      {
        duration: rnd(1800, 3200),
        delay: rnd(0, 700),
        easing: "cubic-bezier(.35,.1,.6,1)",
        fill: "forwards",
      },
    );
  }
}

// Puzzle streak: embers rising from the bottom.
export function embers(count = 36) {
  if (reduced()) return;
  const L = layer(3200);
  const cols = ["#ff7a1a", "#ff9d3c", "#ffd166", "#ff4d2e"];
  for (let i = 0; i < count; i++) {
    const s = rnd(4, 9);
    const p = bit(
      L,
      cols[i % cols.length],
      s,
      rnd(0, innerWidth),
      innerHeight + 10,
    );
    p.style.boxShadow = "0 0 8px rgba(255,120,30,.9)";
    p.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 0 },
        { opacity: 1, offset: 0.15 },
        {
          transform: `translate(${rnd(-80, 80)}px,${-rnd(innerHeight * 0.45, innerHeight * 0.9)}px) scale(.2)`,
          opacity: 0,
        },
      ],
      {
        duration: rnd(1400, 2600),
        delay: rnd(0, 600),
        easing: "ease-out",
        fill: "forwards",
      },
    );
  }
}

// Daily goal: a few fireworks in the upper half of the screen.
export function fireworks(shots = 4) {
  if (reduced()) return;
  const L = layer(4000);
  const pals = [
    [accent(), `color-mix(in srgb, ${accent()} 55%, white)`, "#fff"],
    ["#ffd166", "#fff3c4", "#fff"],
    ["#9ef28a", "#d8ffcf", "#fff"],
    ["#ff8fab", "#ffd0dc", "#fff"],
  ];
  for (let s = 0; s < shots; s++) {
    const cx = rnd(innerWidth * 0.15, innerWidth * 0.85);
    const cy = rnd(innerHeight * 0.15, innerHeight * 0.5);
    const pal = pals[s % pals.length];
    const delay = s * 360;
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const dist = rnd(70, 130);
      const p = bit(L, pal[i % pal.length], rnd(3, 6), cx, cy);
      p.style.opacity = "0";
      p.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          {
            transform: `translate(${Math.cos(a) * dist}px,${Math.sin(a) * dist + 30}px) scale(.2)`,
            opacity: 0,
          },
        ],
        {
          duration: rnd(800, 1200),
          delay,
          easing: "cubic-bezier(.1,.7,.3,1)",
          fill: "both",
        },
      );
    }
  }
}

// Star sparkle burst around the middle of the visible board.
export function starBurst(n = 16) {
  if (reduced()) return;
  const b = [...document.querySelectorAll(".board")].find(
    (x) => x.offsetParent !== null && x.getBoundingClientRect().width > 0,
  );
  const r = b
    ? b.getBoundingClientRect()
    : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const L = layer(1600);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const d = rnd(Math.max(60, r.width * 0.18), Math.max(110, r.width * 0.4));
    const p = bit(L, i % 2 ? "#ffd166" : accent(), rnd(5, 9), cx, cy);
    p.style.clipPath =
      "polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)";
    p.animate(
      [
        { transform: "translate(-50%,-50%) scale(0)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) scale(1.6) rotate(120deg)`,
          opacity: 1,
          offset: 0.6,
        },
        {
          transform: `translate(calc(-50% + ${Math.cos(a) * d * 1.15}px),calc(-50% + ${Math.sin(a) * d * 1.15}px)) scale(0)`,
          opacity: 0,
        },
      ],
      { duration: rnd(800, 1100), easing: "ease-out", fill: "forwards" },
    );
  }
}

// First win ever: a crown drops onto the board and bounces.
export function crownDrop() {
  const b = [...document.querySelectorAll(".board")].find(
    (x) => x.offsetParent !== null && x.getBoundingClientRect().width > 0,
  );
  const r = b
    ? b.getBoundingClientRect()
    : {
        left: innerWidth / 2 - 100,
        top: innerHeight / 2,
        width: 200,
        height: 0,
      };
  const el = document.createElement("div");
  el.textContent = "👑";
  const size = Math.max(56, Math.min(120, r.width * 0.22));
  el.style.cssText = `position:fixed;z-index:9998;pointer-events:none;left:${r.left + r.width / 2}px;top:${r.top + r.height * 0.3}px;font-size:${size}px;line-height:1;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45));transform:translate(-50%,-50%)`;
  document.body.appendChild(el);
  if (reduced()) return void setTimeout(() => el.remove(), 1800);
  el.animate(
    [
      {
        transform: "translate(-50%,-260%) rotate(-25deg) scale(.6)",
        opacity: 0,
      },
      {
        transform: "translate(-50%,-50%) rotate(8deg) scale(1.15)",
        opacity: 1,
        offset: 0.4,
      },
      {
        transform: "translate(-50%,-80%) rotate(-5deg) scale(1)",
        offset: 0.58,
      },
      { transform: "translate(-50%,-50%) rotate(0) scale(1)", offset: 0.75 },
      {
        transform: "translate(-50%,-50%) rotate(0) scale(1)",
        opacity: 1,
        offset: 0.9,
      },
      { transform: "translate(-50%,-90%) scale(.8)", opacity: 0 },
    ],
    { duration: 2200, easing: "ease-out", fill: "forwards" },
  ).onfinish = () => el.remove();
  setTimeout(() => starBurst(14), 450);
}
