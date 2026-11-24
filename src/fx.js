// Visual effects: pixel burst when a piece is captured, and a big turquoise
// celebration for brilliant moves. Everything is drawn in a fixed overlay on top
// of the page (so particles can fly outside the board) with the Web Animations
// API; no CSS needed.
const REDUCED = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const COLORS = [
  "#3fdef3",
  "#7ef0ff",
  "#ffffff",
  "#0e9db5",
  "#0b7f94",
  "#b8f7ff",
];
const PLUS =
  "polygon(35% 0,65% 0,65% 35%,100% 35%,100% 65%,65% 65%,65% 100%,35% 100%,35% 65%,0 65%,0 35%,35% 35%)";

let layer = null;
function getLayer() {
  if (layer && layer.isConnected) return layer;
  layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  Object.assign(layer.style, {
    position: "fixed",
    inset: "0",
    pointerEvents: "none",
    zIndex: "1500",
    overflow: "hidden",
  });
  document.body.appendChild(layer);
  return layer;
}

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function spawn(styles, keyframes, options, onDone) {
  const el = document.createElement("div");
  Object.assign(
    el.style,
    { position: "absolute", willChange: "transform, opacity" },
    styles,
  );
  getLayer().appendChild(el);
  const anim = el.animate(keyframes, { fill: "forwards", ...options });
  anim.onfinish = () => {
    el.remove();
    onDone?.();
  };
  return el;
}

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return {
    x: r.left + r.width / 2,
    y: r.top + r.height / 2,
    w: r.width,
    h: r.height,
    r,
  };
}

function particle(
  cx,
  cy,
  { size, dist, dur, gravity = 0, plus = false, spin = 0 },
) {
  const a = rnd(0, Math.PI * 2);
  const d = rnd(dist * 0.45, dist);
  const dx = Math.cos(a) * d;
  const dy = Math.sin(a) * d;
  const color = pick(COLORS);
  spawn(
    {
      left: `${cx - size / 2}px`,
      top: `${cy - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      background: color,
      boxShadow: `0 0 ${size}px ${color}`,
      outline: "1px solid rgba(4,50,59,.75)",
      clipPath: plus ? PLUS : "none",
    },
    [
      { transform: "translate(0,0) rotate(0deg) scale(1)", opacity: 1 },
      {
        transform: `translate(${dx * 0.8}px, ${dy * 0.8 + gravity * 0.4}px) rotate(${spin * 0.7}deg) scale(0.9)`,
        opacity: 1,
        offset: 0.55,
      },
      {
        transform: `translate(${dx}px, ${dy + gravity}px) rotate(${spin}deg) scale(0.2)`,
        opacity: 0,
      },
    ],
    { duration: dur, easing: "cubic-bezier(.12,.75,.3,1)" },
  );
}

// ------------------------------------------------------------------ capture
export function captureBurst(squareEl) {
  if (!squareEl || REDUCED) return;
  const { x, y, w } = centerOf(squareEl);
  // flash on the square
  spawn(
    {
      left: `${x - w / 2}px`,
      top: `${y - w / 2}px`,
      width: `${w}px`,
      height: `${w}px`,
      background: "rgba(63,222,243,.55)",
    },
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: 260, easing: "ease-out" },
  );
  // square ring
  spawn(
    {
      left: `${x - w * 0.3}px`,
      top: `${y - w * 0.3}px`,
      width: `${w * 0.6}px`,
      height: `${w * 0.6}px`,
      border: "3px solid #b8f7ff",
    },
    [
      { transform: "scale(.6)", opacity: 0.95 },
      { transform: "scale(1.9)", opacity: 0 },
    ],
    { duration: 320, easing: "ease-out" },
  );
  const n = 10;
  for (let i = 0; i < n; i++) {
    particle(x, y, {
      size: Math.round(rnd(9, 16)),
      dist: w * 1.2,
      dur: rnd(450, 700),
      gravity: rnd(8, 26),
      spin: rnd(-90, 90),
    });
  }
}

// ---------------------------------------------------------------- brilliant
export function brilliantFx(boardEl, squareEl) {
  if (!boardEl) return;
  const board = boardEl.getBoundingClientRect();
  const target = squareEl
    ? centerOf(squareEl)
    : {
        x: board.left + board.width / 2,
        y: board.top + board.height / 2,
        w: board.width / 8,
      };
  const { x, y, w } = target;

  if (REDUCED) {
    boardEl.animate(
      [
        { boxShadow: "0 0 0 0 rgba(63,222,243,0)" },
        { boxShadow: "0 0 0 4px rgba(63,222,243,.9)" },
        { boxShadow: "0 0 0 0 rgba(63,222,243,0)" },
      ],
      { duration: 700 },
    );
    return;
  }

  // 1) board glow
  boardEl.animate(
    [
      { boxShadow: "0 0 0 0 rgba(63,222,243,0), 0 0 0 rgba(63,222,243,0)" },
      {
        boxShadow:
          "0 0 0 3px rgba(63,222,243,.95), 0 0 46px 6px rgba(63,222,243,.65)",
        offset: 0.25,
      },
      { boxShadow: "0 0 0 0 rgba(63,222,243,0), 0 0 0 rgba(63,222,243,0)" },
    ],
    { duration: 1100, easing: "ease-out" },
  );

  // 2) shine sweeping across the board
  const clip = document.createElement("div");
  Object.assign(clip.style, {
    position: "absolute",
    left: `${board.left}px`,
    top: `${board.top}px`,
    width: `${board.width}px`,
    height: `${board.height}px`,
    overflow: "hidden",
    borderRadius: "6px",
  });
  const band = document.createElement("div");
  Object.assign(band.style, {
    position: "absolute",
    top: "-20%",
    bottom: "-20%",
    left: "0",
    width: "38%",
    background:
      "linear-gradient(100deg, transparent, rgba(184,247,255,.0) 10%, rgba(184,247,255,.55) 50%, rgba(184,247,255,0) 90%, transparent)",
    transform: "translateX(-130%) skewX(-18deg)",
  });
  clip.appendChild(band);
  getLayer().appendChild(clip);
  const sweep = band.animate(
    [
      { transform: "translateX(-130%) skewX(-18deg)" },
      { transform: "translateX(380%) skewX(-18deg)" },
    ],
    { duration: 800, easing: "ease-in-out", fill: "forwards" },
  );
  sweep.onfinish = () => clip.remove();

  // 3) square rings from the destination square
  [0, 130, 260].forEach((delay, i) =>
    spawn(
      {
        left: `${x - w * 0.5}px`,
        top: `${y - w * 0.5}px`,
        width: `${w}px`,
        height: `${w}px`,
        border: `${4 - i}px solid ${i === 1 ? "#b8f7ff" : "#3fdef3"}`,
        boxShadow: "0 0 18px rgba(63,222,243,.8)",
        opacity: 0,
      },
      [
        { transform: "scale(.5)", opacity: 0.95 },
        { transform: "scale(3.2)", opacity: 0 },
      ],
      { duration: 780, delay, easing: "cubic-bezier(.1,.7,.3,1)" },
    ),
  );

  // 4) sparkles
  for (let i = 0; i < 26; i++) {
    const plus = i % 3 === 0;
    particle(x, y, {
      size: plus ? Math.round(rnd(18, 30)) : Math.round(rnd(9, 15)),
      dist: w * rnd(1.6, 3.2),
      dur: rnd(700, 1150),
      gravity: rnd(10, 40),
      plus,
      spin: plus ? rnd(-180, 180) : rnd(-120, 120),
    });
  }

  // 5) floating label
  const label = spawn(
    {
      left: `${x}px`,
      top: `${y}px`,
      fontFamily: 'var(--font-pixel, "Tiny5 Duo", monospace)',
      fontSize: `${Math.max(16, Math.round(w * 0.42))}px`,
      letterSpacing: "2px",
      whiteSpace: "nowrap",
      color: "#b8f7ff",
      textShadow:
        "0 0 12px #3fdef3, 0 0 26px #3fdef3, 2px 2px 0 #04323b, -2px 2px 0 #04323b, 2px -2px 0 #04323b, -2px -2px 0 #04323b",
    },
    [
      { transform: "translate(-50%, -20%) scale(.4)", opacity: 0 },
      {
        transform: "translate(-50%, -120%) scale(1.25)",
        opacity: 1,
        offset: 0.22,
      },
      { transform: "translate(-50%, -160%) scale(1)", opacity: 1, offset: 0.7 },
      { transform: "translate(-50%, -230%) scale(1)", opacity: 0 },
    ],
    { duration: 1500, easing: "ease-out" },
  );
  label.textContent = "BRILLIANT";

  // 6) pop the badge on the square
  const badge = squareEl?.querySelector?.(".move-badge");
  badge?.animate(
    [
      { transform: "scale(.3)", filter: "brightness(2)" },
      {
        transform: "scale(1.9)",
        filter: "brightness(1.6) drop-shadow(0 0 8px #3fdef3)",
        offset: 0.4,
      },
      { transform: "scale(1)", filter: "none" },
    ],
    { duration: 650, easing: "cubic-bezier(.2,.9,.3,1.3)" },
  );
}

// Which square just received a piece on this board (the highlighted last move
// square that holds a piece).
export function lastMoveTarget(boardEl) {
  if (!boardEl) return null;
  const squares = boardEl.querySelectorAll(".last-move");
  for (const sq of squares) if (sq.querySelector(".piece")) return sq;
  return null;
}

export function visibleBoard() {
  return (
    [...document.querySelectorAll(".board")].find(
      (b) => b.offsetParent !== null && b.getBoundingClientRect().width > 0,
    ) || null
  );
}
