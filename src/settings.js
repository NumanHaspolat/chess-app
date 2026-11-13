import { createPieceEl } from "./pieces.js";

// Ayarlar, temalar, ses ve terfi seçimi. settings nesnesi yerinde değiştirilir.
export const SOUNDS = {
  move: new Audio("./assets/audio/move.wav"),
  capture: new Audio("./assets/audio/capture.wav"),
  check: new Audio("./assets/audio/check.wav"),
  castle: new Audio("./assets/audio/castle.wav"),
  promote: new Audio("./assets/audio/promote.wav"),
  gameover: new Audio("./assets/audio/gameover.wav"),
  brilliant: new Audio("./assets/audio/brilliant-sound.wav"),
};

// Eksik ses dosyası olursa (örn. capture.wav) move.wav'a düş.
// brilliant-sound için .wav bulunamazsa sırayla .mp3 ve .ogg denenir.
const SOUND_FALLBACK_EXT = { brilliant: [".mp3", ".ogg"] };
for (const [name, audio] of Object.entries(SOUNDS)) {
  if (name === "move") continue;
  const alternatives = [...(SOUND_FALLBACK_EXT[name] || [])];
  audio.addEventListener("error", () => {
    const next = alternatives.shift();
    if (next) {
      audio.src = audio.src.replace(/\.[a-z0-9]+$/i, next);
      audio.load();
    } else {
      SOUNDS[name] = SOUNDS.move;
    }
  });
}

export const ENGINE_DEPTH_DEFAULT = 13;
export const REVIEW_DEPTH_DEFAULT = 14; // yüksek = daha doğru ama daha yavaş
export const reviewDepth = () => settings.reviewDepth || REVIEW_DEPTH_DEFAULT;

// ---------- Ayarlar (ses) ----------
export const SETTINGS_KEY = "azurite-settings";

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return {
      volume:
        typeof saved.volume === "number"
          ? Math.min(1, Math.max(0, saved.volume))
          : 0.8,
      muted: !!saved.muted,
      theme: typeof saved.theme === "string" ? saved.theme : "azurite",
      board: typeof saved.board === "string" ? saved.board : "teal",
      customAccent:
        typeof saved.customAccent === "string" ? saved.customAccent : null,
      customLight:
        typeof saved.customLight === "string" ? saved.customLight : null,
      customDark:
        typeof saved.customDark === "string" ? saved.customDark : null,
      reviewDepth: [12, 14, 16, 18].includes(saved.reviewDepth)
        ? saved.reviewDepth
        : 14,
      liveDepth: [10, 13, 16, 18].includes(saved.liveDepth)
        ? saved.liveDepth
        : 13,
      animSpeed: ["off", "fast", "normal", "slow"].includes(saved.animSpeed)
        ? saved.animSpeed
        : "normal",
      showCoords: saved.showCoords !== false,
      showLegalDots: saved.showLegalDots !== false,
      showLastMove: saved.showLastMove !== false,
      defaultPuzzleLevel:
        typeof saved.defaultPuzzleLevel === "string"
          ? saved.defaultPuzzleLevel
          : "medium",
      autoNextPuzzle: !!saved.autoNextPuzzle,
      promotionAsk: !!saved.promotionAsk,
      smartReview: saved.smartReview !== false,
      arrowColor: [
        "theme",
        "green",
        "blue",
        "red",
        "yellow",
        "orange",
        "custom",
      ].includes(saved.arrowColor)
        ? saved.arrowColor
        : "theme",
      arrowCustom:
        typeof saved.arrowCustom === "string" &&
        /^#[0-9a-f]{6}$/i.test(saved.arrowCustom)
          ? saved.arrowCustom
          : "#2dc0d4",
    };
  } catch {
    return {
      volume: 0.8,
      muted: false,
      theme: "azurite",
      board: "teal",
      customAccent: null,
      customLight: null,
      customDark: null,
      reviewDepth: 14,
      liveDepth: 13,
      animSpeed: "normal",
      showCoords: true,
      showLegalDots: true,
      showLastMove: true,
      defaultPuzzleLevel: "medium",
      autoNextPuzzle: false,
      promotionAsk: false,
      smartReview: true,
      arrowColor: "theme",
      arrowCustom: "#2dc0d4",
    };
  }
}

export const settings = loadSettings();

// ---------- Görünüm: renk temaları ----------
export const THEMES = {
  azurite: {
    name: "Azurite",
    vars: {
      "--bg": "#0a1b22",
      "--bg-glow": "#12404a",
      "--panel": "#0f2a33",
      "--panel-border": "#1b4652",
      "--control": "#17414d",
      "--control-hover": "#1f5565",
      "--text": "#d6eeee",
      "--text-muted": "#7fa9ae",
      "--accent": "rgb(45, 192, 212)",
      "--accent-strong": "#3fdef3",
    },
  },
  midnight: {
    name: "Midnight",
    vars: {
      "--bg": "#0b0f1f",
      "--bg-glow": "#1c2450",
      "--panel": "#12172e",
      "--panel-border": "#252d57",
      "--control": "#1b2244",
      "--control-hover": "#262f5c",
      "--text": "#e1e5f7",
      "--text-muted": "#8d96c4",
      "--accent": "rgb(129, 140, 248)",
      "--accent-strong": "#a5b4fc",
    },
  },
  forest: {
    name: "Forest",
    vars: {
      "--bg": "#0b1a12",
      "--bg-glow": "#16402a",
      "--panel": "#102a1d",
      "--panel-border": "#1f4a33",
      "--control": "#184230",
      "--control-hover": "#215a40",
      "--text": "#dcefe3",
      "--text-muted": "#86ae95",
      "--accent": "rgb(74, 200, 120)",
      "--accent-strong": "#6ee79b",
    },
  },
  ember: {
    name: "Ember",
    vars: {
      "--bg": "#1a0f0b",
      "--bg-glow": "#4a2312",
      "--panel": "#2a1710",
      "--panel-border": "#4f2d1f",
      "--control": "#40241a",
      "--control-hover": "#58321f",
      "--text": "#f3e4da",
      "--text-muted": "#b0907d",
      "--accent": "rgb(240, 140, 60)",
      "--accent-strong": "#ffab5e",
    },
  },
  rose: {
    name: "Rose",
    vars: {
      "--bg": "#1a0b14",
      "--bg-glow": "#4a1236",
      "--panel": "#2a1020",
      "--panel-border": "#4f1f3d",
      "--control": "#401a32",
      "--control-hover": "#58223f",
      "--text": "#f4dfeb",
      "--text-muted": "#b07d99",
      "--accent": "rgb(236, 92, 160)",
      "--accent-strong": "#ff7fbd",
    },
  },
  graphite: {
    name: "Graphite",
    vars: {
      "--bg": "#0f1113",
      "--bg-glow": "#262a30",
      "--panel": "#171a1e",
      "--panel-border": "#2c3138",
      "--control": "#22262c",
      "--control-hover": "#2d323a",
      "--text": "#e6e8eb",
      "--text-muted": "#8f959d",
      "--accent": "rgb(170, 180, 195)",
      "--accent-strong": "#d2dae6",
    },
  },
};

export const BOARD_THEMES = {
  teal: { name: "Azurite", light: "#bfdee3", dark: "#348aa0" },
  green: { name: "Green", light: "#eeeed2", dark: "#769656" },
  wood: { name: "Wood", light: "#f0d9b5", dark: "#b58863" },
  ice: { name: "Ice", light: "#dee3e6", dark: "#8ca2ad" },
  purple: { name: "Purple", light: "#e5dcf0", dark: "#8a6fb0" },
  mono: { name: "Mono", light: "#d9d9d9", dark: "#7a7a7a" },
};

export function lightenHex(hex, amount = 0.3) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function currentBoardColors() {
  if (
    settings.board === "custom" &&
    settings.customLight &&
    settings.customDark
  ) {
    return { light: settings.customLight, dark: settings.customDark };
  }
  return BOARD_THEMES[settings.board] || BOARD_THEMES.teal;
}

export function applyAppearance() {
  const root = document.documentElement;
  const theme = THEMES[settings.theme] || THEMES.azurite;

  for (const [name, value] of Object.entries(theme.vars)) {
    root.style.setProperty(name, value);
  }

  if (settings.customAccent) {
    root.style.setProperty("--accent", settings.customAccent);
    root.style.setProperty(
      "--accent-strong",
      lightenHex(settings.customAccent, 0.3),
    );
  }

  const board = currentBoardColors();
  root.style.setProperty("--light", board.light);
  root.style.setProperty("--dark", board.dark);

  // Ok rengi: tema vurgusu ya da seçilen renk; Shift/Ctrl ile çizilen oklar sabit yardımcı renkler
  const ARROW_PRESETS = {
    green: "#4cc46a",
    blue: "#4a90e2",
    red: "#ee5d5d",
    yellow: "#f5c542",
    orange: "#f08a3c",
  };
  const arrowMain =
    settings.arrowColor === "theme"
      ? "var(--accent)"
      : settings.arrowColor === "custom"
        ? settings.arrowCustom
        : ARROW_PRESETS[settings.arrowColor];
  root.style.setProperty("--arrow-color", arrowMain);
  root.style.setProperty("--arrow-alt1", "#ee5d5d");
  root.style.setProperty("--arrow-alt2", "#4a90e2");
  root.style.setProperty("--arrow-alt3", "#f5c542");

  document.body?.classList.toggle("hide-coords", !settings.showCoords);
  document.body?.classList.toggle("hide-legal-dots", !settings.showLegalDots);
  document.body?.classList.toggle("hide-last-move", !settings.showLastMove);
}

// Animasyon hızı (ms). 0 = kapalı
export function animMs() {
  return (
    { off: 0, fast: 90, normal: 180, slow: 320 }[settings.animSpeed] ?? 180
  );
}
export function animTransition() {
  const ms = animMs();
  return ms === 0 ? "none" : `transform ${ms}ms ease`;
}

// Terfi seçimi: ayar açıksa küçük bir seçim penceresi gösterir, değilse vezir
export function isPromotionMove(chessObj, from, to) {
  const p = chessObj.get(from);
  if (!p || p.type !== "p") return false;
  return (
    (p.color === "w" && to[1] === "8") || (p.color === "b" && to[1] === "1")
  );
}
export function askPromotion(color) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "promo-overlay";
    const box = document.createElement("div");
    box.className = "promo-box";
    const names = { q: "Queen", r: "Rook", b: "Bishop", n: "Knight" };
    for (const t of ["q", "r", "b", "n"]) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "promo-piece";
      btn.setAttribute("aria-label", names[t]);
      btn.title = names[t];
      // Sitedeki kendi taş görselleri
      const pieceEl = createPieceEl(color, t);
      pieceEl.classList.remove("dragging");
      btn.appendChild(pieceEl);
      btn.addEventListener("click", () => {
        overlay.remove();
        resolve(t);
      });
      box.appendChild(btn);
    }
    overlay.appendChild(box);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(null);
      }
    });
    document.body.appendChild(overlay);
  });
}
export async function pickPromotion(chessObj, from, to) {
  if (!settings.promotionAsk || !isPromotionMove(chessObj, from, to))
    return "q";
  return askPromotion(chessObj.get(from).color);
}

applyAppearance();

export function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function effectiveVolume() {
  return settings.muted ? 0 : settings.volume;
}

export function playSound(name, speed = 1) {
  const sound = SOUNDS[name];
  if (!sound) return;
  sound.volume = effectiveVolume();

  sound.pause();
  sound.currentTime = 0;
  sound.playbackRate = speed;

  sound.play().catch(() => {});
}
