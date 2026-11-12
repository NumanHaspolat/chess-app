import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.0.0/+esm";
import { createPieceEl, preloadPieces } from "./src/pieces.js";
import { Repertoire } from "./src/repertoire.js";
import { Library } from "./src/library.js";
import { judgeMove, pickReply, lineEnded, parseUci } from "./src/drill.js";
import { importPgn } from "./src/pgn.js";
import { splitGames } from "./src/pgn.js";
import { OpeningBook } from "./src/openings.js";
import { loadOpening } from "./src/opening-trainer.js";

const game = new Chess();
const repertoireGame = new Chess();
const drillGame = new Chess();

let repOrientation = "w";
let repSelectedSquare = null;
let repLegalMoves = [];
let repViewPly = null; // the real game (always the full move history)

preloadPieces();

const FILES = "abcdefgh";
const DRAG_THRESHOLD = 4; // pixels before a press becomes a drag
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const DISPLAY_ORDER = ["q", "r", "b", "n", "p"];

const SOUNDS = {
  move: new Audio("./assets/audio/move.wav"),
  capture: new Audio("./assets/audio/capture.wav"),
  check: new Audio("./assets/audio/check.wav"),
  castle: new Audio("./assets/audio/castle.wav"),
  promote: new Audio("./assets/audio/promote.wav"),
  gameover: new Audio("./assets/audio/gameover.wav"),
};

// Eksik ses dosyası olursa (örn. capture.wav) move.wav'a düş
for (const [name, audio] of Object.entries(SOUNDS)) {
  if (name === "move") continue;
  audio.addEventListener("error", () => {
    SOUNDS[name] = SOUNDS.move;
  });
}

const boardEl = document.getElementById("board");
const analyseBoardEl = document.getElementById("analyse-board");
const analyseGame = new Chess();
let analyseOrientation = "w";
let analyseDrag = null;
let analyseHoverSquare = null;

const ANALYSE_DRAG_THRESHOLD = 6;
const statusEl = document.getElementById("status");
const repEvaluationBarEl = document.getElementById("rep-evaluation-bar");
const repEvaluationWhiteEl = document.getElementById("rep-evaluation-white");
const repEvaluationBlackEl = document.getElementById("rep-evaluation-black");
const repEvaluationScoreEl = document.getElementById("rep-evaluation-score");
const evaluationBarEl = document.getElementById("evaluation-bar");
const evaluationWhiteEl = document.getElementById("evaluation-white");
const evaluationBlackEl = document.getElementById("evaluation-black");
const evaluationScoreEl = document.getElementById("evaluation-score");
const movesEl = document.getElementById("moves");
const analysisPanel = document.getElementById("analysis-panel");
const analysisStatusEl = document.getElementById("analysis-status");
const analysisLinesEl = document.getElementById("analysis-lines");
const analyseAnalysisLinesEl = document.getElementById(
  "analyse-analysis-lines",
);

const analyseAnalysisStatusEl = document.getElementById(
  "analyse-analysis-status",
);
const stripTopEl = document.getElementById("strip-top");
const stripBottomEl = document.getElementById("strip-bottom");
const repStripTopEl = document.getElementById("rep-strip-top");
const repStripBottomEl = document.getElementById("rep-strip-bottom");
const openingEl = document.getElementById("opening");
const pgnFileEl = document.getElementById("pgn-file");
const importRepBtnEl = document.getElementById("btn-import-rep");
const analysePgnFileEl = document.getElementById("pgn-upload");
const analyseGamesListEl = document.getElementById("analyse-games-list");
const analyseGamesStatusEl = document.getElementById("analyse-games-status");
const drillBtnEl = document.getElementById("btn-drill");
const drillActionEl = document.getElementById("btn-drill-action");
const undoBtnEl = document.getElementById("btn-undo");
const repInfoEl = document.getElementById("rep-info");
const repNoticeEl = document.getElementById("rep-notice");
const repTurnEl = document.getElementById("rep-turn");
const repCommentEl = document.getElementById("rep-comment");
const drillCompleteOverlay = document.getElementById("drill-complete-overlay");
const drillCompleteStats = document.getElementById("drill-complete-stats");
const drillContinueBtn = document.getElementById("btn-drill-continue");
const drillStopBtn = document.getElementById("btn-drill-stop");
const repBoardEl = document.getElementById("rep-board");
const repMovesEl = document.getElementById("rep-moves");
const repStatusEl = document.getElementById("rep-move-status");
const repBackBtn = document.getElementById("rep-back");
const repNextEl = document.getElementById("rep-next-info");
const repOpeningEl = document.getElementById("rep-opening");
const repResetBtn = document.getElementById("rep-reset");
const repFlipBtn = document.getElementById("rep-flip");
const learnCompleteStats = document.getElementById("learn-complete-stats");
const puzzleBoardEl = document.getElementById("puzzle-board");
const puzzleMovesEl = document.getElementById("puzzle-moves");
const puzzleStatusEl = document.getElementById("puzzle-status");
const puzzleRatingEl = document.getElementById("puzzle-rating");
const puzzleHistoryGrid = document.getElementById("puzzle-history-grid");

const puzzleGame = new Chess();

let orientation = "w";
let selectedSquare = null;
let legalMoves = [];
let drillHintSquares = [];

let drag = null;
let hoverSquare = null;
let repSuppressClick = false;
let repDrag = null;
let repHoverSquare = null;
let drillMistakeTimer = null;
let drillCompleteTimer = null;
let learnCompleteTimer = null;
let viewPly = null;
let view = game;
let learnHintMove = null;
let trainMode = false;
let trainHintShown = false;
let trainHintSquares = [];
let trainMistakeTimer = null;
let trainOpponentTimer = null;
let trainPhase = "your-move";
let trainMistakeCount = 0;
let trainCorrectMoves = 0;
let trainTotalMistakes = 0;
let trainCorrectSquares = [];
let trainCorrectTimer = null;
let openingFilter = "all";
let analysisFen = null;
let analyseGames = [];
let analyseHistory = [];
let analyseSelectedSquare = null;
let analyseLegalMoves = [];
let analyseCurrentPly = 0;

let currentPuzzle = null;
let puzzlePlayerColor = "w";
let puzzleOrientation = "w";
let puzzleSolutionIndex = 0;
let puzzleHintStep = 0;
let puzzleSelectedSquare = null;
let puzzleLegalMoves = [];
let puzzleDrag = null;
let puzzleHoverSquare = null;
let puzzleHintUsedInCurrent = false;
let puzzleViewPly = null;
let puzzleHistoryList = [];

let puzzleRating = Number(
  localStorage.getItem("azurite-puzzle-rating") || 1500,
);
let puzzleHistory = JSON.parse(
  localStorage.getItem("azurite-puzzle-history") || "[]",
);

function formatAnalysisLine(line) {
  const analysisGame = new Chess(line.fen || analysisFen);
  const sanMoves = [];

  for (const uci of line.pv.slice(0, 4)) {
    try {
      const move = analysisGame.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci[4] || "q",
      });

      if (!move) break;

      sanMoves.push(move.san);
    } catch {
      break;
    }
  }

  return {
    score: line.scoreText,
    firstMove: sanMoves[0] || "—",
    continuation: sanMoves.slice(1).join(" "),
    uci: line.pv[0],
  };
}

function renderAnalysisLines(lines) {
  analysisLinesEl.innerHTML = "";

  if (!lines.length) {
    analysisStatusEl.textContent = "Analyzing...";
    analysisLinesEl.textContent = "Waiting for engine evaluation...";
    return;
  }

  analysisStatusEl.textContent = `Stockfish · Depth ${Math.max(...lines.map((line) => line.depth))}`;

  lines.forEach((line, index) => {
    const formatted = formatAnalysisLine(line);

    const row = document.createElement("button");
    row.type = "button";
    row.className = "analysis-line";
    row.title = "Play this first move";

    const rank = document.createElement("span");
    rank.className = "analysis-rank";
    rank.textContent = `#${index + 1}`;

    const score = document.createElement("strong");
    score.className = "analysis-score";
    score.textContent = formatted.score || "—";

    const move = document.createElement("strong");
    move.className = "analysis-best-move";
    move.textContent = formatted.firstMove;

    const continuation = document.createElement("span");
    continuation.className = "analysis-continuation";
    continuation.textContent = formatted.continuation;

    row.append(rank, score, move, continuation);

    row.addEventListener("click", () => {
      if (!formatted.uci || lesson || trainMode || drill) return;

      const from = formatted.uci.slice(0, 2);
      const to = formatted.uci.slice(2, 4);
      const promotion = formatted.uci[4] || "q";

      playMove(from, to, promotion, false, true);
    });

    analysisLinesEl.appendChild(row);
  });
}

function renderAnalyseAnalysisLines(lines) {
  if (!analyseAnalysisLinesEl) return;

  analyseAnalysisLinesEl.innerHTML = "";

  if (!lines.length) {
    if (analyseAnalysisStatusEl) {
      analyseAnalysisStatusEl.textContent = "Analyzing...";
    }
    return;
  }

  if (analyseAnalysisStatusEl) {
    analyseAnalysisStatusEl.textContent = `Stockfish · Depth ${Math.max(...lines.map((line) => line.depth))}`;
  }

  lines.forEach((line, index) => {
    const formatted = formatAnalysisLine(line);

    const row = document.createElement("button");
    row.type = "button";
    row.className = "analysis-line";
    row.title = "Play this first move";

    const rank = document.createElement("span");
    rank.className = "analysis-rank";
    rank.textContent = `#${index + 1}`;

    const score = document.createElement("strong");
    score.className = "analysis-score";
    score.textContent = formatted.score || "—";

    const move = document.createElement("strong");
    move.className = "analysis-best-move";
    move.textContent = formatted.firstMove;

    const continuation = document.createElement("span");
    continuation.className = "analysis-continuation";
    continuation.textContent = formatted.continuation;

    row.append(rank, score, move, continuation);

    row.addEventListener("click", () => {
      if (!formatted.uci) return;

      const from = formatted.uci.slice(0, 2);
      const to = formatted.uci.slice(2, 4);
      const promotion = formatted.uci[4] || "q";

      makeAnalyseMove(from, to, promotion);
    });

    analyseAnalysisLinesEl.appendChild(row);
  });
}

let favoriteOpenings = new Set(
  JSON.parse(localStorage.getItem("azurite-favorites") || "[]"),
);

// ---------- Ayarlar (ses) ----------
const SETTINGS_KEY = "azurite-settings";

function loadSettings() {
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
    };
  }
}

let settings = loadSettings();

// ---------- Görünüm: renk temaları ----------
const THEMES = {
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

const BOARD_THEMES = {
  teal: { name: "Azurite", light: "#bfdee3", dark: "#348aa0" },
  green: { name: "Green", light: "#eeeed2", dark: "#769656" },
  wood: { name: "Wood", light: "#f0d9b5", dark: "#b58863" },
  ice: { name: "Ice", light: "#dee3e6", dark: "#8ca2ad" },
  purple: { name: "Purple", light: "#e5dcf0", dark: "#8a6fb0" },
  mono: { name: "Mono", light: "#d9d9d9", dark: "#7a7a7a" },
};

function lightenHex(hex, amount = 0.3) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function currentBoardColors() {
  if (
    settings.board === "custom" &&
    settings.customLight &&
    settings.customDark
  ) {
    return { light: settings.customLight, dark: settings.customDark };
  }
  return BOARD_THEMES[settings.board] || BOARD_THEMES.teal;
}

function applyAppearance() {
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

  document.body?.classList.toggle("hide-coords", !settings.showCoords);
  document.body?.classList.toggle("hide-legal-dots", !settings.showLegalDots);
  document.body?.classList.toggle("hide-last-move", !settings.showLastMove);
}

// Animasyon hızı (ms). 0 = kapalı
function animMs() {
  return (
    { off: 0, fast: 90, normal: 180, slow: 320 }[settings.animSpeed] ?? 180
  );
}
function animTransition() {
  const ms = animMs();
  return ms === 0 ? "none" : `transform ${ms}ms ease`;
}

// Terfi seçimi: ayar açıksa küçük bir seçim penceresi gösterir, değilse vezir
function isPromotionMove(chessObj, from, to) {
  const p = chessObj.get(from);
  if (!p || p.type !== "p") return false;
  return (
    (p.color === "w" && to[1] === "8") || (p.color === "b" && to[1] === "1")
  );
}
function askPromotion(color) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "promo-overlay";
    const box = document.createElement("div");
    box.className = "promo-box";
    const glyph = { q: "♛", r: "♜", b: "♝", n: "♞" };
    for (const t of ["q", "r", "b", "n"]) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = glyph[t];
      btn.setAttribute("aria-label", t);
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
async function pickPromotion(chessObj, from, to) {
  if (!settings.promotionAsk || !isPromotionMove(chessObj, from, to))
    return "q";
  return askPromotion(chessObj.get(from).color);
}

applyAppearance();

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

function effectiveVolume() {
  return settings.muted ? 0 : settings.volume;
}

function playSound(name, speed = 1) {
  const sound = SOUNDS[name];
  if (!sound) return;
  sound.volume = effectiveVolume();

  sound.pause();
  sound.currentTime = 0;
  sound.playbackRate = speed;

  sound.play().catch(() => {});
}

function renderDrillCompleteOverlay() {
  if (!drillCompleteOverlay) return;

  const completed = !!drill && drill.phase === "complete";
  drillCompleteOverlay.hidden = !completed;

  if (completed) {
    const correct = drill.correctMoves ?? 0;
    const mistakes = drill.mistakes ?? 0;
    const total = correct + mistakes;
    const accuracy =
      total > 0
        ? Math.max(0, Math.min(100, Math.round((correct / total) * 100)))
        : 100;

    drillCompleteStats.innerHTML = `
      <div class="analyse-accuracy" style="margin-bottom: 5px;">
        <strong style="font-size: 1.4rem; color: var(--accent);">${accuracy}%</strong>
        <span>Drill Accuracy</span>
      </div>
      <div style="display: flex; justify-content: space-around; gap: 10px; font-size: 0.85rem; color: var(--text-muted);">
        <div>Correct: <strong style="color: #7fd35a;">${correct}</strong></div>
        <div>Mistakes: <strong style="color: #ca3431;">${mistakes}</strong></div>
      </div>
    `;
  }
}

function renderLearnTrainCompleteStats() {
  if (!learnCompleteStats) return;

  const correct = trainCorrectMoves;
  const mistakes = trainTotalMistakes;
  const total = correct + mistakes;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;

  learnCompleteStats.innerHTML = `
    Accuracy: <span class="drill-accuracy">${accuracy}%</span>
    · Mistakes: <span class="drill-mistakes">${mistakes}</span>
  `;
}

let promoteSoundTimer = null;

export function playPromoteSound() {
  clearTimeout(promoteSoundTimer);

  promoteSoundTimer = setTimeout(() => {
    const audio = new Audio("./assets/audio/promote.wav");
    audio.volume = 0.6 * effectiveVolume();

    audio.play().catch((error) => {
      console.warn("Promote sound could not play:", error);
    });
  }, 500);
}

function squareName(row, col) {
  if (orientation === "w") {
    return FILES[col] + (8 - row);
  }
  return FILES[7 - col] + (row + 1);
}

function squareFromPoint(x, y) {
  const rect = boardEl.getBoundingClientRect();
  const size = rect.width / 8;
  const col = Math.floor((x - rect.left) / size);
  const row = Math.floor((y - rect.top) / size);
  if (col < 0 || col > 7 || row < 0 || row > 7) return null;
  return squareName(row, col);
}

function repSquareFromPoint(x, y) {
  const rect = repBoardEl.getBoundingClientRect();
  const size = rect.width / 8;
  const col = Math.floor((x - rect.left) / size);
  const row = Math.floor((y - rect.top) / size);

  if (col < 0 || col > 7 || row < 0 || row > 7) return null;

  return repOrientation === "w"
    ? FILES[col] + (8 - row)
    : FILES[7 - col] + (row + 1);
}

function findKingSquare(color) {
  const king = view
    .board()
    .flat()
    .find((p) => p && p.type === "k" && p.color === color);
  return king ? king.square : null;
}

let lastRepRenderSig = null;
let drillAnimateNext = false; // rakip hamlesi gibi sistem hamleleri için animasyon isteği

function renderRepertoireBoard(animate = true) {
  if (!repBoardEl) return;

  const displayGame = drill ? drillGame : syncRepView();
  const history = displayGame.history({ verbose: true });
  const lastMove = history[history.length - 1];

  // Aynı pozisyon zaten çizildiyse (ve animasyon istenmiyorsa) tahtayı yeniden kurma:
  // devam eden taş animasyonu silinmesin.
  const renderSig = [
    displayGame.fen(),
    lastMove ? lastMove.from + lastMove.to : "",
    repSelectedSquare,
    repLegalMoves.map((m) => m.to).join(","),
    drillHintSquares.join(","),
    repOrientation,
  ].join("|");
  if (
    !animate &&
    renderSig === lastRepRenderSig &&
    repBoardEl.children.length
  ) {
    return;
  }
  lastRepRenderSig = renderSig;

  const animMove =
    typeof animate === "object" && animate !== null
      ? animate
      : animate
        ? lastMove
        : null;

  let oldPieceRect = null;

  if (animMove && animMove.from) {
    const oldPiece = repBoardEl.querySelector(
      `[data-square="${animMove.from}"] .piece`,
    );
    if (oldPiece) {
      oldPieceRect = oldPiece.getBoundingClientRect();
    }
  }

  repBoardEl.innerHTML = "";

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const squareName =
        repOrientation === "w"
          ? FILES[col] + (8 - row)
          : FILES[7 - col] + (row + 1);

      const fileIndex = FILES.indexOf(squareName[0]);
      const rankNumber = Number(squareName[1]);

      const square = document.createElement("div");
      square.className =
        "square " + ((fileIndex + rankNumber) % 2 === 0 ? "light" : "dark");
      square.dataset.square = squareName;

      if (drillHintSquares.includes(squareName)) {
        square.classList.add("drill-hint");
      }

      if (repSelectedSquare === squareName) {
        square.classList.add("selected");
      }

      const playedLastMove = displayGame.history({ verbose: true }).at(-1);
      if (
        playedLastMove &&
        (playedLastMove.from === squareName || playedLastMove.to === squareName)
      ) {
        square.classList.add("last-move");
      }

      const legalMove = repLegalMoves.find((move) => move.to === squareName);
      if (legalMove) {
        square.classList.add("legal");
        if (legalMove.captured) square.classList.add("capture");
      }

      const piece = displayGame.get(squareName);
      if (piece) {
        square.appendChild(createPieceEl(piece.color, piece.type));
      }

      if (col === 0) addCoord(square, "rank", squareName[1]);
      if (row === 7) addCoord(square, "file", squareName[0]);

      repBoardEl.appendChild(square);
    }
  }

  if (animMove && oldPieceRect && animMove.to) {
    const toSquare = repBoardEl.querySelector(`[data-square="${animMove.to}"]`);
    const newPiece = toSquare?.querySelector(".piece");

    if (newPiece) {
      const newRect = newPiece.getBoundingClientRect();
      const deltaX = oldPieceRect.left - newRect.left;
      const deltaY = oldPieceRect.top - newRect.top;

      newPiece.style.transition = "none";
      newPiece.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      newPiece.offsetHeight;

      requestAnimationFrame(() => {
        newPiece.style.transition = animTransition();
        newPiece.style.transform = "translate(0, 0)";
      });
    }
  }
}

function renderRepertoireMoves() {
  if (!repMovesEl) return;
  const scrollTop = repMovesEl.scrollTop;

  const currentGame = drill ? drillGame : repertoireGame;
  const history = currentGame.history();
  const activePly = drill ? history.length : (repViewPly ?? history.length);

  repMovesEl.innerHTML = "";

  for (let i = 0; i < history.length; i += 2) {
    const li = document.createElement("li");

    const white = document.createElement("span");
    white.className = "move" + (i + 1 === activePly ? " active" : "");
    white.dataset.ply = i + 1;
    white.textContent = history[i];
    li.appendChild(white);

    if (history[i + 1]) {
      const black = document.createElement("span");
      black.className = "move" + (i + 2 === activePly ? " active" : "");
      black.dataset.ply = i + 2;
      black.textContent = history[i + 1];
      li.appendChild(black);
    }

    repMovesEl.appendChild(li);
  }

  repMovesEl.scrollTop = scrollTop;

  const activeEl = repMovesEl.querySelector(".move.active");
  if (activeEl) {
    const containerTop = repMovesEl.scrollTop;
    const containerBottom = containerTop + repMovesEl.clientHeight;
    const elemTop = activeEl.offsetTop - repMovesEl.offsetTop;

    if (elemTop < containerTop || elemTop > containerBottom) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }
}

function endAnalyseDrag(e, cancelled = false) {
  if (!analyseDrag) return;

  const { from, moved, wasSelected, ghost } = analyseDrag;
  if (ghost) ghost.remove();

  setAnalyseHover(analyseHoverSquare, false);
  analyseHoverSquare = null;
  analyseDrag = null;

  if (!moved) {
    if (wasSelected) clearAnalyseSelection();
    renderAnalyseBoard();
    return;
  }

  const target = cancelled
    ? null
    : analyseSquareFromPoint(e.clientX, e.clientY);

  if (target && analyseLegalMoves.some((move) => move.to === target)) {
    pickPromotion(analyseGame, from, target).then((p) => {
      if (p) makeAnalyseMove(from, target, p, false);
      else renderAnalyseBoard();
    });
    return;
  }

  if (target !== from) clearAnalyseSelection();
  renderAnalyseBoard();
}

function updateRepertoireBoard(animate = true) {
  renderRepertoireBoard(animate);
  renderRepertoireMoves();

  const displayGame = drill ? drillGame : syncRepView();

  if (repStatusEl) {
    repStatusEl.textContent =
      displayGame.turn() === "w" ? "White to move" : "Black to move";
  }

  renderRepertoireStrips(displayGame);
  renderRepertoireOpening(displayGame);
  requestEngineEvaluation(displayGame.fen(), "repertoire");
}

function updateRepertoirePage(animate = true) {
  updateRepertoireBoard(animate);
  renderRepertoire();
  renderRepLibrary();
}

repBoardEl?.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 || repDrag) return;
  if (drill && drill.phase !== "your-move") return;

  const name = repSquareFromPoint(e.clientX, e.clientY);
  if (!name) return;
  e.preventDefault();

  const currentGame = drill ? drillGame : repertoireGame;
  const piece = currentGame.get(name);

  if (repSelectedSquare) {
    const move = repLegalMoves.find((m) => m.to === name);
    if (move) {
      const played = currentGame.move({
        from: repSelectedSquare,
        to: name,
        promotion: "q",
      });

      if (played) {
        repSelectedSquare = null;
        repLegalMoves = [];
        repSuppressClick = true;

        playSound(played.captured ? "capture" : "move");
        updateRepertoirePage();

        if (drill) onDrillMove(played);
      }
      return;
    }
  }

  if (piece && piece.color === currentGame.turn()) {
    const wasSelected = repSelectedSquare === name;

    repSelectedSquare = name;
    repLegalMoves = currentGame.moves({ square: name, verbose: true });

    renderRepertoireBoard();

    repDrag = {
      from: name,
      piece,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      wasSelected,
      ghost: null,
      size: 0,
    };
  }
});

function endRepDrag(e, cancelled = false) {
  if (!repDrag) return;

  const currentDrag = repDrag;
  const target = repSquareFromPoint(e.clientX, e.clientY);

  if (currentDrag.ghost) currentDrag.ghost.remove();

  const origin = repBoardEl.querySelector(
    `[data-square="${currentDrag.from}"] .piece`,
  );
  if (origin) origin.classList.remove("dragging");

  setRepHover(repHoverSquare, false);
  repHoverSquare = null;
  repDrag = null;

  if (cancelled || !currentDrag.moved || !target) return;

  const move = repLegalMoves.find((m) => m.to === target);
  if (!move) {
    renderRepertoireBoard();
    return;
  }

  const currentGame = drill ? drillGame : repertoireGame;
  const played = currentGame.move({
    from: currentDrag.from,
    to: target,
    promotion: "q",
  });

  if (played) {
    repSelectedSquare = null;
    repLegalMoves = [];

    playSound(played.captured ? "capture" : "move");
    updateRepertoirePage(false);

    if (drill) onDrillMove(played);
  }
}

window.addEventListener("pointerup", (e) => endRepDrag(e));
window.addEventListener("pointercancel", (e) => endRepDrag(e, true));

window.addEventListener("pointermove", (e) => {
  if (!repDrag) return;

  if (!repDrag.moved) {
    const distance = Math.hypot(
      e.clientX - repDrag.startX,
      e.clientY - repDrag.startY,
    );
    if (distance < DRAG_THRESHOLD) return;
    startRepDrag();
  }

  moveRepGhost(e.clientX, e.clientY);
  updateRepHover(repSquareFromPoint(e.clientX, e.clientY));
});

repBoardEl?.addEventListener("click", (event) => {
  if (repSuppressClick) {
    repSuppressClick = false;
    return;
  }
  if (repDrag) return;

  const square = event.target.closest(".square");
  if (!square) return;

  const name = square.dataset.square;
  const currentGame = drill ? drillGame : repertoireGame;
  const piece = currentGame.get(name);

  if (repSelectedSquare) {
    const move = repLegalMoves.find((m) => m.to === name);
    if (move) {
      const played = currentGame.move({
        from: repSelectedSquare,
        to: name,
        promotion: "q",
      });

      if (played) {
        playSound(played.captured ? "capture" : "move");
        repSelectedSquare = null;
        repLegalMoves = [];
        updateRepertoirePage();

        if (drill) onDrillMove(played);
        return;
      }
    }
  }

  if (piece && piece.color === currentGame.turn()) {
    repSelectedSquare = name;
    repLegalMoves = currentGame.moves({ square: name, verbose: true });
  } else {
    repSelectedSquare = null;
    repLegalMoves = [];
  }

  updateRepertoireBoard();
});

repBackBtn?.addEventListener("click", () => {
  repertoireGame.undo();
  repSelectedSquare = null;
  repLegalMoves = [];
  updateRepertoirePage(false);
});

repResetBtn?.addEventListener("click", () => {
  repertoireGame.reset();
  repViewPly = null;
  repSelectedSquare = null;
  repLegalMoves = [];
  updateRepertoirePage();
});

repMovesEl?.addEventListener("click", (e) => {
  const moveEl = e.target.closest(".move");
  if (!moveEl || drill) return;
  goToRepPlyAnimated(Number(moveEl.dataset.ply));
});

repFlipBtn?.addEventListener("click", () => {
  repOrientation = repOrientation === "w" ? "b" : "w";
  updateRepertoireBoard();
});

function syncRepView() {
  const moves = repertoireGame.history();
  const total = moves.length;

  if (repViewPly === null || repViewPly >= total) {
    repViewPly = null;
    return repertoireGame;
  }

  const view = new Chess();
  for (let i = 0; i < repViewPly; i++) {
    view.move(moves[i]);
  }
  return view;
}

function goToPly(ply) {
  const total = game.history().length;
  viewPly = Math.max(0, Math.min(ply, total));
  if (viewPly >= total) viewPly = null;

  selectedSquare = null;
  legalMoves = [];
  update(false);
}

let stockfishWorker = null;
let engineReady = false;
let engineBusy = false;
let engineStopping = false;

let pendingEngineFen = null;
let activeEngineFen = null;
let requestedEngineFen = null;
let analysisLinesByRank = new Map();

const ENGINE_DEPTH_DEFAULT = 13;
let requestedEvaluationTarget = "play";

function initStockfish() {
  try {
    stockfishWorker = new Worker(
      "./assets/stockfish/stockfish-19-lite-single.js",
    );

    stockfishWorker.onmessage = (event) => {
      const message = String(event.data).trim();

      if (message === "uciok") {
        stockfishWorker.postMessage("isready");
        return;
      }

      if (message === "readyok") {
        engineReady = true;
        if (pendingEngineFen) startEngineAnalysis(pendingEngineFen);
        return;
      }

      if (message.startsWith("info ")) {
        if (
          engineStopping ||
          !engineBusy ||
          activeEngineFen !== requestedEngineFen
        ) {
          return;
        }
        parseEngineInfo(message);
        return;
      }

      if (message.startsWith("bestmove")) {
        engineBusy = false;
        engineStopping = false;
        activeEngineFen = null;

        if (pendingEngineFen && engineReady) {
          startEngineAnalysis(pendingEngineFen);
        }
      }
    };

    stockfishWorker.onerror = (error) => {
      console.error("Stockfish error:", error);
      if (evaluationScoreEl) evaluationScoreEl.textContent = "Engine error";
    };

    stockfishWorker.postMessage("uci");
  } catch (error) {
    console.error("Could not start Stockfish:", error);
    if (evaluationScoreEl) evaluationScoreEl.textContent = "Engine unavailable";
  }
}

function requestEngineEvaluation(fen, target = "play") {
  if (!stockfishWorker) return;

  const targetChanged = target !== requestedEvaluationTarget;
  const fenChanged = fen !== requestedEngineFen;

  if (!fenChanged && !targetChanged) return;

  requestedEvaluationTarget = target;
  requestedEngineFen = fen;
  analysisFen = fen;
  analysisLinesByRank.clear();

  if (target === "analyse" && analyseAnalysisLinesEl) {
    analyseAnalysisLinesEl.innerHTML = "";
    if (analyseAnalysisStatusEl)
      analyseAnalysisStatusEl.textContent = "Analyzing 5 lines...";
  } else if (analysisLinesEl) {
    analysisLinesEl.innerHTML = "";
    if (analysisStatusEl) analysisStatusEl.textContent = "Analyzing 5 lines...";
  }

  pendingEngineFen = fen;
  if (!engineReady) return;

  if (engineBusy) {
    engineStopping = true;
    stockfishWorker.postMessage("stop");
    return;
  }

  startEngineAnalysis(fen);
}

function startEngineAnalysis(fen) {
  if (!stockfishWorker || !engineReady) return;

  pendingEngineFen = null;
  activeEngineFen = fen;
  engineBusy = true;
  engineStopping = false;
  analysisLinesByRank.clear();

  stockfishWorker.postMessage("setoption name MultiPV value 5");
  stockfishWorker.postMessage(`position fen ${fen}`);
  stockfishWorker.postMessage(
    `go depth ${settings.liveDepth || ENGINE_DEPTH_DEFAULT}`,
  );
}

function parseEngineInfo(message) {
  const depthMatch = message.match(/\bdepth (\d+)/);
  const depth = depthMatch ? Number(depthMatch[1]) : 0;

  if (depth < 1) return;
  if (/\b(lowerbound|upperbound)\b/.test(message)) return;
  if (!activeEngineFen || activeEngineFen !== requestedEngineFen) return;

  const multipvMatch = message.match(/\bmultipv (\d+)/);
  const multipv = multipvMatch ? Number(multipvMatch[1]) : 1;
  if (multipv < 1 || multipv > 5) return;

  const pvMatch = message.match(/\bpv (.+)$/);
  const cpMatch = message.match(/\bscore cp (-?\d+)/);
  const mateMatch = message.match(/\bscore mate (-?\d+)/);

  if (!pvMatch || (!cpMatch && !mateMatch)) return;

  const sideToMove = activeEngineFen.split(" ")[1];
  let score;
  let scoreText;
  let whiteScore;

  if (mateMatch) {
    score = Number(mateMatch[1]);
    if (sideToMove === "b") score = -score;
    whiteScore = score > 0 ? 1000 : -1000;
    scoreText = score > 0 ? `+M${score}` : `-M${Math.abs(score)}`;
  } else {
    score = Number(cpMatch[1]);
    if (sideToMove === "b") score = -score;
    whiteScore = score;
    const pawns = score / 100;
    scoreText = `${pawns > 0 ? "+" : ""}${pawns.toFixed(1)}`;
  }

  analysisLinesByRank.set(multipv, {
    fen: activeEngineFen,
    pv: pvMatch[1].trim().split(/\s+/).slice(0, 4),
    depth,
    score,
    scoreText,
  });

  const lines = [1, 2, 3, 4, 5]
    .map((rank) => analysisLinesByRank.get(rank))
    .filter(Boolean);

  if (requestedEvaluationTarget === "analyse") {
    renderAnalyseAnalysisLines(lines);
  } else {
    renderAnalysisLines(lines);
  }

  if (multipv === 1) {
    if (requestedEvaluationTarget === "repertoire") {
      renderRepertoireEvaluation(whiteScore, scoreText);
    } else if (requestedEvaluationTarget === "analyse") {
      renderAnalyseEvaluation(whiteScore, scoreText);
    } else {
      renderEvaluation(whiteScore, scoreText);
    }
  }
}

function renderEvaluation(whiteScore, scoreText) {
  let safePercent = 50;

  if (scoreText.includes("M")) {
    safePercent = scoreText.startsWith("+") ? 100 : 0;
  } else {
    const clamped = Math.max(-1000, Math.min(1000, whiteScore));
    const whitePercent = 100 / (1 + Math.exp(-clamped / 300));
    safePercent = Math.max(5, Math.min(95, whitePercent));
  }

  if (
    evaluationBarEl &&
    evaluationWhiteEl &&
    evaluationBlackEl &&
    evaluationScoreEl
  ) {
    evaluationWhiteEl.style.height = `${safePercent}%`;
    evaluationBlackEl.style.height = `${100 - safePercent}%`;
    evaluationBarEl.style.flexDirection =
      orientation === "w" ? "column-reverse" : "column";
    evaluationScoreEl.textContent = scoreText;
  }
}

function renderAnalyseEvaluation(whiteScore, scoreText) {
  const bar = document.getElementById("analyse-evaluation-bar");
  const white = document.getElementById("analyse-evaluation-white");
  const black = document.getElementById("analyse-evaluation-black");
  const score = document.getElementById("analyse-evaluation-score");

  if (!bar || !white || !black || !score) return;

  const clamped = Math.max(-1000, Math.min(1000, whiteScore));
  const whitePercent = 100 / (1 + Math.exp(-clamped / 300));
  const safePercent = Math.max(5, Math.min(95, whitePercent));

  white.style.height = `${safePercent}%`;
  black.style.height = `${100 - safePercent}%`;
  bar.style.flexDirection =
    analyseOrientation === "w" ? "column-reverse" : "column";
  score.textContent = scoreText;
}

function renderRepertoireEvaluation(whiteScore, scoreText) {
  const clamped = Math.max(-1000, Math.min(1000, whiteScore));
  const whitePercent = 100 / (1 + Math.exp(-clamped / 300));
  const safePercent = Math.max(5, Math.min(95, whitePercent));

  if (
    repEvaluationBarEl &&
    repEvaluationWhiteEl &&
    repEvaluationBlackEl &&
    repEvaluationScoreEl
  ) {
    repEvaluationWhiteEl.style.height = `${safePercent}%`;
    repEvaluationBlackEl.style.height = `${100 - safePercent}%`;
    repEvaluationBarEl.style.flexDirection =
      orientation === "w" ? "column-reverse" : "column";
    repEvaluationScoreEl.textContent = scoreText;
  }
}

function renderBoard(animate = true) {
  const history = view.history({ verbose: true });
  const lastMove = history[history.length - 1];

  const animMove =
    typeof animate === "object" && animate !== null
      ? animate
      : animate
        ? lastMove
        : null;

  let oldPieceRect = null;

  if (animMove && animMove.from) {
    const fromSquare = boardEl.querySelector(
      `[data-square="${animMove.from}"]`,
    );
    const oldPiece = fromSquare?.querySelector(".piece");
    if (oldPiece) oldPieceRect = oldPiece.getBoundingClientRect();
  }

  boardEl.innerHTML = "";

  const arrowLayer = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  arrowLayer.classList.add("learn-arrow-layer");
  arrowLayer.setAttribute("viewBox", "0 0 8 8");
  arrowLayer.setAttribute("preserveAspectRatio", "none");
  arrowLayer.setAttribute("aria-hidden", "true");

  const checkSquare = view.inCheck() ? findKingSquare(view.turn()) : null;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const name = squareName(row, col);
      const fileIndex = FILES.indexOf(name[0]);
      const rankNumber = Number(name[1]);

      const squareEl = document.createElement("div");
      squareEl.className =
        "square " + ((fileIndex + rankNumber) % 2 === 0 ? "light" : "dark");
      squareEl.dataset.square = name;

      if (drillHintSquares.includes(name)) squareEl.classList.add("drill-hint");
      if (trainMode && trainHintSquares.includes(name))
        squareEl.classList.add("drill-hint");

      if (learnHintMove) {
        if (name === learnHintMove.from) squareEl.classList.add("learn-from");
        if (name === learnHintMove.to) squareEl.classList.add("learn-to");
      }

      if (lastMove && (name === lastMove.from || name === lastMove.to)) {
        squareEl.classList.add("last-move");
      }

      if (trainMode && trainCorrectSquares.includes(name)) {
        squareEl.classList.add("train-correct");
      }

      if (name === selectedSquare) squareEl.classList.add("selected");
      if (name === checkSquare) squareEl.classList.add("check");

      const move = legalMoves.find((m) => m.to === name);
      if (move) {
        squareEl.classList.add("legal");
        if (move.captured) squareEl.classList.add("capture");
      }

      const piece = view.get(name);
      if (piece) squareEl.appendChild(createPieceEl(piece.color, piece.type));

      if (col === 0) addCoord(squareEl, "rank", name[1]);
      if (row === 7) addCoord(squareEl, "file", name[0]);

      boardEl.appendChild(squareEl);
    }
  }

  if (animMove && oldPieceRect && animMove.to) {
    const toSquare = boardEl.querySelector(`[data-square="${animMove.to}"]`);
    const newPiece = toSquare?.querySelector(".piece");

    if (newPiece) {
      const newRect = newPiece.getBoundingClientRect();
      const deltaX = oldPieceRect.left - newRect.left;
      const deltaY = oldPieceRect.top - newRect.top;

      newPiece.style.transition = "none";
      newPiece.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      newPiece.offsetHeight;

      requestAnimationFrame(() => {
        newPiece.style.transition = animTransition();
        newPiece.style.transform = "translate(0, 0)";
      });
    }
  }
}

function analyseSquareFromPoint(x, y) {
  const rect = analyseBoardEl.getBoundingClientRect();
  const size = rect.width / 8;
  const col = Math.floor((x - rect.left) / size);
  const row = Math.floor((y - rect.top) / size);

  if (col < 0 || col > 7 || row < 0 || row > 7) return null;

  return analyseOrientation === "w"
    ? FILES[col] + (8 - row)
    : FILES[7 - col] + (row + 1);
}

function clearAnalyseSelection() {
  analyseSelectedSquare = null;
  analyseLegalMoves = [];
}

function startAnalyseDrag() {
  analyseDrag.moved = true;
  const size = analyseBoardEl.getBoundingClientRect().width / 8;
  const ghost = createPieceEl(
    analyseDrag.piece.color,
    analyseDrag.piece.type,
    "drag-ghost",
  );

  ghost.style.width = `${size}px`;
  ghost.style.height = `${size}px`;
  document.body.appendChild(ghost);

  analyseDrag.ghost = ghost;
  analyseDrag.size = size;

  const origin = analyseBoardEl.querySelector(
    `[data-square="${analyseDrag.from}"] .piece`,
  );
  if (origin) origin.classList.add("dragging");
}

function moveAnalyseGhost(x, y) {
  if (!analyseDrag?.ghost) return;
  analyseDrag.ghost.style.left = `${x - analyseDrag.size / 2}px`;
  analyseDrag.ghost.style.top = `${y - analyseDrag.size / 2}px`;
}

function setAnalyseHover(name, on) {
  if (!name) return;
  const square = analyseBoardEl.querySelector(`[data-square="${name}"]`);
  if (square) square.classList.toggle("drag-over", on);
}

function updateAnalyseHover(name) {
  if (name === analyseHoverSquare) return;
  setAnalyseHover(analyseHoverSquare, false);
  analyseHoverSquare = name;
  setAnalyseHover(name, true);
}

function makeAnalyseMove(from, to, promotion = "q", animate = true) {
  const target = analyseGame.get(to);
  const move = analyseGame.move({ from, to, promotion });

  if (!move) return false;

  if (analyseCurrentPly < analyseHistory.length) {
    if (analyseGameLoaded && !analyseMainLine) {
      analyseMainLine = {
        history: [...analyseHistory],
        classes: [...analyseMoveClasses],
        ply: analyseCurrentPly,
        shared: analyseCurrentPly,
      };
    } else if (analyseMainLine) {
      analyseMainLine.shared = Math.min(
        analyseMainLine.shared,
        analyseCurrentPly,
      );
    }
    analyseMoveClasses = analyseMoveClasses.slice(0, analyseCurrentPly + 1);
  }

  updateVariationBar();
  analyseHistory = analyseHistory.slice(0, analyseCurrentPly);
  analyseHistory.push(move.san);
  analyseCurrentPly++;

  if (analyseGame.isCheckmate()) playSound("gameover");
  else if (analyseGame.inCheck()) playSound("check");
  else if (move.flags.includes("k") || move.flags.includes("q"))
    playSound("castle");
  else if (move.flags.includes("p")) playSound("promote");
  else if (target || move.flags.includes("e")) playSound("capture");
  else playSound("move");

  clearAnalyseSelection();
  renderAnalyseBoard(animate);
  renderAnalyseMoves();

  const statusEl = document.getElementById("analyse-status");
  if (statusEl) {
    statusEl.textContent =
      `Move ${Math.ceil(analyseCurrentPly / 2)} · ` +
      `${analyseCurrentPly % 2 ? "White" : "Black"} played`;
  }

  requestEngineEvaluation(analyseGame.fen(), "analyse");
  return true;
}

const BADGE_IMAGES = {
  brilliant: "./assets/badges/brilliant.png",
  great: "./assets/badges/great.png",
  best: "./assets/badges/best.png",
  excellent: "./assets/badges/excellent.png",
  good: "./assets/badges/good.png",
  inaccuracy: "./assets/badges/inaccuracy.png",
  mistake: "./assets/badges/mistake.png",
  blunder: "./assets/badges/blunder.png",
};

const BADGE_FALLBACK = {
  brilliant: "!!",
  great: "!",
  best: "★",
  excellent: "✓",
  good: "✓",
  inaccuracy: "?!",
  mistake: "?",
  blunder: "??",
};

function renderAnalyseBoard(animate = false) {
  if (!analyseBoardEl) return;

  const lastMove =
    animate === true
      ? analyseGame.history({ verbose: true }).at(-1)
      : animate || null;
  let oldPieceRect = null;

  if (animate && lastMove) {
    const oldPiece = analyseBoardEl.querySelector(
      `[data-square="${lastMove.from}"] .piece`,
    );
    if (oldPiece) oldPieceRect = oldPiece.getBoundingClientRect();
  }

  analyseBoardEl.innerHTML = "";

  const playedMove = analyseGame.history({ verbose: true }).at(-1);
  const currentClass = analyseMoveClasses[analyseCurrentPly];
  const badgeSquare = currentClass && playedMove ? playedMove.to : null;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const name =
        analyseOrientation === "w"
          ? FILES[col] + (8 - row)
          : FILES[7 - col] + (row + 1);

      const fileIndex = FILES.indexOf(name[0]);
      const rankNumber = Number(name[1]);

      const squareEl = document.createElement("div");
      squareEl.className =
        "square " + ((fileIndex + rankNumber) % 2 === 0 ? "light" : "dark");
      squareEl.dataset.square = name;

      if (name === analyseSelectedSquare) {
        squareEl.classList.add("analyse-selected");
      }

      const legalMove = analyseLegalMoves.find((move) => move.to === name);
      if (legalMove) {
        squareEl.classList.add(
          analyseGame.get(name)
            ? "analyse-legal-capture"
            : "analyse-legal-target",
        );
      }

      const piece = analyseGame.get(name);
      if (piece) squareEl.appendChild(createPieceEl(piece.color, piece.type));

      if (name === badgeSquare) {
        const badge = document.createElement("span");
        badge.className = "move-badge";
        badge.dataset.cls = currentClass;

        const img = document.createElement("img");
        img.src = BADGE_IMAGES[currentClass] || "";
        img.alt = currentClass;
        // Rozet dosyası yoksa yazılı bir yedek göster
        img.onerror = () => {
          img.remove();
          badge.textContent = BADGE_FALLBACK[currentClass] || "•";
        };
        badge.appendChild(img);

        squareEl.appendChild(badge);
      }

      if (col === 0) addCoord(squareEl, "rank", name[1]);
      if (row === 7) addCoord(squareEl, "file", name[0]);

      analyseBoardEl.appendChild(squareEl);
    }
  }

  if (animate && oldPieceRect && lastMove) {
    const newPiece = analyseBoardEl.querySelector(
      `[data-square="${lastMove.to}"] .piece`,
    );
    if (newPiece) {
      const newRect = newPiece.getBoundingClientRect();

      newPiece.style.transition = "none";
      newPiece.style.transform = `translate(${oldPieceRect.left - newRect.left}px, ${oldPieceRect.top - newRect.top}px)`;
      newPiece.offsetHeight;

      requestAnimationFrame(() => {
        newPiece.style.transition = animTransition();
        newPiece.style.transform = "translate(0, 0)";
      });
    }
  }
}

function addCoord(squareEl, type, text) {
  const el = document.createElement("span");
  el.className = `coord ${type}`;
  el.textContent = text;
  squareEl.appendChild(el);
}

function renderStatus() {
  if (viewPly !== null) {
    const total = game.history().length;
    statusEl.textContent =
      viewPly === 0
        ? "Viewing start position"
        : `Viewing move ${viewPly} of ${total}`;
    return;
  }

  const side = game.turn() === "w" ? "White" : "Black";
  const winner = game.turn() === "w" ? "Black" : "White";

  if (game.isCheckmate()) {
    statusEl.textContent = `Checkmate - ${winner} wins`;
  } else if (game.isStalemate()) {
    statusEl.textContent = "Draw by stalemate";
  } else if (game.isDraw()) {
    statusEl.textContent = "Draw";
  } else {
    statusEl.textContent =
      `${side} to move` + (game.inCheck() ? " (check)" : "");
  }
}

function createMoveEl(san, ply, activePly) {
  const el = document.createElement("span");
  el.className = "move" + (ply === activePly ? " active" : "");
  el.dataset.ply = ply;
  el.textContent = san;
  return el;
}

function renderMoves() {
  const sanMoves = game.history();
  const activePly = viewPly ?? sanMoves.length;

  movesEl.innerHTML = "";
  for (let i = 0; i < sanMoves.length; i += 2) {
    const li = document.createElement("li");
    li.appendChild(createMoveEl(sanMoves[i], i + 1, activePly));
    if (sanMoves[i + 1]) {
      li.appendChild(createMoveEl(sanMoves[i + 1], i + 2, activePly));
    }
    movesEl.appendChild(li);
  }

  const activeEl = movesEl.querySelector(".move.active");
  if (activeEl) {
    movesEl.scrollTop = activeEl.offsetTop - movesEl.offsetTop - 10;
    // Telefonda Learn/Train: hamle şeridi yatay, aktif hamleye kaydır
    if (movesEl.scrollWidth > movesEl.clientWidth) {
      movesEl.scrollLeft = Math.max(
        0,
        activeEl.offsetLeft - movesEl.offsetLeft - movesEl.clientWidth + 90,
      );
    }
  }
}

const analyseMovesEl = document.getElementById("analyse-moves");

function renderAnalyseMoves() {
  if (!analyseMovesEl) return;
  analyseMovesEl.innerHTML = "";

  for (let i = 0; i < analyseHistory.length; i += 2) {
    const li = document.createElement("li");

    for (const ply of [i + 1, i + 2]) {
      const san = analyseHistory[ply - 1];
      if (!san) break;

      const el = createMoveEl(san, ply, analyseCurrentPly);
      if (analyseMoveClasses[ply]) {
        el.dataset.cls = analyseMoveClasses[ply];
      }

      el.addEventListener("click", () => goToAnalysePly(ply));
      li.appendChild(el);
    }

    analyseMovesEl.appendChild(li);
  }

  const activeEl = analyseMovesEl.querySelector(".move.active");
  if (activeEl) {
    analyseMovesEl.scrollTop =
      activeEl.offsetTop - analyseMovesEl.offsetTop - 10;
  }
}

function playSoundForMove(move) {
  if (move.san.includes("#")) playSound("gameover");
  else if (move.san.includes("+")) playSound("check");
  else if (move.flags.includes("k") || move.flags.includes("q"))
    playSound("castle");
  else if (move.flags.includes("p")) playSound("promote");
  else if (move.captured) playSound("capture");
  else playSound("move");
}

function goToAnalysePly(ply, animate = true) {
  if (ply < 0 || ply > analyseHistory.length) return;

  const previousPly = analyseCurrentPly;
  analyseGame.reset();

  let lastPlayed = null;
  for (let i = 0; i < ply; i++) {
    lastPlayed = analyseGame.move(analyseHistory[i]);
  }

  let animation = false;
  if (animate && ply === previousPly + 1 && lastPlayed) {
    animation = { from: lastPlayed.from, to: lastPlayed.to };
    playSoundForMove(lastPlayed);
  } else if (animate && ply === previousPly - 1) {
    const undone = analyseGame.move(analyseHistory[ply]);
    analyseGame.undo();
    animation = { from: undone.to, to: undone.from };
    playSoundForMove(undone);
  }

  analyseCurrentPly = ply;
  clearAnalyseSelection();

  renderAnalyseBoard(animation);
  renderAnalyseMoves();

  const statusEl = document.getElementById("analyse-status");
  if (statusEl) {
    statusEl.textContent =
      ply === 0
        ? "Starting position"
        : `Move ${Math.ceil(ply / 2)} · ${ply % 2 ? "White" : "Black"} played`;
  }

  requestEngineEvaluation(analyseGame.fen(), "analyse");
}

document.getElementById("analyse-btn-undo")?.addEventListener("click", () => {
  if (analyseCurrentPly <= 0) return;
  analyseSelectedSquare = null;
  analyseLegalMoves = [];
  goToAnalysePly(analyseCurrentPly - 1);
});

document.getElementById("analyse-btn-flip")?.addEventListener("click", () => {
  analyseOrientation = analyseOrientation === "w" ? "b" : "w";
  renderAnalyseBoard();
});

document.getElementById("analyse-btn-reset")?.addEventListener("click", () => {
  reviewRunId++;
  analyseMainLine = null;
  analyseGameLoaded = false;
  updateVariationBar();
  analyseHistory = [];
  analyseMoveClasses = [];
  analyseCurrentPly = 0;
  analyseGame.reset();
  clearAnalyseSelection();

  document.getElementById("analyse-game-report").hidden = true;
  analyseGamesStatusEl.textContent = "";
  goToAnalysePly(0, false);
});

const REVIEW_DEPTH_DEFAULT = 14; // yüksek = daha doğru ama daha yavaş
const reviewDepth = () => settings.reviewDepth || REVIEW_DEPTH_DEFAULT;

// "Great" rozeti için assets/badges/great.png gerekir. Dosyayı ekleyince true yap.
const ENABLE_GREAT_MOVES = false;
if (!ENABLE_GREAT_MOVES) {
  for (const side of ["white", "black"]) {
    const row = document
      .getElementById(`analyse-${side}-great`)
      ?.closest(".analyse-stat-row");
    if (row) row.hidden = true;
  }
}
const PIECE_VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

let analyseMoveClasses = [];
let reviewRunId = 0;
let reviewEnginePromise = null;
let reviewWorker = null;
let analyseMainLine = null;
let analyseGameLoaded = false;

function updateVariationBar() {
  const bar = document.getElementById("analyse-variation-bar");
  if (bar) bar.hidden = !analyseMainLine;
}

document.getElementById("analyse-return-btn")?.addEventListener("click", () => {
  if (!analyseMainLine) return;

  const { history, classes, ply } = analyseMainLine;
  analyseHistory = history;
  analyseMoveClasses = classes;
  analyseMainLine = null;

  updateVariationBar();
  goToAnalysePly(ply, false);
});

function initReviewEngine() {
  if (reviewEnginePromise) return reviewEnginePromise;

  reviewEnginePromise = new Promise((resolve, reject) => {
    const worker = new Worker("./assets/stockfish/stockfish-19-lite-single.js");
    reviewWorker = worker;

    worker.onerror = (err) => reject(err);

    const onMessage = (event) => {
      const msg = String(event.data).trim();
      if (msg === "uciok") {
        worker.postMessage("setoption name MultiPV value 2");
        worker.postMessage("isready");
      } else if (msg === "readyok") {
        worker.removeEventListener("message", onMessage);
        resolve(worker);
      }
    };

    worker.addEventListener("message", onMessage);
    worker.postMessage("uci");
  });

  return reviewEnginePromise;
}

let evalQueue = Promise.resolve();

function evaluateFen(fen, depth = reviewDepth()) {
  const job = evalQueue.then(() => runEvaluation(fen, depth));
  evalQueue = job.catch(() => {});
  return job;
}

async function runEvaluation(fen, depth = reviewDepth()) {
  const worker = await initReviewEngine();
  const whiteToMove = fen.split(" ")[1] === "w";

  return new Promise((resolve) => {
    const lines = {}; // rank -> { cp (beyaz bakışı), pv: [uci...] }

    const onMessage = (event) => {
      const msg = String(event.data).trim();

      if (msg.startsWith("info ") && !/\b(lowerbound|upperbound)\b/.test(msg)) {
        const rank = Number(msg.match(/\bmultipv (\d+)/)?.[1] ?? 1);
        const cp = msg.match(/\bscore cp (-?\d+)/);
        const mate = msg.match(/\bscore mate (-?\d+)/);
        const pvMatch = msg.match(/\bpv (.+)$/);
        let value = null;

        if (cp) value = Number(cp[1]);
        else if (mate) value = Number(mate[1]) > 0 ? 3000 : -3000;

        if (value !== null) {
          lines[rank] = {
            cp: whiteToMove ? value : -value,
            pv: pvMatch ? pvMatch[1].trim().split(/\s+/).slice(0, 10) : [],
          };
        }
      } else if (msg.startsWith("bestmove")) {
        worker.removeEventListener("message", onMessage);
        const best = msg.split(" ")[1];

        resolve({
          cp: lines[1]?.cp ?? 0,
          second: lines[2]?.cp ?? null,
          best: best && best !== "(none)" ? best : null,
          lines, // { 1: {cp, pv}, 2: {cp, pv} }
          pv: lines[1]?.pv ?? [],
        });
      }
    };

    worker.addEventListener("message", onMessage);
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go depth ${depth}`);
  });
}

// Lichess/chess.com tarzı: centipawn -> kazanma yüzdesi (beklenen puan x 100)
function winPercent(cp) {
  const c = Math.max(-1200, Math.min(1200, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * c)) - 1);
}

// Hamle doğruluğu: kazanma yüzdesi kaybına göre (Lichess formülü)
function moveAccuracy(winLoss) {
  const acc =
    103.1668100711649 * Math.exp(-0.04354415386753951 * Math.max(0, winLoss)) -
    3.166924740191411 +
    1;
  return Math.max(0, Math.min(100, acc));
}

// Oyun doğruluğu: oynaklık ağırlıklı ortalama ile harmonik ortalamanın ortalaması
function combineAccuracy(accs, weights) {
  if (!accs.length) return null;
  const weightSum = weights.reduce((a, b) => a + b, 0) || 1;
  const weighted =
    accs.reduce((sum, a, i) => sum + a * weights[i], 0) / weightSum;
  const harmonic =
    accs.length / accs.reduce((sum, a) => sum + 1 / Math.max(a, 1), 0);

  return Math.min(100, Math.max(0, (weighted + harmonic) / 2));
}

function volatilityWeights(winSeries) {
  const total = winSeries.length - 1;
  const size = Math.max(2, Math.min(8, Math.floor(winSeries.length / 10)));
  const weights = [];

  for (let i = 0; i < total; i++) {
    let win = winSeries.slice(i, i + size);
    if (win.length < 2) win = winSeries.slice(-size);

    const mean = win.reduce((a, b) => a + b, 0) / win.length;
    const sd = Math.sqrt(
      win.reduce((a, b) => a + (b - mean) ** 2, 0) / win.length,
    );

    weights.push(Math.max(0.5, Math.min(12, sd)));
  }

  return weights;
}

function materialDiff(chess, color) {
  let diff = 0;
  for (const row of chess.board()) {
    for (const p of row) {
      if (!p || p.type === "k") continue;
      diff += (p.color === color ? 1 : -1) * PIECE_VAL[p.type];
    }
  }
  return diff;
}

// Bir karedeki alış-veriş zincirinin, sırası gelen taraf için net kazancı (basit statik takas).
function quiesceGain(chess, square, depth) {
  if (depth <= 0) return 0;

  const captures = chess
    .moves({ verbose: true })
    .filter((m) => m.to === square && m.captured);
  if (!captures.length) return 0;

  captures.sort((a, b) => PIECE_VAL[a.piece] - PIECE_VAL[b.piece]);

  let best = 0; // almamak serbest
  for (const m of captures.slice(0, 3)) {
    chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    const value = PIECE_VAL[m.captured] - quiesceGain(chess, square, depth - 1);
    chess.undo();
    best = Math.max(best, value);
  }
  return best;
}

// Motorun ana varyantını oynatıp, takaslar bitince hamle yapanın materyal farkını ölçer.
// Negatif sonuç = materyal feda edilmiş (örn. -3 = bir taş).
function pvMaterialSwing(fenBefore, pvMoves, color) {
  if (!pvMoves || pvMoves.length < 2) return 0;

  const chess = new Chess(fenBefore);
  const start = materialDiff(chess, color);
  const diffs = [];
  const captures = [];
  let lastTo = null;

  for (const uci of pvMoves.slice(0, 8)) {
    let mv = null;
    try {
      mv = chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci[4] || undefined,
      });
    } catch {
      mv = null;
    }
    if (!mv) break;
    diffs.push(materialDiff(chess, color));
    captures.push(!!mv.captured);
    lastTo = mv.to;
  }

  if (diffs.length < 2) return 0;

  // İlk "sakin" nokta: rakibin en az bir hamlesi oynanmış ve sıradaki hamle alma değil
  for (let k = 1; k + 1 < diffs.length; k++) {
    if (!captures[k + 1]) return diffs[k] - start;
  }

  if (chess.isGameOver()) return diffs[diffs.length - 1] - start;

  // Hat takasın ortasında kesildiyse, son karedeki alış-verişi tahmin ederek tamamla
  let final = diffs[diffs.length - 1];
  if (captures[captures.length - 1]) {
    const gain = quiesceGain(chess, lastTo, 4);
    final += (chess.turn() === color ? 1 : -1) * gain;
  }
  return final - start;
}

// İleriye bakış: motorun hattı sonuna kadar oynanınca feda edilen materyal GERİ ALINMIYOR mu?
// Pozitif sayı = hat sonunda hâlâ o kadar materyal geride (ya da rakip değil, hamle yapan mat ediyor = 99).
// Feda hemen geri alınıyorsa (takas) ya da küçük bir oyalamaysa brilliant sayılmaz.
function persistentDeficit(fenBefore, pvMoves, color) {
  if (!pvMoves || pvMoves.length < 3) return 0;
  const chess = new Chess(fenBefore);
  const start = materialDiff(chess, color);
  let lastCapture = false;
  let lastTo = null;
  let played = 0;

  for (const uci of pvMoves.slice(0, 10)) {
    let mv = null;
    try {
      mv = chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci[4] || undefined,
      });
    } catch {
      mv = null;
    }
    if (!mv) break;
    played++;
    lastCapture = !!mv.captured;
    lastTo = mv.to;
  }
  if (played < 3) return 0;

  if (chess.isCheckmate()) {
    // sırası gelen taraf mat olmuş: hamle yapan taraf kazandıysa fedası karşılığını almıştır
    return chess.turn() !== color ? 99 : -99;
  }

  let final = materialDiff(chess, color);
  if (lastCapture) {
    // Hat bir takasın ortasında kesilmiş olabilir: o karedeki alış-verişi tamamla
    const gain = quiesceGain(chess, lastTo, 4);
    final += (chess.turn() === color ? 1 : -1) * gain;
  }
  return start - final;
}

// Rakibin, sırası ona geçseydi (ya da şimdi) bir pozisyonda alabileceği en kârlı takas zinciri.
function maxCaptureGain(chess) {
  const squares = new Set(
    chess
      .moves({ verbose: true })
      .filter((m) => m.captured)
      .map((m) => m.to),
  );
  let maxGain = 0;
  for (const sq of squares) {
    maxGain = Math.max(maxGain, quiesceGain(chess, sq, 4));
  }
  return maxGain;
}

// Hamleden hemen sonra feda edilen materyal (statik takas hesabı, motor hattından bağımsız).
// raw = rakibin kazanabileceği - bu hamlede alınan taş
// net = raw - HAMLEDEN ÖNCE zaten var olan tehdit (zaten asılı duran taş feda sayılmaz)
function staticSacrifice(fenBefore, uci, color) {
  try {
    // Hamleden önceki tehdit: sırayı rakibe verip alabileceği en çok materyal
    let threatBefore = 0;
    try {
      const parts = fenBefore.split(" ");
      parts[1] = parts[1] === "w" ? "b" : "w";
      parts[3] = "-";
      threatBefore = maxCaptureGain(new Chess(parts.join(" ")));
    } catch {
      threatBefore = 0;
    }

    const chess = new Chess(fenBefore);
    const mv = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci[4] || undefined,
    });
    if (!mv) return { raw: 0, net: 0 };
    const gained = mv.captured ? PIECE_VAL[mv.captured] : 0;
    const maxGain = maxCaptureGain(chess);
    const raw = Math.max(0, maxGain - gained);
    const net = Math.max(0, maxGain - gained - threatBefore);
    return { raw, net };
  } catch {
    return { raw: 0, net: 0 };
  }
}

// Sınıflandırma (kaybedilen kazanma % eşikleri):
//   brilliant (!!)  : iyi hamle + büyük feda
//   excellent (!)   : zor bulunan hamle (tek iyi hamle / küçük feda)
//   best            : motorun en iyisi ya da kaybı ≤ 2
//   good ≤ 5 · inaccuracy ≤ 10 · mistake ≤ 20 · blunder > 20
function classifyMove({
  uci,
  best,
  loss,
  winBefore,
  winAfter,
  winAlt, // oynanan hamle dışındaki en iyi alternatifin değeri (yoksa null = tek yasal/zorunlu hamle)
  gap,
  isRecapture,
  sacrificeSwing,
  hangSwing = 0,
  persist = 0, // hat sonunda hâlâ geride kalınan materyal (ileriye bakış)
  moverPiece,
  cpBefore,
  cpAfter,
}) {
  const playedBest = uci === best;

  // Brilliant (chess.com tanımı): iyi bir taş feda etmek. Hamle en iyi ya da en iyiye yakın olmalı,
  // hamleden sonra pozisyon kötü olmamalı ve hamleyi bulmasan da zaten tamamen kazanıyor olmamalısın.
  // "Hamleyi bulmasan da zaten tamamen kazanıyor olmamalısın" = en iyi ALTERNATİF de kazanç olmamalı.
  // (winBefore kullanılamaz: motor hamleyi bulduğu için feda sonrası matı zaten görür ve winBefore ~%100 çıkar.)
  if (
    moverPiece !== "k" &&
    winAlt !== null &&
    loss <= 2 &&
    sacrificeSwing <= -2 &&
    winAlt < 97 &&
    winAfter >= 47
  ) {
    return "brilliant";
  }

  // Excellent (!): zor bulunan hamle. Ya tek iyi hamle (alternatifler belirgin kötü)
  // ya da küçük bir feda (genelde piyon). Brilliant (!!) kadar büyük değil.
  const nearBest = loss <= 1;
  const onlyMove = winAlt !== null && gap >= 12 && !isRecapture;
  const smallSacrifice =
    moverPiece !== "k" &&
    winAlt !== null &&
    sacrificeSwing <= -1 &&
    winAlt < 97 &&
    winAfter >= 45;

  if (nearBest && (onlyMove || smallSacrifice)) {
    return "excellent";
  }

  // Best: motorun en iyi hamlesi ya da onunla pratikte aynı seviye (kayıp < 0.5).
  // Good: makul bir seçenek ama daha iyi hamleler var.
  if (playedBest || loss < 0.5) return "best";
  if (loss <= 5) return "good";
  if (loss <= 10) return "inaccuracy";

  // Blunder: bedava taş vermek, matı kaçırmak, mat yemek ya da oyunu tamamen çevirmek.
  // Bunların dışındaki büyük hatalar "mistake" kalır.
  const missedMate = cpBefore >= 3000 && cpAfter < 3000;
  const allowsMate = cpAfter <= -3000 && cpBefore > -3000;
  const hangsPiece = hangSwing <= -3 || sacrificeSwing <= -3; // motorun hattında en az bir taş kaybı
  const flipsGame = loss > 20 && winBefore >= 40 && winAfter <= 25;

  if (allowsMate || missedMate || hangsPiece || flipsGame || loss >= 35) {
    return "blunder";
  }
  return "mistake";
}

async function reviewGame(
  sanMoves,
  runId,
  whitePlayer = "",
  blackPlayer = "",
  targetUsername = "",
) {
  const reportPanel = document.getElementById("analyse-game-report");
  const progressBox = document.getElementById("analyse-progress-box");
  const reportContent = document.getElementById("analyse-report-content");
  const progressText = document.getElementById("analyse-progress-text");

  document.querySelectorAll(".report-you-badge").forEach((el) => el.remove());

  setText("analyse-white-accuracy", "--%");
  setText("analyse-black-accuracy", "--%");
  [
    "brilliant",
    "best",
    "great",
    "excellent",
    "good",
    "inaccuracies",
    "mistakes",
    "blunders",
  ].forEach((key) => {
    setText(`analyse-white-${key}`, "0");
    setText(`analyse-black-${key}`, "0");
  });

  const gamesContainer =
    document.getElementById("analyse-games-list") ||
    document.querySelector(".analyse-games-container");
  if (gamesContainer) gamesContainer.style.display = "none";

  if (reportPanel) reportPanel.hidden = false;
  if (progressBox) progressBox.style.display = "flex";
  if (reportContent) reportContent.style.display = "none";
  if (progressText) progressText.textContent = "Analyzing game... (0%)";

  const chess = new Chess();
  const moves = [];

  for (const san of sanMoves) {
    const fenBefore = chess.fen();
    const m = chess.move(san);

    moves.push({
      san: m.san,
      color: m.color,
      piece: m.piece,
      captured: m.captured,
      to: m.to,
      uci: m.from + m.to + (m.promotion ?? ""),
      fenBefore,
      fenAfter: chess.fen(),
    });
  }

  const total = moves.length;
  const evals = [];

  for (let i = 0; i <= total; i++) {
    if (runId !== reviewRunId) return;

    if (progressText && total > 0) {
      const percent = Math.round((i / total) * 100);
      progressText.textContent = `Analyzing game... (${percent}%)`;
    }

    const fen = i === 0 ? moves[0].fenBefore : moves[i - 1].fenAfter;
    const pos = new Chess(fen);

    if (pos.isCheckmate()) {
      evals.push({ cp: pos.turn() === "w" ? -3000 : 3000, best: null });
    } else if (pos.isDraw()) {
      evals.push({ cp: 0, best: null });
    } else {
      evals.push(await evaluateFen(fen));
    }
  }

  if (runId !== reviewRunId) return;

  const summary = {};
  for (const color of ["w", "b"]) {
    summary[color] = {
      brilliant: 0,
      great: 0,
      excellent: 0,
      best: 0,
      good: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
      accs: [],
      weights: [],
    };
  }

  const classes = [];
  const weights = volatilityWeights(evals.map((e) => winPercent(e.cp)));

  let bookPlies = 0;
  if (openingBook && typeof openingBook.lookup === "function") {
    while (bookPlies < total && openingBook.lookup(moves[bookPlies].fenAfter)) {
      bookPlies++;
    }
  }

  // Tek bir hamleyi değerlendirir. before = hamle öncesi motor sonucu, after = sonrası.
  const judge = (mv, i, before, after) => {
    const sign = mv.color === "w" ? 1 : -1;
    const winBefore = winPercent(sign * before.cp);

    // Oynanan hamle motorun 1. ya da 2. çizgisiyle aynıysa, aynı aramadaki değeri kullan.
    let afterCp = after.cp;
    let pv = [mv.uci, ...(after.pv || [])];
    const line1 = before.lines?.[1];
    const line2 = before.lines?.[2];

    if (line1 && line1.pv[0] === mv.uci) {
      afterCp = line1.cp;
      pv = line1.pv;
    } else if (line2 && line2.pv[0] === mv.uci) {
      afterCp = line2.cp;
      pv = line2.pv;
    }

    const winAfter = winPercent(sign * afterCp);
    const loss = Math.max(0, winBefore - winAfter);
    const gap =
      before.second == null ? 0 : winBefore - winPercent(sign * before.second);

    // En iyi alternatif: oynanan hamle 1. çizgiyse 2. çizgi, değilse motorun 1. çizgisi
    let altCp = null;
    if (line1 && line1.pv[0] === mv.uci) altCp = line2 ? line2.cp : null;
    else if (line1) altCp = line1.cp;
    const winAlt = altCp === null ? null : winPercent(sign * altCp);
    const isRecapture =
      i > 0 && moves[i - 1].captured && moves[i - 1].to === mv.to;

    // Feda miktarı: hem motor hattındaki materyal değişimi hem statik takas hesabı
    let sacrifice = 0;
    let persist = 0;
    let hang = 0;
    const needSwing = (loss <= 3 && winAfter >= 35) || loss > 10;
    if (needSwing) {
      const swing = pvMaterialSwing(mv.fenBefore, pv, mv.color);
      const st = staticSacrifice(mv.fenBefore, mv.uci, mv.color);
      sacrifice = st.net; // gerçek feda (zaten asılı taşlar sayılmaz)
      hang = Math.max(-swing, st.raw); // blunder için: taş kaybı
      if (sacrifice >= 2)
        persist = persistentDeficit(mv.fenBefore, pv, mv.color);
    }

    const cls = classifyMove({
      uci: mv.uci,
      best: before.best,
      loss,
      winBefore,
      winAfter,
      winAlt,
      gap,
      isRecapture,
      sacrificeSwing: -sacrifice,
      hangSwing: -hang,
      persist,
      moverPiece: mv.piece,
      cpBefore: sign * before.cp,
      cpAfter: sign * afterCp,
    });
    return { cls, loss, winBefore, winAfter, winAlt, sacrifice, persist };
  };

  let deepChecks = 0;
  for (let i = 0; i < moves.length; i++) {
    if (runId !== reviewRunId) return;
    const mv = moves[i];
    const s = summary[mv.color];
    const before = evals[i];
    const after = evals[i + 1];

    let res = judge(mv, i, before, after);

    // Brilliant adayı (feda var, ama henüz brilliant değil): daha derin analizle tekrar kontrol et.
    // Sığ analiz feda sonrası kazancı görmeyebilir.
    if (
      res.cls !== "brilliant" &&
      res.sacrifice >= 2 &&
      res.loss <= 8 &&
      res.winAfter >= 35 &&
      deepChecks < 4 &&
      before.lines?.[1]
    ) {
      deepChecks++;
      if (progressText)
        progressText.textContent = "Analyzing key moves deeper...";
      try {
        const deep = await runEvaluation(
          mv.fenBefore,
          Math.min(reviewDepth() + 2, 18),
        );
        if (runId !== reviewRunId) return;
        if (deep && deep.lines?.[1]) {
          const deepRes = judge(mv, i, deep, after);
          console.log("[review] derin kontrol", {
            ply: i + 1,
            san: mv.san,
            sacrifice: deepRes.sacrifice,
            persist: deepRes.persist,
            loss: +deepRes.loss.toFixed(1),
            winAlt: deepRes.winAlt === null ? null : +deepRes.winAlt.toFixed(1),
            winAfter: +deepRes.winAfter.toFixed(1),
            sonuc: deepRes.cls,
          });
          if (deepRes.cls === "brilliant") res = deepRes;
        }
      } catch (e) {
        console.log("[review] derin kontrol hatası", e);
      }
    } else if (res.sacrifice >= 2 && res.loss <= 3) {
      console.log("[review] feda adayı", {
        ply: i + 1,
        san: mv.san,
        sonuc: res.cls,
        sacrifice: res.sacrifice,
        persist: res.persist,
        loss: +res.loss.toFixed(1),
        winAlt: res.winAlt === null ? null : +res.winAlt.toFixed(1),
        winAfter: +res.winAfter.toFixed(1),
      });
    }

    // Teori hamlelerine rozet verilmez ama rapor sayımına motor değerlendirmesiyle girer
    if (i >= bookPlies) classes[i + 1] = res.cls;

    s[res.cls]++;
    s.accs.push(moveAccuracy(res.loss));
    s.weights.push(weights[i]);
  }

  for (const color of ["w", "b"]) {
    const s = summary[color];
    s.accuracy = combineAccuracy(s.accs, s.weights);
  }

  if (typeof analyseMainLine !== "undefined" && analyseMainLine) {
    analyseMainLine.classes = classes;
    analyseMoveClasses = classes.slice(0, analyseMainLine.shared + 1);
  } else {
    analyseMoveClasses = classes;
  }

  renderAnalyseReport({
    totalMoves: total,
    summary,
    whitePlayer,
    blackPlayer,
    targetUsername,
  });
  renderAnalyseMoves();
  renderAnalyseBoard();

  if (progressBox) progressBox.style.display = "none";
  if (reportContent) reportContent.style.display = "block";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderAnalyseReport({
  totalMoves,
  summary,
  whitePlayer,
  blackPlayer,
  targetUsername,
}) {
  const panel = document.getElementById("analyse-game-report");
  if (!panel) return;

  panel.hidden = false;
  setText("analyse-total-moves", totalMoves);

  const idKey = {
    brilliant: "brilliant",
    best: "best",
    great: "great",
    excellent: "excellent",
    good: "good",
    inaccuracy: "inaccuracies",
    mistake: "mistakes",
    blunder: "blunders",
  };

  for (const [color, name] of [
    ["w", "white"],
    ["b", "black"],
  ]) {
    const s = summary[color];
    setText(
      `analyse-${name}-accuracy`,
      s.accuracy === null ? "--%" : `${s.accuracy.toFixed(1)}%`,
    );

    for (const [cls, key] of Object.entries(idKey)) {
      setText(`analyse-${name}-${key}`, s[cls]);
    }
  }

  const statusEl = document.getElementById("analyse-games-status");
  if (statusEl) statusEl.textContent = "";

  updateYouBadge(whitePlayer, blackPlayer, targetUsername);
}

function updateYouBadge(whitePlayer, blackPlayer, targetUsername) {
  document.querySelectorAll(".report-you-badge").forEach((el) => el.remove());

  const currentUsername = (
    targetUsername ||
    document.getElementById("chesscom-username")?.value ||
    ""
  )
    .trim()
    .toLowerCase();

  const reportEl = document.getElementById("analyse-game-report");
  if (!reportEl || !currentUsername) return;

  let userColor = null;
  if (whitePlayer && blackPlayer) {
    if (whitePlayer.toLowerCase() === currentUsername) userColor = "white";
    else if (blackPlayer.toLowerCase() === currentUsername) userColor = "black";
  }

  if (userColor) {
    const headers = reportEl.querySelectorAll("h3, .column-title, th, strong");
    headers.forEach((header) => {
      const text = header.textContent.toLowerCase();
      if (
        text.includes(userColor) &&
        !header.querySelector(".report-you-badge")
      ) {
        const badge = document.createElement("span");
        badge.className = "report-you-badge";
        badge.textContent = "YOU";
        header.appendChild(badge);
      }
    });
  }
}

function loadAnalyseGame(
  pgn,
  orientation = "w",
  whitePlayer = "",
  blackPlayer = "",
  targetUsername = "",
) {
  const chess = new Chess();

  try {
    chess.loadPgn(pgn);
  } catch (error) {
    analyseGamesStatusEl.textContent = `Review failed: ${error.message}`;
    return;
  }

  const sanMoves = chess.history();
  if (!sanMoves.length) {
    analyseGamesStatusEl.textContent = "This game has no moves.";
    return;
  }

  const runId = ++reviewRunId;

  analyseHistory = sanMoves;
  analyseMoveClasses = [];
  analyseMainLine = null;
  analyseGameLoaded = true;
  updateVariationBar();
  analyseOrientation = orientation;
  clearAnalyseSelection();

  document.getElementById("analyse-game-report").hidden = true;
  goToAnalysePly(0, false);

  const gamesContainer =
    document.getElementById("analyse-games-list") ||
    document.querySelector(".analyse-games-container");
  if (gamesContainer) gamesContainer.style.display = "none";

  reviewGame(sanMoves, runId, whitePlayer, blackPlayer, targetUsername).catch(
    (error) => {
      console.error("Review failed:", error);
      analyseGamesStatusEl.textContent = "Review failed.";
    },
  );
}

function renderAnalyseGamesList(items) {
  analyseGames = items;
  analyseGamesListEl.innerHTML = "";

  const gamesContainer =
    document.getElementById("analyse-games-list") ||
    document.querySelector(".analyse-games-container");
  if (gamesContainer) gamesContainer.style.display = "block";

  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "analyse-game-item";

    const text = document.createElement("div");
    text.className = "analyse-game-text";

    const title = document.createElement("strong");
    title.textContent = item.title;

    const sub = document.createElement("span");
    sub.textContent = item.subtitle;

    text.append(title, sub);
    btn.append(text);

    if (item.result) {
      const badge = document.createElement("span");
      badge.className = `analyse-game-result ${item.result.toLowerCase()}`;
      badge.textContent = item.result;
      btn.append(badge);
    }

    btn.addEventListener("click", () =>
      loadAnalyseGame(
        item.pgn,
        item.orientation,
        item.white,
        item.black,
        item.username,
      ),
    );

    analyseGamesListEl.appendChild(btn);
  });
}

async function fetchChesscomGames(username) {
  const statusElement = document.getElementById("analyse-games-status");
  if (statusElement) statusElement.textContent = "";

  const user = username.trim().toLowerCase();
  const base = `https://api.chess.com/pub/player/${encodeURIComponent(user)}`;
  const archivesRes = await fetch(`${base}/games/archives`);

  if (!archivesRes.ok) {
    throw new Error(
      archivesRes.status === 404
        ? "User not found."
        : "Chess.com request failed.",
    );
  }

  const { archives } = await archivesRes.json();
  const games = [];

  for (const url of [...archives].reverse().slice(0, 3)) {
    const res = await fetch(url);
    if (!res.ok) continue;

    const data = await res.json();
    games.push(...[...data.games].reverse());

    if (games.length >= 30) break;
  }

  return games
    .filter((g) => g.pgn && g.rules === "chess")
    .slice(0, 30)
    .map((g) => {
      const isWhite = g.white.username.toLowerCase() === user;
      const me = isWhite ? g.white : g.black;
      const opp = isWhite ? g.black : g.white;
      const result =
        me.result === "win" ? "Win" : opp.result === "win" ? "Loss" : "Draw";

      return {
        title: `${g.white.username} vs ${g.black.username}`,
        subtitle: `${g.time_class} · ${new Date(g.end_time * 1000).toLocaleDateString()}`,
        result,
        pgn: g.pgn,
        orientation: isWhite ? "w" : "b",
        white: g.white.username,
        black: g.black.username,
        username: user,
      };
    });
}

document
  .getElementById("fetch-chesscom-games")
  ?.addEventListener("click", () => {
    executeFetchGames();
  });

document
  .getElementById("chesscom-username")
  ?.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      executeFetchGames();
    }
  });

async function executeFetchGames() {
  const usernameInput = document.getElementById("chesscom-username");
  const fetchButton = document.getElementById("fetch-chesscom-games");
  const username = usernameInput ? usernameInput.value : "";

  if (!username.trim()) return;

  analyseGamesStatusEl.textContent = "Loading games…";
  analyseGamesListEl.innerHTML = "";

  if (fetchButton) fetchButton.classList.add("fetch-loading");

  try {
    const items = await fetchChesscomGames(username);
    analyseGamesStatusEl.textContent = items.length
      ? `${items.length} games found. Click one to analyse.`
      : "No games found.";

    renderAnalyseGamesList(items);
  } catch (error) {
    analyseGamesStatusEl.textContent = error.message;
  } finally {
    if (fetchButton) fetchButton.classList.remove("fetch-loading");
  }
}

analysePgnFileEl?.addEventListener("change", async () => {
  const file = analysePgnFileEl.files[0];
  if (!file) return;

  const text = await file.text();
  const items = splitGames(text).map((g, index) => {
    const h = g.headers;
    const headerText = Object.entries(h)
      .map(([k, v]) => `[${k} "${v.replace(/(["\\])/g, "\\$1")}"]`)
      .join("\n");

    return {
      title: `${h.White ?? "?"} vs ${h.Black ?? "?"}`,
      subtitle: `${h.Result ?? "*"} · ${h.Date ?? `Game ${index + 1}`}`,
      pgn: `${headerText}\n\n${g.movetext}`,
      orientation: "w",
    };
  });

  analyseGamesStatusEl.textContent = items.length
    ? `${items.length} games found. Click one to analyse.`
    : "No games found in this file.";

  renderAnalyseGamesList(items);
  analysePgnFileEl.value = "";
});

function getMaterial(position) {
  const counts = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };

  position
    .board()
    .flat()
    .forEach((piece) => {
      if (piece && piece.type !== "k") counts[piece.color][piece.type]++;
    });

  const ahead = { w: [], b: [] };
  let net = 0;

  for (const type of DISPLAY_ORDER) {
    const diff = counts.w[type] - counts.b[type];
    net += diff * PIECE_VALUES[type];

    for (let i = 0; i < Math.abs(diff); i++) {
      if (diff > 0) ahead.w.push({ type, color: "b" });
      else ahead.b.push({ type, color: "w" });
    }
  }

  return { ahead, net };
}

function renderStrip(el, color, material) {
  el.innerHTML = "";

  const nameEl = document.createElement("span");
  nameEl.className = "strip-name";
  nameEl.textContent = color === "w" ? "White" : "Black";
  el.appendChild(nameEl);

  const capturedEl = document.createElement("span");
  capturedEl.className = "strip-captured";
  material.ahead[color].forEach(({ type, color: pieceColor }) => {
    capturedEl.appendChild(createPieceEl(pieceColor, type));
  });
  el.appendChild(capturedEl);

  const advantage = color === "w" ? material.net : -material.net;
  if (advantage > 0) {
    const advEl = document.createElement("span");
    advEl.className = "strip-advantage";
    advEl.textContent = `+${advantage}`;
    el.appendChild(advEl);
  }
}

function renderStrips() {
  const material = getMaterial(view);
  const bottomColor = orientation;
  const topColor = orientation === "w" ? "b" : "w";

  renderStrip(stripBottomEl, bottomColor, material);
  renderStrip(stripTopEl, topColor, material);
}

// ==========================================
// LICHESS PUZZLE MOTORU & TAHTA RENDER (GÜNCELLENDİ)
// ==========================================
let isPuzzleMistakeState = false;
let puzzleScoreRecorded = false;
let puzzleCorrectSquares = [];
let puzzleCorrectTimer = null;

// Hamle gezinme: puzzleViewPly === null -> canlı pozisyon, sayı -> o hamleye kadar olan pozisyon
function getPuzzleDisplayGame() {
  if (puzzleViewPly === null) return puzzleGame;
  const sanMoves = puzzleGame.history();
  if (puzzleViewPly >= sanMoves.length) return puzzleGame;

  const viewGame = new Chess();
  for (let i = 0; i < puzzleViewPly; i++) viewGame.move(sanMoves[i]);
  return viewGame;
}

function goToPuzzlePly(ply) {
  if (!currentPuzzle || isPuzzleMistakeState) return;

  const verboseHistory = puzzleGame.history({ verbose: true });
  const total = verboseHistory.length;
  const previous = puzzleViewPly ?? total;
  const target = Math.max(0, Math.min(ply, total));
  if (target === previous) return;

  puzzleViewPly = target >= total ? null : target;
  puzzleSelectedSquare = null;
  puzzleLegalMoves = [];

  // Sadece tek adım ileri giderken animasyon + ses
  const stepForward = target === previous + 1;
  if (Math.abs(target - previous) === 1) {
    const moved = stepForward
      ? verboseHistory[target - 1]
      : verboseHistory[previous - 1];
    if (moved) playSoundForMove(moved);
  }

  if (stepForward) {
    renderPuzzleBoard(true);
  } else if (target === previous - 1) {
    // geri adım: taş to -> from karesine geri kayar
    const undone = verboseHistory[previous - 1];
    renderPuzzleBoard({ from: undone.to, to: undone.from });
  } else {
    renderPuzzleBoard(false);
  }
  renderPuzzleMoves();
}

// Klavye: oklar ile puzzle hamlelerinde gezinme
window.addEventListener("keydown", (e) => {
  const puzzlesPage = document.getElementById("puzzles");
  if (!puzzlesPage || puzzlesPage.hidden) return;
  if (
    puzzleDrag ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
  ) {
    return;
  }

  const total = puzzleGame.history().length;
  const current = puzzleViewPly ?? total;

  if (e.key === "ArrowLeft") {
    e.preventDefault();
    goToPuzzlePly(current - 1);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    goToPuzzlePly(current + 1);
  } else if (e.key === "ArrowUp" || e.key === "Home") {
    e.preventDefault();
    goToPuzzlePly(0);
  } else if (e.key === "ArrowDown" || e.key === "End") {
    e.preventDefault();
    goToPuzzlePly(total);
  }
});

function renderPuzzleBoard(animate = false) {
  if (!puzzleBoardEl) return;

  const displayGame = getPuzzleDisplayGame();
  const isViewing = puzzleViewPly !== null;
  const history = displayGame.history({ verbose: true });
  const lastMove = history[history.length - 1];

  const customAnim = typeof animate === "object" && animate !== null;
  const shouldAnimate = animate === true || customAnim;
  let oldPieceRect = null;
  const animMove = customAnim ? animate : shouldAnimate ? lastMove : null;

  if (shouldAnimate && animMove && animMove.from) {
    const fromSquare = puzzleBoardEl.querySelector(
      `[data-square="${animMove.from}"]`,
    );
    const oldPiece = fromSquare?.querySelector(".piece");
    if (oldPiece) oldPieceRect = oldPiece.getBoundingClientRect();
  }

  puzzleBoardEl.innerHTML = "";

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const squareName =
        puzzleOrientation === "w"
          ? FILES[col] + (8 - row)
          : FILES[7 - col] + (row + 1);

      const fileIndex = FILES.indexOf(squareName[0]);
      const rankNumber = Number(squareName[1]);

      const square = document.createElement("div");
      square.className =
        "square " + ((fileIndex + rankNumber) % 2 === 0 ? "light" : "dark");
      square.dataset.square = squareName;

      if (puzzleCorrectSquares.includes(squareName)) {
        square.classList.add("puzzle-correct");
      }

      if (
        lastMove &&
        (squareName === lastMove.from || squareName === lastMove.to)
      ) {
        square.classList.add("last-move");
      }

      if (!isViewing && puzzleSelectedSquare === squareName) {
        square.classList.add("selected");
      }

      if (!isPuzzleMistakeState && !isViewing) {
        const legalMove = puzzleLegalMoves.find((m) => m.to === squareName);
        if (legalMove) {
          square.classList.add("legal");
          if (legalMove.captured) square.classList.add("capture");
        }
      }

      const piece = displayGame.get(squareName);
      if (piece) {
        const pieceEl = createPieceEl(piece.color, piece.type);
        if (!shouldAnimate) {
          pieceEl.style.transition = "none";
          pieceEl.style.transform = "none";
        }
        square.appendChild(pieceEl);
      }

      if (col === 0) addCoord(square, "rank", squareName[1]);
      if (row === 7) addCoord(square, "file", squareName[0]);

      puzzleBoardEl.appendChild(square);
    }
  }

  if (shouldAnimate && animMove && oldPieceRect && animMove.to) {
    const toSquare = puzzleBoardEl.querySelector(
      `[data-square="${animMove.to}"]`,
    );
    const newPiece = toSquare?.querySelector(".piece");

    if (newPiece) {
      const newRect = newPiece.getBoundingClientRect();
      const deltaX = oldPieceRect.left - newRect.left;
      const deltaY = oldPieceRect.top - newRect.top;

      newPiece.style.transition = "none";
      newPiece.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      newPiece.offsetHeight;

      requestAnimationFrame(() => {
        newPiece.style.transition = animTransition();
        newPiece.style.transform = "translate(0, 0)";
      });
    }
  }
}

function renderRepertoireStrips(position) {
  const material = getMaterial(position);
  const bottomColor = repOrientation;
  const topColor = repOrientation === "w" ? "b" : "w";
  renderStrip(repStripBottomEl, bottomColor, material);
  renderStrip(repStripTopEl, topColor, material);
}

function syncView() {
  const moves = game.history();
  const total = moves.length;

  if (viewPly === null || viewPly >= total) {
    viewPly = null;
    return game;
  }

  const currentView = new Chess();
  for (let i = 0; i < viewPly; i++) {
    currentView.move(moves[i]);
  }
  return currentView;
}

function update(animate = true) {
  view = syncView();

  const showAnalysis =
    !document.querySelector("#play").hidden && !lesson && !trainMode;

  if (analysisPanel) analysisPanel.hidden = !showAnalysis;

  if (showAnalysis) {
    requestEngineEvaluation(view.fen(), "play");
  } else {
    if (analysisLinesEl) analysisLinesEl.textContent = "";
    if (analysisStatusEl)
      analysisStatusEl.textContent = "Analysis is available in normal Play.";
  }

  renderBoard(animate);
  renderStrips();
  renderStatus();
  renderOpening();
  renderRepertoire();
  renderMoves();
  renderRepLibrary();
  renderDrillAlternatives();
  renderDrillCompleteOverlay();
  renderLearnPanel();

  if (drill) {
    const animateDrill = drillAnimateNext;
    drillAnimateNext = false;
    renderRepertoireBoard(animateDrill);
  }
}

function clearSelection() {
  selectedSquare = null;
  legalMoves = [];
}

function playMove(from, to, promotion = "q", byDrill = false, animate = true) {
  if (lesson && !byDrill) {
    const expectedMove = lesson.variation.moves[lesson.index];
    if (!expectedMove) return;

    if (trainMode) {
      if (trainPhase !== "your-move") return;

      const move = game.move({ from, to, promotion });
      if (!move) return;
      viewPly = null;
      clearSelection();

      if (move.from !== expectedMove.from || move.to !== expectedMove.to) {
        handleTrainMistake(expectedMove, move);
        return;
      }
      playSound("promote", 2);

      lesson.index++;
      trainCorrectSquares = [move.from, move.to];

      clearTimeout(trainCorrectTimer);
      trainCorrectTimer = setTimeout(() => {
        trainCorrectSquares = [];
        update(false);
      }, 350);

      trainCorrectMoves++;
      trainMistakeCount = 0;
      trainHintShown = false;
      trainHintSquares = [];

      update(animate);
      continueTrain();
      return;
    }

    const expected = game.move(expectedMove.san, { sloppy: true });
    if (expected) {
      game.undo();
      if (expected.from !== from || expected.to !== to) {
        playSound("move");
        return;
      }
    } else {
      return;
    }
  }

  const target = game.get(to);
  const move = game.move({ from, to, promotion });
  if (!move) return;
  viewPly = null;

  if (game.isCheckmate()) playSound("gameover");
  else if (game.inCheck()) playSound("check");
  else if (move.flags.includes("k") || move.flags.includes("q"))
    playSound("castle");
  else if (move.flags.includes("p")) playSound("promote");
  else if (target || move.flags.includes("e")) playSound("capture");
  else playSound("move");

  if (lesson && !trainMode) {
    lesson.index++;
    const nextMove = lesson.variation.moves[lesson.index];
    learnHintMove = nextMove ? { from: nextMove.from, to: nextMove.to } : null;
  }

  clearSelection();
  update(animate);

  if (lesson) {
    requestEngineEvaluation(game.fen(), "play");
  }

  if (lesson && lesson.index >= lesson.variation.moves.length) {
    if (!trainMode && !lesson.learnSessionRecorded) {
      recordLearn(lesson.opening, lesson.variation);
      lesson.learnSessionRecorded = true;
      renderProfileProgress();
    }
    const message = document.getElementById("learn-complete-message");
    message.innerHTML = `You've completed <span class="completed-variation">${lesson.variation.name}</span>!`;

    const overlay = document.getElementById("learn-complete-overlay");
    playSound("promote");
    overlay.hidden = true;
    clearTimeout(learnCompleteTimer);

    learnCompleteTimer = setTimeout(() => {
      if (lesson && lesson.index >= lesson.variation.moves.length) {
        if (trainMode) renderLearnTrainCompleteStats();
        overlay.hidden = false;
      }
    }, 400);
  }

  if (drill) {
    if (byDrill) advanceDrill();
    else onDrillMove(move);
  }
}

function handleTrainMistake(expectedMove, playedMove) {
  trainPhase = "mistake";
  trainMistakeCount++;
  trainTotalMistakes++;
  playSound("gameover", 2);

  trainHintSquares =
    trainMistakeCount === 1
      ? [expectedMove.from]
      : [expectedMove.from, expectedMove.to];

  const boardWrap = boardEl.closest(".board-wrap");
  if (boardWrap) {
    boardWrap.classList.remove("board-shake");
    void boardWrap.offsetWidth;
    boardWrap.classList.add("board-shake");
  }

  update(false);

  clearTimeout(trainMistakeTimer);
  trainMistakeTimer = setTimeout(() => {
    if (!trainMode || trainPhase !== "mistake") return;

    game.undo();
    trainPhase = "your-move";
    clearSelection();
    update(false);

    if (boardWrap) boardWrap.classList.remove("board-shake");
    trainMistakeTimer = null;
  }, 650);
}

function continueTrain() {
  if (!trainMode || !lesson || !lesson.variation) return;

  const moves = lesson.variation.moves;

  if (lesson.index >= moves.length) {
    trainPhase = "complete";

    if (!lesson.trainSessionRecorded) {
      const total = trainCorrectMoves + trainTotalMistakes;
      const accuracy = total > 0 ? (trainCorrectMoves / total) * 100 : 100;
      recordTrain(lesson.opening, lesson.variation, accuracy);
      lesson.trainSessionRecorded = true;
      renderProfileProgress();
    }

    const message = document.getElementById("learn-complete-message");
    message.innerHTML = `You've completed <span class="completed-variation">${lesson.variation.name}</span>!`;

    playSound("promote", 0.5);

    const overlay = document.getElementById("learn-complete-overlay");
    overlay.hidden = true;

    clearTimeout(learnCompleteTimer);
    learnCompleteTimer = setTimeout(() => {
      if (trainMode && trainPhase === "complete") {
        renderLearnTrainCompleteStats();
        overlay.hidden = false;
      }
    }, 400);
    renderLearnPanel();
    return;
  }

  if (game.turn() !== lesson.opening.color[0]) {
    trainPhase = "opponent";

    clearTimeout(trainOpponentTimer);
    trainOpponentTimer = setTimeout(() => {
      if (!trainMode || !lesson || trainPhase !== "opponent") return;

      const moveData = moves[lesson.index];
      if (!moveData) return;

      const move = game.move({
        from: moveData.from,
        to: moveData.to,
        promotion: moveData.promotion || "q",
      });

      if (!move) return;

      lesson.index++;
      playSound(move.captured ? "capture" : "move");

      trainPhase = "your-move";
      trainHintShown = false;
      trainHintSquares = [];

      update(false);
      requestEngineEvaluation(game.fen(), "play");
      continueTrain();
    }, 500);

    renderLearnPanel();
    return;
  }

  trainPhase = "your-move";
  renderLearnPanel();
}

boardEl?.addEventListener("pointerdown", (e) => {
  if (lesson && !trainMode) return;
  if (trainMode && trainPhase !== "your-move") return;
  if (e.button !== 0 || drag) return;
  if (viewPly !== null) return;
  if (drill && drill.phase !== "your-move") return;

  const name = squareFromPoint(e.clientX, e.clientY);
  if (!name) return;
  e.preventDefault();

  if (selectedSquare && legalMoves.some((m) => m.to === name)) {
    const fromSq = selectedSquare;
    pickPromotion(game, fromSq, name).then((p) => {
      if (p) playMove(fromSq, name, p);
      else renderBoard();
    });
    return;
  }

  const piece = game.get(name);
  if (piece && piece.color === game.turn()) {
    const wasSelected = selectedSquare === name;
    selectedSquare = name;
    legalMoves = game.moves({ square: name, verbose: true });
    renderBoard();

    drag = {
      from: name,
      piece,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      wasSelected,
      ghost: null,
      size: 0,
    };
    return;
  }

  clearSelection();
  renderBoard();
});

window.addEventListener("pointermove", (e) => {
  if (!drag) return;

  if (!drag.moved) {
    const distance = Math.hypot(
      e.clientX - drag.startX,
      e.clientY - drag.startY,
    );
    if (distance < DRAG_THRESHOLD) return;
    startDrag();
  }

  moveGhost(e.clientX, e.clientY);
  updateHover(squareFromPoint(e.clientX, e.clientY));
});

window.addEventListener("pointerup", (e) => endDrag(e));
window.addEventListener("pointercancel", (e) => endDrag(e, true));

drillStopBtn?.addEventListener("click", () => {
  const isRepertoireDrill = !!drill?.rep;
  endDrill();

  if (isRepertoireDrill) {
    drillGame.reset();
    repertoireGame.reset();
    repViewPly = null;
    repSelectedSquare = null;
    repLegalMoves = [];
    drillHintSquares = [];
    updateRepertoirePage(false);
  } else {
    game.reset();
    viewPly = null;
    drillHintSquares = [];
    clearSelection();
    update();
  }

  renderDrillCompleteOverlay();
});

drillContinueBtn?.addEventListener("click", () => {
  if (!drill) return;
  const rep = drill.rep;
  const availableLines = getAvailableDrillLines(rep);
  const nextLine = availableLines.find(
    (line) => !completedDrillLines.has(getLineId(line)),
  );

  if (!nextLine) {
    drillCompleteStats.textContent = "All lines completed! Great work.";
    drillContinueBtn.hidden = true;
    return;
  }

  drillLinePath = nextLine;
  startDrill();
});

function startRepDrag() {
  repDrag.moved = true;
  const size = repBoardEl.getBoundingClientRect().width / 8;
  const ghost = createPieceEl(
    repDrag.piece.color,
    repDrag.piece.type,
    "drag-ghost",
  );

  ghost.style.width = `${size}px`;
  ghost.style.height = `${size}px`;
  document.body.appendChild(ghost);

  repDrag.ghost = ghost;
  repDrag.size = size;

  const origin = repBoardEl.querySelector(
    `[data-square="${repDrag.from}"] .piece`,
  );
  if (origin) origin.classList.add("dragging");
}

function moveRepGhost(x, y) {
  if (!repDrag?.ghost) return;
  repDrag.ghost.style.left = `${x - repDrag.size / 2}px`;
  repDrag.ghost.style.top = `${y - repDrag.size / 2}px`;
}

function setRepHover(name, active) {
  if (!name) return;
  const square = repBoardEl.querySelector(`[data-square="${name}"]`);
  if (square) square.classList.toggle("drag-over", active);
}

function updateRepHover(name) {
  if (name === repHoverSquare) return;
  setRepHover(repHoverSquare, false);
  repHoverSquare = name;
  setRepHover(name, true);
}

function startDrag() {
  drag.moved = true;
  const size = boardEl.getBoundingClientRect().width / 8;
  const ghost = createPieceEl(drag.piece.color, drag.piece.type, "drag-ghost");
  ghost.style.width = `${size}px`;
  ghost.style.height = `${size}px`;
  document.body.appendChild(ghost);

  drag.ghost = ghost;
  drag.size = size;

  const origin = boardEl.querySelector(`[data-square="${drag.from}"] .piece`);
  if (origin) origin.classList.add("dragging");
}

function moveGhost(x, y) {
  drag.ghost.style.left = `${x - drag.size / 2}px`;
  drag.ghost.style.top = `${y - drag.size / 2}px`;
}

function setHover(name, on) {
  if (!name) return;
  const el = boardEl.querySelector(`[data-square="${name}"]`);
  if (el) el.classList.toggle("drag-over", on);
}

function updateHover(name) {
  if (name === hoverSquare) return;
  setHover(hoverSquare, false);
  hoverSquare = name;
  setHover(name, true);
}

function endDrag(e, cancelled = false) {
  if (trainMode && trainPhase !== "your-move") return;
  if (!drag) return;

  const { from, moved, wasSelected, ghost } = drag;
  if (ghost) ghost.remove();
  setHover(hoverSquare, false);
  hoverSquare = null;
  drag = null;

  if (!moved) {
    if (wasSelected) clearSelection();
    renderBoard();
    return;
  }

  const target = cancelled ? null : squareFromPoint(e.clientX, e.clientY);
  if (target && legalMoves.some((m) => m.to === target)) {
    pickPromotion(game, from, target).then((p) => {
      if (p) playMove(from, target, p, false, false);
      else renderBoard();
    });
    return;
  }

  if (target !== from) clearSelection();
  renderBoard();
}

movesEl?.addEventListener("click", (e) => {
  const moveEl = e.target.closest(".move");
  if (!moveEl) return;
  goToPly(Number(moveEl.dataset.ply));
});

document.getElementById("play-nav-first")?.addEventListener("click", () => {
  goToPlyAnimated(0);
});
document.getElementById("play-nav-prev")?.addEventListener("click", () => {
  const sanMoves = game.history();
  const current = viewPly ?? sanMoves.length;
  if (current > 0) goToPlyAnimated(current - 1);
});
document.getElementById("play-nav-next")?.addEventListener("click", () => {
  const sanMoves = game.history();
  const current = viewPly ?? sanMoves.length;
  if (current < sanMoves.length) goToPlyAnimated(current + 1);
});
document.getElementById("play-nav-last")?.addEventListener("click", () => {
  const sanMoves = game.history();
  goToPlyAnimated(sanMoves.length);
});

function goToPlyAnimated(ply) {
  const sanMoves = game.history();
  const total = sanMoves.length;

  if (total === 0 || ply < 0 || ply > total) return;
  const previousPly = viewPly ?? total;
  if (ply === previousPly) return;

  const tempGame = new Chess();
  let lastPlayed = null;
  for (let i = 0; i < ply; i++) {
    lastPlayed = tempGame.move(sanMoves[i]);
  }

  let animation = false;
  if (ply === previousPly + 1 && lastPlayed) {
    animation = { from: lastPlayed.from, to: lastPlayed.to };
    playSoundForMove(lastPlayed);
  } else if (ply === previousPly - 1) {
    const undoneGame = new Chess();
    for (let i = 0; i < previousPly; i++) undoneGame.move(sanMoves[i]);
    const m = undoneGame.undo();
    if (m) {
      animation = { from: m.to, to: m.from };
      playSoundForMove(m);
    }
  }

  viewPly = ply === total ? null : ply;
  selectedSquare = null;
  legalMoves = [];

  view = syncView();
  renderBoard(animation);
  renderStrips();
  renderStatus();
  renderOpening();
  renderMoves();
}

document.getElementById("rep-nav-first")?.addEventListener("click", () => {
  goToRepPlyAnimated(0);
});
document.getElementById("rep-nav-prev")?.addEventListener("click", () => {
  const history = repertoireGame.history();
  const current = repViewPly ?? history.length;
  if (current > 0) goToRepPlyAnimated(current - 1);
});
document.getElementById("rep-nav-next")?.addEventListener("click", () => {
  const history = repertoireGame.history();
  const current = repViewPly ?? history.length;
  if (current < history.length) goToRepPlyAnimated(current + 1);
});
document.getElementById("rep-nav-last")?.addEventListener("click", () => {
  const history = repertoireGame.history();
  goToRepPlyAnimated(history.length);
});

function goToRepPlyAnimated(ply) {
  const history = repertoireGame.history();
  const total = history.length;

  if (ply < 0 || ply > total) return;
  const previousPly = repViewPly ?? total;
  if (ply === previousPly) return;

  const tempGame = new Chess();
  let lastPlayed = null;
  for (let i = 0; i < ply; i++) {
    lastPlayed = tempGame.move(history[i]);
  }

  let animation = false;
  if (ply === previousPly + 1 && lastPlayed) {
    animation = { from: lastPlayed.from, to: lastPlayed.to };
    playSoundForMove(lastPlayed);
  } else if (ply === previousPly - 1) {
    const undoneMove = new Chess();
    for (let i = 0; i < previousPly; i++) undoneMove.move(history[i]);
    const m = undoneMove.undo();
    if (m) {
      animation = { from: m.to, to: m.from };
      playSoundForMove(m);
    }
  }

  repViewPly = ply >= total ? null : ply;
  repSelectedSquare = null;
  repLegalMoves = [];

  renderRepertoireBoard(animation);
  renderRepertoireMoves();

  const displayGame = drill ? drillGame : syncRepView();
  if (repStatusEl) {
    repStatusEl.textContent =
      displayGame.turn() === "w" ? "White to move" : "Black to move";
  }
  renderRepertoireStrips(displayGame);
  renderRepertoireOpening(displayGame);
  requestEngineEvaluation(displayGame.fen(), "repertoire");
  renderRepertoire();
  renderRepLibrary();
}

window.addEventListener("keydown", (e) => {
  if (
    drag ||
    repDrag ||
    drill ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
  ) {
    return;
  }

  if (lesson && !trainMode) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      previousLessonMove();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextLessonMove();
    }
    return;
  }

  const isRepPage = !pages.repertoire.hidden;
  const isPlayPage = !pages.play.hidden;
  const isAnalysePage = !pages.analyse.hidden;

  if (!isRepPage && !isPlayPage && !isAnalysePage) return;

  let current, maxPly;
  if (isPlayPage) {
    const sanMoves = game.history();
    maxPly = sanMoves.length;
    current = viewPly ?? maxPly;
  } else if (isRepPage) {
    const history = repertoireGame.history();
    maxPly = history.length;
    current = repViewPly ?? maxPly;
  } else if (isAnalysePage) {
    maxPly = analyseHistory.length;
    current = analyseCurrentPly;
  }

  let nextPly = current;
  if (e.key === "ArrowLeft") nextPly = current - 1;
  else if (e.key === "ArrowRight") nextPly = current + 1;
  else if (e.key === "Home") nextPly = 0;
  else if (e.key === "End") nextPly = maxPly;
  else return;

  if (nextPly < 0 || nextPly > maxPly) return;
  e.preventDefault();

  if (isPlayPage) goToPlyAnimated(nextPly);
  else if (isRepPage) goToRepPlyAnimated(nextPly);
  else if (isAnalysePage) goToAnalysePly(nextPly);
});

undoBtnEl?.addEventListener("click", () => {
  if (drill) return;
  game.undo();
  viewPly = null;
  clearSelection();
  update(false);
});

document.getElementById("btn-flip")?.addEventListener("click", () => {
  orientation = orientation === "w" ? "b" : "w";
  update();
});

document.getElementById("btn-reset")?.addEventListener("click", () => {
  if (drill) {
    startDrill();
    return;
  }
  game.reset();
  viewPly = null;
  clearSelection();
  update();
});

let openingBook = null;
let curatedOpening = null;
let openingLibrary = curatedOpening ? [curatedOpening] : [];
let lesson = null;
let savedPlayState = null;

const OPENING_PROGRESS_KEY = "azurite-opening-progress";

function loadOpeningProgress() {
  try {
    return JSON.parse(localStorage.getItem(OPENING_PROGRESS_KEY) || "{}");
  } catch {
    return {};
  }
}

let openingProgress = loadOpeningProgress();

function getOpeningProgress(opening, variation) {
  const openingId = opening.id || opening.name;
  const variationId = variation.id || variation.name;

  openingProgress[openingId] ??= {
    name: opening.name,
    studied: false,
    learnCount: 0,
    variations: {},
  };

  const data = openingProgress[openingId];
  data.variations[variationId] ??= {
    name: variation.name,
    studied: false,
    learnCount: 0,
    trainCount: 0,
    progress: 0,
  };

  const variationData = data.variations[variationId];
  if (variationData.progress === undefined) {
    variationData.progress = Math.min(
      100,
      (variationData.perfectTrainCount || 0) * 25,
    );
  }

  return variationData;
}

function saveOpeningProgress() {
  localStorage.setItem(OPENING_PROGRESS_KEY, JSON.stringify(openingProgress));
}

function recordLearn(opening, variation) {
  const variationData = getOpeningProgress(opening, variation);
  const openingData = openingProgress[opening.id || opening.name];

  openingData.name = opening.name;
  openingData.studied = true;

  variationData.studied = true;
  variationData.learnCount++;
  variationData.progress = Math.min(100, (variationData.progress || 0) + 2);

  saveOpeningProgress();
}

function recordTrain(opening, variation, accuracy) {
  const variationData = getOpeningProgress(opening, variation);
  variationData.trainCount++;

  const earnedProgress = accuracy * 0.25;
  variationData.progress = Math.min(
    100,
    (variationData.progress || 0) + earnedProgress,
  );

  saveOpeningProgress();
}

function getVariationProgress(variationData) {
  return Math.round(variationData.progress || 0);
}

function renderProfileProgress() {
  renderPuzzleProfile();

  const container = document.getElementById("profile-opening-progress");
  if (!container) return;

  const openings = Object.values(openingProgress).filter(
    (opening) => opening.studied,
  );
  const mastered = openings.reduce((total, opening) => {
    return (
      total +
      Object.values(opening.variations).filter(
        (variation) => variation.perfectTrainCount >= 4,
      ).length
    );
  }, 0);

  const perfectTrainings = openings.reduce((total, opening) => {
    return (
      total +
      Object.values(opening.variations).reduce((sum, variation) => {
        return sum + (variation.trainCount || 0);
      }, 0)
    );
  }, 0);

  document.getElementById("profile-openings-count").textContent =
    openings.length;
  document.getElementById("profile-mastered-count").textContent = mastered;
  document.getElementById("profile-perfect-count").textContent =
    perfectTrainings;

  container.innerHTML = "";

  if (!openings.length) {
    container.innerHTML =
      '<p class="profile-empty">No opening progress yet. Start learning an opening!</p>';
    return;
  }

  openings.forEach((opening) => {
    const variations = Object.values(opening.variations);
    const openingPercent = variations.length
      ? Math.round(
          variations.reduce(
            (sum, variation) => sum + getVariationProgress(variation),
            0,
          ) / variations.length,
        )
      : 0;

    const card = document.createElement("article");
    card.className = "profile-opening-card";

    const header = document.createElement("div");
    header.className = "profile-opening-header";

    const title = document.createElement("h3");
    title.textContent = opening.name;

    const percent = document.createElement("strong");
    percent.textContent = `${openingPercent}%`;

    header.append(title, percent);

    const track = document.createElement("div");
    track.className = "profile-progress-track";

    const fill = document.createElement("div");
    fill.className = "profile-progress-fill";
    fill.style.width = `${openingPercent}%`;

    track.appendChild(fill);
    card.append(header, track);

    variations.forEach((variation) => {
      const row = document.createElement("div");
      row.className = "profile-variation-row";

      const rowHeader = document.createElement("div");
      rowHeader.className = "profile-variation-header";

      const name = document.createElement("span");
      name.textContent = variation.name;

      const value = document.createElement("strong");
      value.textContent = `${getVariationProgress(variation)}%`;

      rowHeader.append(name, value);

      const rowTrack = document.createElement("div");
      rowTrack.className = "profile-progress-track";

      const rowFill = document.createElement("div");
      rowFill.className = "profile-progress-fill";
      rowFill.style.width = `${getVariationProgress(variation)}%`;

      rowTrack.appendChild(rowFill);
      row.append(rowHeader, rowTrack);
      card.appendChild(row);
    });

    container.appendChild(card);
  });
}

function startTrain(opening) {
  if (drill) endDrill();
  if (lesson) exitLearn();

  startLearn(opening, false);

  trainMode = true;
  trainHintShown = false;
  trainHintSquares = [];
  trainPhase = "your-move";
  trainMistakeCount = 0;
  trainCorrectMoves = 0;
  trainTotalMistakes = 0;

  lesson.mode = "train";

  document.getElementById("learn-title").textContent =
    `${opening.name} · Train`;
  document.getElementById("train-hint").hidden = false;

  renderLearnPanel();
  update();
  continueTrain();
}

function startCurrentLearnTrain() {
  if (!lesson || !lesson.variation) return;

  clearTimeout(learnCompleteTimer);
  clearTimeout(trainMistakeTimer);
  clearTimeout(trainOpponentTimer);

  game.reset();
  viewPly = null;
  clearSelection();

  lesson.index = 0;
  lesson.trainSessionRecorded = false;
  lesson.sessionRecorded = false;

  trainMode = true;
  trainHintShown = false;
  trainHintSquares = [];
  trainPhase = "your-move";
  trainMistakeCount = 0;
  learnHintMove = null;
  trainCorrectMoves = 0;
  trainTotalMistakes = 0;

  document.getElementById("learn-complete-overlay").hidden = true;
  document.getElementById("train-hint").hidden = false;

  showPage("play");
  update();
  continueTrain();
}

function startLearn(opening, recordStudy = true) {
  if (drill) endDrill();

  savedPlayState = {
    pgn: game.pgn(),
    orientation,
  };

  curatedOpening = opening;
  game.reset();
  viewPly = null;
  clearSelection();

  lesson = {
    opening,
    variation: null,
    index: 0,
  };

  orientation = opening.color === "black" ? "b" : "w";
  const select = document.getElementById("learn-variation-select");
  select.innerHTML = "";

  opening.variations.forEach((variation) => {
    const option = document.createElement("option");
    option.value = variation.id;
    option.textContent = variation.name;
    select.appendChild(option);
  });

  const firstVariation = opening.variations[0];
  if (firstVariation) {
    select.value = firstVariation.id;
    lesson.variation = firstVariation;
    lesson.index = 0;
  }

  if (recordStudy && firstVariation) {
    recordLearn(opening, firstVariation);
  }

  showPage("play");
  update();
}

function selectLearnVariation() {
  if (!lesson) return;

  const select = document.getElementById("learn-variation-select");
  const variationId = select.value;
  const variation = lesson.opening.variations.find(
    (item) => item.id === variationId,
  );

  if (!variation) return;

  game.reset();
  viewPly = null;
  clearSelection();

  lesson.variation = variation;
  lesson.index = 0;

  trainHintShown = false;
  trainHintSquares = [];
  trainPhase = "your-move";

  clearTimeout(trainMistakeTimer);
  clearTimeout(trainOpponentTimer);

  learnHintMove = null;
  document.getElementById("learn-complete-overlay").hidden = true;
  update();
}

function nextLessonMove() {
  if (!lesson || !lesson.variation) return;

  if (viewPly !== null) {
    viewPly = null;
    update(false);
  }

  const moves = lesson.variation.moves;
  if (lesson.index >= moves.length) return;

  const moveData = moves[lesson.index];
  playMove(moveData.from, moveData.to, "q", false);
}

function previousLessonMove() {
  if (!lesson || !lesson.variation || lesson.index === 0) return;

  if (viewPly !== null) viewPly = null;

  game.undo();
  lesson.index--;

  clearSelection();
  update(false);
}

function exitLearn() {
  if (!lesson) return;

  trainMode = false;
  trainHintShown = false;
  trainHintSquares = [];
  trainPhase = "your-move";

  clearTimeout(trainMistakeTimer);
  clearTimeout(trainOpponentTimer);

  document.getElementById("train-hint").hidden = true;
  document.getElementById("learn-progress").hidden = false;
  document.getElementById("learn-explanation").hidden = false;
  document.getElementById("learn-back").hidden = false;
  document.getElementById("learn-next").hidden = false;

  game.reset();
  if (savedPlayState?.pgn) game.loadPgn(savedPlayState.pgn);
  if (savedPlayState) orientation = savedPlayState.orientation;

  lesson = null;
  savedPlayState = null;
  viewPly = null;
  clearSelection();
  update();
}

function renderLearnPanel() {
  const panel = document.getElementById("learn-panel");
  if (!panel) return;

  panel.hidden = !lesson;
  if (!lesson) return;

  const isTrain = trainMode;

  document.getElementById("learn-progress").hidden = isTrain;
  document.getElementById("learn-explanation").hidden = isTrain;
  document.getElementById("learn-back").hidden = isTrain;
  document.getElementById("learn-next").hidden = isTrain;
  document.getElementById("learn-exit").hidden = false;

  const hintButton = document.getElementById("train-hint");
  hintButton.hidden = !isTrain;
  hintButton.disabled = !isTrain || trainPhase !== "your-move";
  hintButton.textContent = "Hint";
  hintButton.classList.toggle("active", trainHintShown);

  document.getElementById("learn-title").textContent =
    `${lesson.opening.name} · ${lesson.variation?.name || ""} · ${isTrain ? "Train" : "Learn"}`;

  if (!lesson.variation) {
    document.getElementById("learn-progress").textContent =
      "Choose a variation to begin.";
    document.getElementById("learn-explanation").textContent =
      "Starting position. Press Next to begin.";
    document.getElementById("learn-back").disabled = true;
    document.getElementById("learn-next").disabled = true;
    return;
  }

  const moves = lesson.variation.moves;
  const currentMove = moves[lesson.index - 1];

  document.getElementById("learn-progress").textContent =
    `Move ${lesson.index} / ${moves.length}`;
  document.getElementById("learn-explanation").textContent =
    currentMove?.explanation || "Starting position. Press Next to begin.";
  document.getElementById("learn-back").disabled = lesson.index === 0;
  document.getElementById("learn-next").disabled = lesson.index >= moves.length;
}

function renderOpenings() {
  const list = document.querySelector("#openings-list");
  if (!list) return;
  list.innerHTML = "";

  const visibleOpenings = openingLibrary.filter((opening) => {
    if (openingFilter === "favorites") {
      return favoriteOpenings.has(opening.name);
    }
    return true;
  });

  if (visibleOpenings.length === 0) {
    list.innerHTML = "<p class='empty-favorites'>No openings found.</p>";
    return;
  }

  visibleOpenings.forEach((opening) => {
    const card = document.createElement("article");
    card.className = "opening-card";

    const title = document.createElement("h2");
    title.textContent = opening.name;

    const description = document.createElement("p");
    description.textContent = opening.description;

    const color = document.createElement("span");
    color.className = `opening-color ${opening.color}`;
    color.textContent = opening.color === "white" ? "White" : "Black";

    const actions = document.createElement("div");
    actions.className = "opening-card-actions";

    const learnButton = document.createElement("button");
    learnButton.textContent = "Learn";

    const trainButton = document.createElement("button");
    trainButton.textContent = "Train";

    learnButton.addEventListener("click", () => startLearn(opening));
    trainButton.addEventListener("click", () => startTrain(opening));

    actions.append(learnButton, trainButton);
    card.append(
      title,
      createFavoriteButton(opening),
      description,
      color,
      actions,
    );

    list.append(card);
  });
}

function createFavoriteButton(opening) {
  const button = document.createElement("button");
  button.className = "opening-favorite";
  button.type = "button";
  button.textContent = favoriteOpenings.has(opening.name) ? "★" : "☆";

  button.addEventListener("click", () => {
    if (favoriteOpenings.has(opening.name)) {
      favoriteOpenings.delete(opening.name);
    } else {
      favoriteOpenings.add(opening.name);
    }

    localStorage.setItem(
      "azurite-favorites",
      JSON.stringify([...favoriteOpenings]),
    );
    renderOpenings();
  });

  return button;
}

function renderRepertoireOpening(position) {
  if (!repOpeningEl) return;
  repOpeningEl.classList.remove("dim");

  if (!openingBook) {
    repOpeningEl.textContent = "";
    return;
  }

  const sanMoves = position.history();
  if (sanMoves.length === 0) {
    repOpeningEl.textContent = "Starting position";
    return;
  }

  const hit = openingBook.find(sanMoves, Chess);
  if (!hit) {
    repOpeningEl.textContent = "No named opening";
    repOpeningEl.classList.add("dim");
    return;
  }

  repOpeningEl.textContent = `${hit.eco} · ${hit.name}`;
}

function renderOpening() {
  if (!openingEl) return;
  openingEl.classList.remove("dim");

  if (!openingBook) {
    openingEl.textContent = "";
    return;
  }

  const sanMoves = view.history();
  if (sanMoves.length === 0) {
    openingEl.textContent = "Starting position";
    return;
  }

  const hit = openingBook.find(sanMoves, Chess);
  if (!hit) {
    openingEl.textContent = "No named opening";
    openingEl.classList.add("dim");
    return;
  }

  openingEl.textContent = `${hit.eco} · ${hit.name}`;
}

fetch("./assets/openings.json")
  .then((res) => res.json())
  .then((rows) => {
    openingBook = OpeningBook.build(rows, Chess);
    renderOpening();
  })
  .catch((err) => console.warn("Could not load openings.json", err));

importRepBtnEl?.addEventListener("click", () => {
  pgnFileEl.click();
});

const library = Library.load();
let repNotice = { text: "", isError: false };
let drill = null;
let completedDrillLines = new Set();
let drillLinePath = [];

if (library.active) orientation = library.active.color;

function setNotice(text, isError = false) {
  repNotice = { text, isError };
}

function persist() {
  if (!library.save()) {
    setNotice("Could not save to browser storage (full or blocked).", true);
  }
}

function renderRepertoire() {
  const repertoire = library.active;
  if (undoBtnEl) undoBtnEl.disabled = !!drill;
  if (drillBtnEl) drillBtnEl.hidden = true;

  if (repNoticeEl) {
    repNoticeEl.textContent = repNotice.text;
    repNoticeEl.classList.toggle("error", repNotice.isError);
  }

  if (repNextEl) repNextEl.innerHTML = "";
  if (repCommentEl) repCommentEl.textContent = "";
  if (repTurnEl) {
    repTurnEl.textContent = "";
    repTurnEl.classList.remove("off");
  }
  if (drillActionEl) drillActionEl.hidden = true;

  if (!repertoire) {
    if (repInfoEl)
      repInfoEl.textContent = "No repertoire yet. Import a PGN file to start.";
    return;
  }

  const last = repertoireGame.history({ verbose: true }).at(-1);
  if (last && last.before) {
    const edge = repertoire.getNode(last.before)?.edges.get(last.san);
    if (edge && edge.comment && repCommentEl)
      repCommentEl.textContent = edge.comment;
  }

  if (drill) {
    renderDrillStatus();
    return;
  }

  const node = repertoire.getNode(repertoireGame.fen());
  if (!node) {
    if (repTurnEl) {
      repTurnEl.textContent = "Out of repertoire";
      repTurnEl.classList.add("off");
    }
    return;
  }
  if (node.edges.size === 0) {
    if (repTurnEl) repTurnEl.textContent = "End of line";
    return;
  }

  if (repTurnEl) {
    repTurnEl.textContent =
      repertoireGame.turn() === repertoire.color
        ? "Your move"
        : "Opponent's options";
  }

  let first = true;
  for (const edge of node.edges.values()) {
    const btn = document.createElement("button");
    btn.className = "rep-move" + (first ? " main" : "");
    btn.dataset.san = edge.san;
    btn.textContent = edge.san;
    if (edge.comment) btn.title = edge.comment;
    repNextEl?.appendChild(btn);
    first = false;
  }
}

repNextEl?.addEventListener("click", (e) => {
  if (drill) return;
  const btn = e.target.closest(".rep-move");
  if (!btn) return;

  const move = repertoireGame
    .moves({ verbose: true })
    .find((m) => m.san === btn.dataset.san);
  if (!move) return;

  repertoireGame.move({
    from: move.from,
    to: move.to,
    promotion: move.promotion || "q",
  });

  repSelectedSquare = null;
  repLegalMoves = [];
  updateRepertoirePage();
});

pgnFileEl?.addEventListener("change", async () => {
  const file = pgnFileEl.files[0];
  pgnFileEl.value = "";
  if (!file) return;

  const defaultName =
    file.name.replace(/\.[^.]+$/, "").slice(0, 60) || "Repertoire";
  const rep = new Repertoire({ color: "w", name: defaultName });
  const result = importPgn(await file.text(), Chess, rep);

  if (result.games === 0 || rep.stats().moves === 0) {
    setNotice(
      result.errors.length
        ? `Nothing imported. ${result.errors[0].message}`
        : "No moves found in that file.",
      true,
    );
    update();
    return;
  }

  const name = prompt("Name this repertoire", defaultName);
  if (name === null) {
    setNotice("Import cancelled.");
    update();
    return;
  }
  rep.name = name.trim().slice(0, 60) || defaultName;

  endDrill();
  library.add(rep);
  orientation = rep.color;

  let text = `Imported "${rep.name}": ${result.games} game${result.games === 1 ? "" : "s"}, ${rep.stats().moves} moves.`;
  if (result.errors.length) {
    const e = result.errors[0];
    text +=
      ` ${result.errors.length} problem${result.errors.length === 1 ? "" : "s"}` +
      ` (game ${e.game}: ${e.message}).`;
  }
  setNotice(text, result.errors.length > 0);
  persist();
  update();
});

const OPPONENT_DELAY_MS = 500;

function endDrill() {
  drillHintSquares = [];
  if (drill && drill.timer) clearTimeout(drill.timer);
  drill = null;
  clearTimeout(drillCompleteTimer);
  drillCompleteTimer = null;

  if (repTurnEl) {
    repTurnEl.classList.remove("your-turn-glow", "off");
    repTurnEl.textContent = "";
  }
}

function getAvailableDrillLines(rep) {
  const startFen = new Chess().fen();
  const lines = [];

  function walk(fen, path, visited) {
    const node = rep.getNode(fen);
    if (!node || node.edges.size === 0) {
      if (path.length > 0) lines.push([...path]);
      return;
    }

    for (const edge of node.edges.values()) {
      const nextPath = [...path, edge.uci];
      const nextVisited = new Set(visited);
      nextVisited.add(node.key);

      if (nextVisited.has(edge.to)) {
        lines.push(nextPath);
        continue;
      }

      walk(edge.to, nextPath, nextVisited);
    }
  }

  walk(startFen, [], new Set());
  return lines;
}

function getLineId(line) {
  return line.join(" ");
}

function startDrill() {
  const rep = library.active;
  if (!rep) return;

  endDrill();
  if (!completedDrillLines) completedDrillLines = new Set();

  repertoireGame.reset();
  drillGame.reset();
  drillHintSquares = [];
  repSelectedSquare = null;
  repLegalMoves = [];
  repViewPly = null;
  orientation = rep.color;

  drill = {
    rep,
    source: "repertoire",
    phase: "your-move",
    mistake: null,
    mistakeCount: 0,
    hintShown: false,
    alternatives: [],
    correctMoves: 0,
    mistakes: 0,
  };

  advanceDrill();
}

function advanceDrill() {
  if (!drill || drill.phase === "complete") return;

  const { rep } = drill;

  if (lineEnded(rep, drillGame.fen())) {
    drill.phase = "complete";
    playSound("promote");
    drill.empty = drillGame.history().length === 0;

    if (drillCompleteTimer) clearTimeout(drillCompleteTimer);
    if (drillCompleteOverlay) drillCompleteOverlay.hidden = true;

    drillCompleteTimer = setTimeout(() => {
      if (drill?.phase === "complete") update();
    }, 400);

    update();
    return;
  }

  if (drillGame.turn() === rep.color) {
    drill.phase = "your-move";
    update();
    return;
  }

  drill.phase = "opponent";
  update();
  drill.timer = setTimeout(() => {
    if (!drill) return;
    drill.timer = null;
    const edge = pickReply(rep, drillGame.fen());
    if (!edge) {
      advanceDrill();
      return;
    }
    const { from, to, promotion } = parseUci(edge.uci);
    const played = drillGame.move({ from, to, promotion });

    if (played) {
      playSound(played.captured ? "capture" : "move");
      drillAnimateNext = true; // rakip hamlesi kayarak gelsin
      update(false);
      advanceDrill();
    }
  }, OPPONENT_DELAY_MS);
}

function onDrillMove(move) {
  if (!drill) return;

  if (judgeMove(drill.rep, move.before, move.san)) {
    clearTimeout(drillMistakeTimer);
    drillMistakeTimer = null;

    drill.correctMoves++;
    drill.mistakeCount = 0;
    drill.hintShown = false;
    drillHintSquares = [];
    drill.alternatives = [];
    drill.mistake = null;
    renderDrillAlternatives();

    advanceDrill();
    return;
  }

  drill.mistakes++;
  drill.mistakeCount++;

  const node = drill.rep.getNode(move.before);
  const correctEdges = node ? [...node.edges.values()] : [];
  const correctEdge = correctEdges[0];

  if (correctEdge) {
    const parsed = parseUci(correctEdge.uci);
    drillHintSquares =
      drill.mistakeCount === 1 ? [parsed.from] : [parsed.from, parsed.to];
  } else {
    drillHintSquares = [];
  }

  if (drill.mistakeCount >= 2) {
    drill.hintShown = true;
    drill.alternatives = correctEdges.slice(0, 2);
  }

  drill.phase = "mistake";
  drill.mistake = move.san;
  playSound("gameover", 2);

  const boardWrap =
    document.querySelector(".board-wrap") ||
    document.querySelector("#rep-board")?.closest(".board-wrap") ||
    document.querySelector("#rep-board")?.parentElement;

  if (boardWrap) {
    boardWrap.classList.remove("board-shake");
    void boardWrap.offsetWidth;
    boardWrap.classList.add("board-shake");
  }

  clearTimeout(drillMistakeTimer);
  drillMistakeTimer = setTimeout(() => {
    if (!drill || drill.phase !== "mistake") return;

    drillGame.undo();
    viewPly = null;
    clearSelection();

    drill.phase = "your-move";
    drill.mistake = null;
    update();

    if (boardWrap) boardWrap.classList.remove("board-shake");
    drillMistakeTimer = null;
  }, 1000);

  update();
}

function retryDrill() {
  if (!drill || drill.phase !== "mistake") return;

  clearTimeout(drillMistakeTimer);
  drillMistakeTimer = null;

  drillGame.undo();
  viewPly = null;
  clearSelection();

  drill.phase = "your-move";
  drill.mistake = null;
  update();
}

function renderDrillStatus() {
  if (!repTurnEl) return;
  repTurnEl.classList.remove("your-turn-glow", "off");

  switch (drill.phase) {
    case "your-move":
      repTurnEl.textContent = "Your turn! Make your repertoire move.";
      repTurnEl.classList.add("your-turn-glow");
      break;
    case "opponent":
      repTurnEl.textContent = "Opponent's move...";
      break;
    case "mistake":
      repTurnEl.textContent = `Mistake: ${drill.mistake} is not in your repertoire.`;
      repTurnEl.classList.add("off");
      if (drillActionEl) {
        drillActionEl.textContent = "Try again";
        drillActionEl.hidden = false;
      }
      break;
    case "complete": {
      const total = drill.correctMoves + drill.mistakes;
      const accuracy = total
        ? Math.round((drill.correctMoves / total) * 100)
        : 100;
      repTurnEl.textContent = drill.empty
        ? "This repertoire has no moves."
        : `Line complete! ${accuracy}% accuracy`;

      if (drillActionEl) {
        drillActionEl.textContent = "Restart";
        drillActionEl.hidden = drill.empty;
      }
      break;
    }
  }
}

drillBtnEl?.addEventListener("click", () => {
  if (drill) {
    endDrill();
    update();
  } else {
    startDrill();
  }
});

// ==========================================
// LICHESS PUZZLE MOTORU & OLAYLAR (GÜNCELLENDİ)
// ==========================================

if (puzzleBoardEl) {
  puzzleBoardEl.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || puzzleDrag) return;
    if (!currentPuzzle || isPuzzleMistakeState) return;
    if (puzzleFinished || puzzleSolutionPlaying) return;
    if (puzzleViewPly !== null) return; // geçmiş pozisyona bakarken hamle yapılamaz
    if (puzzleGame.turn() !== puzzlePlayerColor) return;

    const name = puzzleSquareFromPoint(e.clientX, e.clientY);
    if (!name) return;
    e.preventDefault();

    if (puzzleSelectedSquare && puzzleLegalMoves.some((m) => m.to === name)) {
      executePuzzleMove(puzzleSelectedSquare, name, true); // tıkla-tıkla = animasyonlu // Tıklama = animasyon var
      return; // <-- Burada fonksiyon içinde olduğu için hata vermez!
    }

    const piece = puzzleGame.get(name);
    if (piece && piece.color === puzzlePlayerColor) {
      const wasSelected = puzzleSelectedSquare === name;
      puzzleSelectedSquare = name;
      puzzleLegalMoves = puzzleGame.moves({ square: name, verbose: true });
      renderPuzzleBoard(false);

      puzzleDrag = {
        from: name,
        piece,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
        wasSelected,
        ghost: null,
        size: 0,
      };
      return;
    }

    puzzleSelectedSquare = null;
    puzzleLegalMoves = [];
    renderPuzzleBoard(false);
  });
}

function puzzleSquareFromPoint(x, y) {
  if (!puzzleBoardEl) return null;
  const rect = puzzleBoardEl.getBoundingClientRect();
  const size = rect.width / 8;
  const col = Math.floor((x - rect.left) / size);
  const row = Math.floor((y - rect.top) / size);
  if (col < 0 || col > 7 || row < 0 || row > 7) return null;

  return puzzleOrientation === "w"
    ? FILES[col] + (8 - row)
    : FILES[7 - col] + (row + 1);
}

function setPuzzleHover(name, on) {
  if (!name) return;
  const el = puzzleBoardEl.querySelector(`[data-square="${name}"]`);
  if (el) el.classList.toggle("drag-over", on);
}

function updatePuzzleHover(name) {
  if (name === puzzleHoverSquare) return;
  setPuzzleHover(puzzleHoverSquare, false);
  puzzleHoverSquare = name;
  setPuzzleHover(name, true);
}

window.addEventListener("pointermove", (e) => {
  if (!puzzleDrag) return;

  if (!puzzleDrag.moved) {
    const distance = Math.hypot(
      e.clientX - puzzleDrag.startX,
      e.clientY - puzzleDrag.startY,
    );
    if (distance < DRAG_THRESHOLD) return;

    puzzleDrag.moved = true;
    const size = puzzleBoardEl.getBoundingClientRect().width / 8;
    const ghost = createPieceEl(
      puzzleDrag.piece.color,
      puzzleDrag.piece.type,
      "drag-ghost",
    );
    ghost.style.width = `${size}px`;
    ghost.style.height = `${size}px`;
    ghost.style.transition = "none";
    ghost.style.willChange = "left, top";
    document.body.appendChild(ghost);
    puzzleDrag.ghost = ghost;
    puzzleDrag.size = size;

    const origin = puzzleBoardEl.querySelector(
      `[data-square="${puzzleDrag.from}"] .piece`,
    );
    if (origin) origin.classList.add("dragging");
  }

  if (puzzleDrag.ghost) {
    puzzleDrag.ghost.style.left = `${e.clientX - puzzleDrag.size / 2}px`;
    puzzleDrag.ghost.style.top = `${e.clientY - puzzleDrag.size / 2}px`;
  }

  updatePuzzleHover(puzzleSquareFromPoint(e.clientX, e.clientY));
});

window.addEventListener("pointerup", (e) => endPuzzleDrag(e));
window.addEventListener("pointercancel", (e) => endPuzzleDrag(e, true));

function endPuzzleDrag(e, cancelled = false) {
  if (!puzzleDrag) return;

  const { from, moved, wasSelected, ghost } = puzzleDrag;
  if (ghost) ghost.remove();
  setPuzzleHover(puzzleHoverSquare, false);
  puzzleHoverSquare = null;
  puzzleDrag = null;

  const origin = puzzleBoardEl.querySelector(`[data-square="${from}"] .piece`);
  if (origin) origin.classList.remove("dragging");

  if (!moved) {
    if (wasSelected) {
      puzzleSelectedSquare = null;
      puzzleLegalMoves = [];
      renderPuzzleBoard(false);
    }
    return;
  }

  const target = cancelled ? null : puzzleSquareFromPoint(e.clientX, e.clientY);
  if (target && puzzleLegalMoves.some((m) => m.to === target)) {
    executePuzzleMove(from, target, false); // Sürükle-bırak ile animasyonsuz anında oturma
    return;
  }

  if (target !== from) {
    puzzleSelectedSquare = null;
    puzzleLegalMoves = [];
  }
  renderPuzzleBoard(false);
}
// ==========================================
// BULMACA (PUZZLE) HAMLE LİSTESİ RENDER
// ==========================================

// ==========================================
// LICHESS PUZZLE HAMLE LİSTESİ (DİĞER SAYFALARLA BİREBİR AYNI YAPIDA)
// ==========================================

function renderPuzzleMoves() {
  if (!puzzleMovesEl) return;
  puzzleMovesEl.innerHTML = "";

  if (!currentPuzzle) return;

  const allMoves = [...puzzleHistoryList];
  const activePly = puzzleViewPly ?? allMoves.length;

  for (let i = 0; i < allMoves.length; i += 2) {
    const li = document.createElement("li");

    for (const ply of [i + 1, i + 2]) {
      const san = allMoves[ply - 1];
      if (!san) break;

      const span = document.createElement("span");
      span.className = "move" + (ply === activePly ? " active" : "");
      span.dataset.ply = ply;
      span.textContent = san;
      li.appendChild(span);
    }

    puzzleMovesEl.appendChild(li);
  }

  const activeEl = puzzleMovesEl.querySelector(".move.active");
  if (activeEl) {
    puzzleMovesEl.scrollTop = activeEl.offsetTop - puzzleMovesEl.offsetTop - 10;
  }
}

puzzleMovesEl?.addEventListener("click", (e) => {
  const moveEl = e.target.closest(".move");
  if (!moveEl) return;
  goToPuzzlePly(Number(moveEl.dataset.ply));
});

function puzzleTotalPlies() {
  return puzzleGame.history().length;
}

document.getElementById("puzzle-nav-first")?.addEventListener("click", () => {
  goToPuzzlePly(0);
});
document.getElementById("puzzle-nav-prev")?.addEventListener("click", () => {
  goToPuzzlePly((puzzleViewPly ?? puzzleTotalPlies()) - 1);
});
document.getElementById("puzzle-nav-next")?.addEventListener("click", () => {
  goToPuzzlePly((puzzleViewPly ?? puzzleTotalPlies()) + 1);
});
document.getElementById("puzzle-nav-last")?.addEventListener("click", () => {
  goToPuzzlePly(puzzleTotalPlies());
});

async function initPuzzle() {
  renderPuzzleHistory();
  if (puzzleRatingEl) puzzleRatingEl.textContent = puzzleRating;

  // Sayfaya geri dönünce (örn. Analyse'tan) mevcut puzzle'ı koru
  if (puzzleHasPuzzle) {
    renderPuzzleBoard(false);
    renderPuzzleMoves();
    return;
  }
  await fetchNewPuzzle();
}

// ==========================================
// BULMACA YÜKLEME (1 SÜRE SONRA SON HAMLENİN OYNANMASI VE LİSTEYE EKLENMESİ)
// ==========================================

let puzzleLoadId = 0;
let puzzleFinished = false; // çözüldü ya da çözüm gösterildi
let puzzleHasPuzzle = false; // yüklenmiş bir puzzle var mı (sayfaya dönünce yeniden çekmemek için)
let puzzleSolutionPlaying = false;

function setPuzzleFinished(value) {
  puzzleFinished = value;
  const analyseBtn = document.getElementById("puzzle-btn-analyse");
  const solutionBtn = document.getElementById("puzzle-btn-solution");
  if (analyseBtn) analyseBtn.disabled = !value;
  if (solutionBtn) solutionBtn.disabled = value;
}

// Menüdeki seviye -> Elo aralığı + başlangıçta istenecek Lichess seviyesi
const LICHESS_DIFFICULTIES = [
  "easiest",
  "easier",
  "normal",
  "harder",
  "hardest",
];
const PUZZLE_LEVELS = {
  beginner: { min: 600, max: 1000, api: 0 },
  easy: { min: 1000, max: 1400, api: 1 },
  medium: { min: 1400, max: 1800, api: 2 },
  hard: { min: 1800, max: 2200, api: 3 },
  expert: { min: 2200, max: Infinity, api: 4 },
};
PUZZLE_LEVELS.master = PUZZLE_LEVELS.expert; // menüde "Master" yazıyorsa da çalışsın
const PUZZLE_MAX_ATTEMPTS = 4;
const PUZZLE_ATTEMPT_DELAY_MS = 500; // istekler arası bekleme (rate limit için)
const PUZZLE_RATE_LIMIT_MS = 60_000; // Lichess 429 verince 1 dakika bekle
let puzzleCooldownUntil = 0;

function puzzleDistanceToRange(rating, level) {
  if (rating < level.min) return level.min - rating;
  if (rating > level.max) return rating - level.max;
  return 0;
}

// Aralıkta bir puzzle bulana kadar dener; gelen rating düşük/yüksekse Lichess seviyesini ayarlar
async function fetchPuzzleInRange(level, loadId) {
  let apiIndex = level.api;
  let best = null;

  for (let attempt = 1; attempt <= PUZZLE_MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, PUZZLE_ATTEMPT_DELAY_MS),
      );
      if (loadId !== puzzleLoadId) return null;
    }

    if (puzzleStatusEl && attempt > 1) {
      puzzleStatusEl.textContent = `Finding a puzzle (${level.min}${Number.isFinite(level.max) ? "–" + level.max : "+"})... ${attempt}/${PUZZLE_MAX_ATTEMPTS}`;
    }

    const res = await fetch(
      `https://lichess.org/api/puzzle/next?angle=mix&difficulty=${LICHESS_DIFFICULTIES[apiIndex]}`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
    if (res.status === 429) {
      puzzleCooldownUntil = Date.now() + PUZZLE_RATE_LIMIT_MS;
      const err = new Error("Rate limited");
      err.rateLimited = true;
      throw err;
    }
    if (!res.ok) throw new Error("API error " + res.status);

    const data = await res.json();
    if (loadId !== puzzleLoadId) return null;

    const rating = data?.puzzle?.rating;
    if (typeof rating !== "number") {
      if (!best) best = { data, distance: Infinity };
      continue;
    }

    const distance = puzzleDistanceToRange(rating, level);
    if (distance === 0) return data;
    if (!best || distance < best.distance) best = { data, distance };

    // Çok düşükse bir seviye yukarı, çok yüksekse bir seviye aşağı
    if (rating < level.min) apiIndex = Math.min(apiIndex + 1, 4);
    else apiIndex = Math.max(apiIndex - 1, 0);
  }

  return best ? best.data : null;
}

let puzzleCooldownTimer = null;

function showPuzzleCooldown(loadId) {
  clearTimeout(puzzleCooldownTimer);
  const tick = () => {
    if (loadId !== puzzleLoadId) return;
    const left = Math.ceil((puzzleCooldownUntil - Date.now()) / 1000);
    if (left <= 0) {
      fetchNewPuzzle(); // süre doldu, otomatik tekrar dene
      return;
    }
    if (puzzleStatusEl)
      puzzleStatusEl.textContent = `Lichess rate limit reached. Retrying in ${left}s...`;
    puzzleCooldownTimer = setTimeout(tick, 1000);
  };
  tick();
}

async function fetchNewPuzzle() {
  const loadId = ++puzzleLoadId;
  clearTimeout(puzzleCooldownTimer);

  if (puzzleStatusEl)
    puzzleStatusEl.textContent = "Loading puzzle from Lichess...";
  if (puzzleMovesEl) puzzleMovesEl.innerHTML = "";

  puzzleHintStep = 0;
  puzzleSelectedSquare = null;
  puzzleLegalMoves = [];
  puzzleHintUsedInCurrent = false;
  puzzleDrag = null;
  puzzleViewPly = null;
  puzzleScoreRecorded = false;
  isPuzzleMistakeState = false;
  puzzleCorrectSquares = [];
  puzzleMistakeCount = 0;
  puzzleSolutionPlaying = false;
  puzzleHasPuzzle = false;
  setPuzzleFinished(false);
  currentPuzzle = null; // yükleme bitene kadar tahta kilitli

  if (Date.now() < puzzleCooldownUntil) {
    showPuzzleCooldown(loadId);
    return;
  }

  const difficultySelect = document.getElementById("puzzle-difficulty-select");
  const level = PUZZLE_LEVELS[difficultySelect?.value] || PUZZLE_LEVELS.medium;
  const levelKey = PUZZLE_LEVELS[difficultySelect?.value]
    ? difficultySelect.value
    : "medium";

  try {
    const data = await fetchPuzzleInRange(level, loadId);
    if (loadId !== puzzleLoadId) return; // arada skip/yeni istek geldiyse bunu çöpe at
    if (!data) throw new Error("No puzzle returned");

    const puzzleData = data.puzzle;
    if (!puzzleData || !data.game || !data.game.pgn)
      throw new Error("Invalid puzzle data");

    const solution = Array.isArray(puzzleData.solution)
      ? puzzleData.solution
      : String(puzzleData.solution).split(" ");

    // Lichess: oyunun ilk (initialPly + 1) hamlesi oynanır, sonuncusu rakibin hamlesidir.
    const gameFull = new Chess();
    gameFull.loadPgn(data.game.pgn);
    const pgnMoves = gameFull
      .history()
      .slice(0, (puzzleData.initialPly ?? gameFull.history().length - 1) + 1);
    if (!pgnMoves.length) throw new Error("Empty puzzle game");

    // Oyuncunun rengi = rakibin son hamlesinden sonra sırası gelen taraf
    const tempGame = new Chess();
    for (const san of pgnMoves) tempGame.move(san);
    puzzlePlayerColor = tempGame.turn();
    puzzleOrientation = puzzlePlayerColor;

    currentPuzzle = {
      id: puzzleData.id,
      solution,
      rating: puzzleData.rating || puzzleRating,
      levelKey,
    };

    // Tahtayı rakibin son hamlesinden önceki konuma kur
    puzzleGame.reset();
    puzzleHistoryList = [];
    const lastSanMove = pgnMoves.pop();
    for (const san of pgnMoves) {
      puzzleGame.move(san);
      puzzleHistoryList.push(san);
    }

    puzzleSolutionIndex = 0;

    // Rakip hamlesi gelene kadar oyuncu hamle yapmasın
    const lockedPuzzle = currentPuzzle;
    puzzleHasPuzzle = true;
    currentPuzzle = null;

    renderPuzzleBoard(false);
    renderPuzzleMoves();

    if (puzzleStatusEl) {
      puzzleStatusEl.textContent =
        "Get ready! Opponent is making their move...";
    }

    setTimeout(() => {
      if (loadId !== puzzleLoadId) return;
      currentPuzzle = lockedPuzzle;

      puzzleViewPly = null;
      const played = puzzleGame.move(lastSanMove);
      if (played) {
        puzzleHistoryList.push(played.san);

        if (puzzleGame.isCheckmate()) playSound("gameover");
        else if (puzzleGame.inCheck()) playSound("check");
        else if (played.captured) playSound("capture");
        else playSound("move");

        renderPuzzleBoard(true);
        renderPuzzleMoves();
      }
      currentPuzzle.startPly = puzzleGame.history().length; // Analyse'ta buradan başlatılır
      currentPuzzle.startedAt = Date.now(); // çözme süresi için

      if (puzzleStatusEl) {
        puzzleStatusEl.textContent = `Your turn! Find the move for ${puzzlePlayerColor === "w" ? "White" : "Black"}. (Rating: ${currentPuzzle.rating})`;
      }
    }, 600);
  } catch (error) {
    if (loadId !== puzzleLoadId) return;
    console.error("Puzzle fetch error:", error);
    if (error.rateLimited) {
      showPuzzleCooldown(loadId);
      return;
    }
    if (puzzleStatusEl)
      puzzleStatusEl.textContent = "Could not load puzzle. Click Skip.";
  }
}

document.getElementById("puzzle-btn-skip")?.addEventListener("click", () => {
  const overlay = document.getElementById("puzzle-complete-overlay");
  if (overlay) overlay.hidden = true;
  puzzleHintSquares = [];
  fetchNewPuzzle();
});

{
  const sel = document.getElementById("puzzle-difficulty-select");
  if (
    sel &&
    [...sel.options].some((o) => o.value === settings.defaultPuzzleLevel)
  ) {
    sel.value = settings.defaultPuzzleLevel;
  }
  sel?.addEventListener("change", () => fetchNewPuzzle());
}

function showPuzzleCompletePopup() {
  const overlay = document.getElementById("puzzle-complete-overlay");
  if (!overlay) return;

  // Bulmaca bittiğinde ve pop-up çıktığında promote sesi çalar
  playSound("promote");

  if (settings.autoNextPuzzle) {
    puzzleHintSquares = [];
    setTimeout(() => fetchNewPuzzle(), 900);
    return;
  }

  overlay.removeAttribute("hidden");
}

document.getElementById("puzzle-btn-next")?.addEventListener("click", () => {
  const overlay = document.getElementById("puzzle-complete-overlay");
  if (overlay) {
    overlay.hidden = true;
  }
  puzzleHintSquares = [];
  fetchNewPuzzle();
});

document.getElementById("puzzle-btn-close")?.addEventListener("click", () => {
  const overlay = document.getElementById("puzzle-complete-overlay");
  if (overlay) {
    overlay.hidden = true;
  }
});

let puzzleMistakeCount = 0;

// Elo formülü: puzzle'ın ratingi ile oyuncunun ratingi arasındaki farka göre
const PUZZLE_K_WIN = 64;
const PUZZLE_K_LOSS = 64;

function puzzleRatingDelta(won) {
  const opponent = currentPuzzle?.rating || puzzleRating;
  const expected = 1 / (1 + Math.pow(10, (opponent - puzzleRating) / 400));
  const raw = (won ? PUZZLE_K_WIN : PUZZLE_K_LOSS) * ((won ? 1 : 0) - expected);
  const rounded = Math.round(raw);
  if (rounded === 0) return won ? 1 : -1; // en az 1 puan değişsin
  return rounded;
}
let puzzleHintSquares = [];

function executePuzzleMove(from, to, animate = true) {
  puzzleViewPly = null;
  const moveUci = from + to;
  const expectedUci = currentPuzzle.solution[puzzleSolutionIndex];

  if (
    moveUci === expectedUci ||
    moveUci.slice(0, 4) === expectedUci.slice(0, 4)
  ) {
    // ------------------------------------------
    // DOĞRU HAMLE
    // ------------------------------------------
    const played = puzzleGame.move({
      from,
      to,
      promotion: expectedUci[4] || "q",
    });

    if (played) {
      puzzleHistoryList.push(played.san);
    }

    puzzleCorrectSquares = [from, to];

    clearTimeout(puzzleCorrectTimer);
    puzzleCorrectTimer = setTimeout(() => {
      puzzleCorrectSquares = [];
      renderPuzzleBoard(false);
    }, 350);

    if (puzzleGame.isCheckmate()) {
      playSound("gameover");
    } else if (puzzleGame.inCheck()) {
      playSound("check");
    } else if (played.captured) {
      playSound("capture");
    } else {
      playSound("move");
    }

    puzzleSelectedSquare = null;
    puzzleLegalMoves = [];
    puzzleSolutionIndex++;
    puzzleMistakeCount = 0; // DÜZELTİldİ: puzzleMistakeCount kullanıldı

    renderPuzzleBoard(animate);
    renderPuzzleMoves();

    if (puzzleSolutionIndex >= currentPuzzle.solution.length) {
      if (puzzleStatusEl)
        puzzleStatusEl.textContent = "Puzzle Solved! Great job!";

      if (!puzzleScoreRecorded) {
        const ratingChange = puzzleHintUsedInCurrent
          ? 0
          : puzzleRatingDelta(true);
        recordPuzzleResult(true, ratingChange, puzzleHintUsedInCurrent);
        puzzleScoreRecorded = true;
      }
      setPuzzleFinished(true);

      setTimeout(() => {
        showPuzzleCompletePopup();
      }, 400);
      return;
    }

    if (puzzleStatusEl)
      puzzleStatusEl.textContent = "Correct! Opponent is responding...";

    const replyLoadId = puzzleLoadId;
    setTimeout(() => {
      if (replyLoadId !== puzzleLoadId || !currentPuzzle || puzzleFinished)
        return;
      const replyUci = currentPuzzle.solution[puzzleSolutionIndex];
      if (replyUci) {
        const rFrom = replyUci.slice(0, 2);
        const rTo = replyUci.slice(2, 4);
        const rPromo = replyUci[4] || "q";

        const replyPlayed = puzzleGame.move({
          from: rFrom,
          to: rTo,
          promotion: rPromo,
        });

        puzzleViewPly = null;
        if (replyPlayed) {
          puzzleHistoryList.push(replyPlayed.san);
        }
        puzzleSolutionIndex++;

        if (puzzleGame.isCheckmate()) playSound("gameover");
        else if (puzzleGame.inCheck()) playSound("check");
        else if (replyPlayed.captured) playSound("capture");
        else playSound("move");

        renderPuzzleBoard(true); // Rakibin hamlesi normal animasyonlu gelebilir
        renderPuzzleMoves();

        if (puzzleSolutionIndex >= currentPuzzle.solution.length) {
          if (puzzleStatusEl)
            puzzleStatusEl.textContent = "Puzzle Solved! Great job!";

          if (!puzzleScoreRecorded) {
            const ratingChange = puzzleHintUsedInCurrent
              ? 0
              : puzzleRatingDelta(true);
            recordPuzzleResult(true, ratingChange, puzzleHintUsedInCurrent);
            puzzleScoreRecorded = true;
          }
          setPuzzleFinished(true);

          setTimeout(() => {
            showPuzzleCompletePopup();
          }, 1000);
          return;
        }

        if (puzzleStatusEl)
          puzzleStatusEl.textContent = "Your turn. Find the next move.";
      }
    }, 600);
  } else {
    // ------------------------------------------
    // YANLIŞ HAMLE
    // ------------------------------------------
    isPuzzleMistakeState = true;
    playSound("gameover", 2);

    puzzleGame.move({ from, to, promotion: "q" });

    const boardWrap =
      puzzleBoardEl.closest(".board-wrap") || puzzleBoardEl.parentElement;
    if (boardWrap) {
      boardWrap.classList.remove("board-shake");
      void boardWrap.offsetWidth;
      boardWrap.classList.add("board-shake");
    }

    const lossDelta = puzzleRatingDelta(false);
    if (puzzleStatusEl)
      puzzleStatusEl.textContent = puzzleScoreRecorded
        ? "Incorrect move! Try again."
        : puzzleHintUsedInCurrent
          ? "Incorrect move! (No Elo change). Try again."
          : `Incorrect move! (${lossDelta} Elo). Try again.`;

    if (!puzzleScoreRecorded) {
      recordPuzzleResult(false, lossDelta, puzzleHintUsedInCurrent);
      puzzleScoreRecorded = true;
    }

    renderPuzzleBoard(animate);

    const mistakeLoadId = puzzleLoadId;
    setTimeout(() => {
      if (mistakeLoadId !== puzzleLoadId) return;
      puzzleGame.undo();
      puzzleSelectedSquare = null;
      puzzleLegalMoves = [];
      isPuzzleMistakeState = false;
      renderPuzzleBoard(false);

      if (boardWrap) boardWrap.classList.remove("board-shake");
      if (puzzleStatusEl)
        puzzleStatusEl.textContent = "Your turn. Try the correct move.";
    }, 600);
  }
}
document
  .getElementById("puzzle-btn-solution")
  ?.addEventListener("click", async () => {
    if (!currentPuzzle || puzzleFinished || puzzleSolutionPlaying) return;
    if (isPuzzleMistakeState) return;

    const loadId = puzzleLoadId;
    puzzleSolutionPlaying = true;
    puzzleViewPly = null;
    puzzleSelectedSquare = null;
    puzzleLegalMoves = [];
    puzzleHintSquares = [];

    // Çözümü görmek Hint gibi: Elo değişmez (daha önce yanlış yapıldıysa o kayıt zaten işlendi)
    puzzleHintUsedInCurrent = true;
    if (!puzzleScoreRecorded) {
      recordPuzzleResult(false, 0, true);
      puzzleScoreRecorded = true;
    }
    if (puzzleStatusEl)
      puzzleStatusEl.textContent = "Showing the solution... (No Elo change)";
    renderPuzzleBoard(false);

    while (puzzleSolutionIndex < currentPuzzle.solution.length) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      if (loadId !== puzzleLoadId) return; // skip / yeni puzzle geldi

      const uci = currentPuzzle.solution[puzzleSolutionIndex];
      const played = puzzleGame.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci[4] || "q",
      });
      puzzleSolutionIndex++;
      if (!played) continue;

      puzzleHistoryList.push(played.san);
      playSoundForMove(played);
      renderPuzzleBoard(true);
      renderPuzzleMoves();
    }

    puzzleSolutionPlaying = false;
    setPuzzleFinished(true);
    if (puzzleStatusEl)
      puzzleStatusEl.textContent =
        "Solution shown. You can analyse this puzzle.";
  });

document.getElementById("puzzle-btn-analyse")?.addEventListener("click", () => {
  if (!puzzleFinished || !currentPuzzle) return;

  const chess = new Chess();
  for (const san of puzzleGame.history()) chess.move(san);
  const startPly = currentPuzzle.startPly ?? 0;

  showPage("analyse");
  history.replaceState(null, "", "#analyse");
  loadAnalyseGame(chess.pgn(), puzzlePlayerColor);
  goToAnalysePly(startPly, false); // puzzle'ın başladığı pozisyondan başla
});

document.getElementById("puzzle-btn-hint")?.addEventListener("click", () => {
  if (!currentPuzzle || puzzleFinished || puzzleSolutionPlaying) return;
  const nextCorrectUci = currentPuzzle.solution[puzzleSolutionIndex];
  if (!nextCorrectUci) return;

  const from = nextCorrectUci.slice(0, 2);
  const to = nextCorrectUci.slice(2, 4);

  puzzleHintUsedInCurrent = true;
  puzzleHintStep++;

  const fromSquare = puzzleBoardEl.querySelector(`[data-square="${from}"]`);
  if (fromSquare) fromSquare.classList.add("drill-hint");

  if (puzzleHintStep >= 2) {
    const toSquare = puzzleBoardEl.querySelector(`[data-square="${to}"]`);
    if (toSquare) toSquare.classList.add("drill-hint");
    if (puzzleStatusEl)
      puzzleStatusEl.textContent = `Hint (No Elo change): Move from ${from} to ${to}`;
  } else {
    if (puzzleStatusEl)
      puzzleStatusEl.textContent = `Hint (No Elo change): Move the piece on ${from}`;
  }
});

function recordPuzzleResult(won, ratingChange, usedHint = false) {
  const ratingBefore = puzzleRating;
  if (!usedHint && ratingChange !== 0) {
    puzzleRating += ratingChange;
    if (puzzleRating < 400) puzzleRating = 400;
    if (puzzleRatingEl) puzzleRatingEl.textContent = puzzleRating;
    localStorage.setItem("azurite-puzzle-rating", puzzleRating);
  }

  const resultObj = {
    won,
    change: usedHint ? 0 : ratingChange,
    hint: usedHint,
  };
  puzzleHistory.unshift(resultObj);
  if (puzzleHistory.length > 10) puzzleHistory.pop();

  localStorage.setItem("azurite-puzzle-history", JSON.stringify(puzzleHistory));
  renderPuzzleHistory();
  recordPuzzleStats(won, usedHint, puzzleRating - ratingBefore);
}

// ==========================================
// PUZZLE İSTATİSTİKLERİ (Profile sayfası)
// ==========================================
const PUZZLE_STATS_KEY = "azurite-puzzle-stats";
const PUZZLE_RATING_HISTORY_MAX = 100;
const PUZZLE_LEVEL_LABELS = {
  beginner: "Beginner (600–1000)",
  easy: "Easy (1000–1400)",
  medium: "Medium (1400–1800)",
  hard: "Hard (1800–2200)",
  expert: "Master (2200+)",
};

function defaultPuzzleStats() {
  return {
    ratingHistory: [{ r: puzzleRating, t: Date.now() }],
    played: 0,
    solved: 0,
    failed: 0,
    hinted: 0,
    bestRating: puzzleRating,
    streak: 0,
    bestStreak: 0,
    levels: {},
  };
}

function loadPuzzleStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(PUZZLE_STATS_KEY));
    if (saved && Array.isArray(saved.ratingHistory)) {
      return { ...defaultPuzzleStats(), ...saved };
    }
  } catch {}
  return defaultPuzzleStats();
}

let puzzleStats = loadPuzzleStats();

// Detaylı puzzle kayıt defteri (cihazda, localStorage): her puzzle için bir satır
const PUZZLE_LOG_KEY = "azurite-puzzle-log";
const PUZZLE_LOG_MAX = 500;

function loadPuzzleLog() {
  try {
    const saved = JSON.parse(localStorage.getItem(PUZZLE_LOG_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {}
  return [];
}

let puzzleLog = loadPuzzleLog();

function savePuzzleLog() {
  try {
    localStorage.setItem(PUZZLE_LOG_KEY, JSON.stringify(puzzleLog));
  } catch {}
}

function savePuzzleStats() {
  try {
    localStorage.setItem(PUZZLE_STATS_KEY, JSON.stringify(puzzleStats));
  } catch {}
}

function recordPuzzleStats(won, usedHint, ratingChange = 0) {
  const st = puzzleStats;
  st.played++;
  if (won) st.solved++;
  else st.failed++;
  if (usedHint) st.hinted++;

  // Seri: yardımsız çözülen puzzle'lar. Yanlış ya da hint kullanımı seriyi bozar.
  if (won && !usedHint) {
    st.streak++;
    st.bestStreak = Math.max(st.bestStreak, st.streak);
  } else {
    st.streak = 0;
  }

  st.bestRating = Math.max(st.bestRating, puzzleRating);
  st.ratingHistory.push({ r: puzzleRating, t: Date.now() });
  if (st.ratingHistory.length > PUZZLE_RATING_HISTORY_MAX) {
    st.ratingHistory.splice(
      0,
      st.ratingHistory.length - PUZZLE_RATING_HISTORY_MAX,
    );
  }

  const key =
    currentPuzzle?.levelKey === "master" ? "expert" : currentPuzzle?.levelKey;
  if (key) {
    const lv = (st.levels[key] ||= { played: 0, solved: 0 });
    lv.played++;
    if (won) lv.solved++;
  }

  savePuzzleStats();

  const startedAt = currentPuzzle?.startedAt;
  puzzleLog.unshift({
    id: currentPuzzle?.id ?? null,
    puzzleRating: currentPuzzle?.rating ?? null,
    level: key ?? null,
    won,
    hint: !!usedHint,
    change: ratingChange,
    ratingAfter: puzzleRating,
    t: Date.now(),
    ms: startedAt ? Math.min(Date.now() - startedAt, 3_600_000) : null,
  });
  if (puzzleLog.length > PUZZLE_LOG_MAX) puzzleLog.length = PUZZLE_LOG_MAX;
  savePuzzleLog();
}

function formatDuration(ms) {
  if (ms == null) return "–";
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = String(total % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

let puzzleLogFilter = "all";
let puzzleLogVisible = 20;

function renderPuzzleLog() {
  const body = document.getElementById("puzzle-log-body");
  const moreBtn = document.getElementById("puzzle-log-more");
  const emptyEl = document.getElementById("puzzle-log-empty");
  if (!body) return;

  const rows = puzzleLog.filter((e) => {
    if (puzzleLogFilter === "solved") return e.won && !e.hint;
    if (puzzleLogFilter === "failed") return !e.won;
    if (puzzleLogFilter === "hint") return e.hint;
    return true;
  });

  body.innerHTML = "";
  rows.slice(0, puzzleLogVisible).forEach((e) => {
    const tr = document.createElement("tr");
    const date = new Date(e.t).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const result = e.hint ? "Hint" : e.won ? "Solved" : "Failed";
    const resultClass = e.hint ? "hint" : e.won ? "win" : "loss";
    const change = e.hint ? "0" : `${e.change > 0 ? "+" : ""}${e.change}`;
    const levelLabel = (PUZZLE_LEVEL_LABELS[e.level] || "–").split(" (")[0];

    const idCell = e.id
      ? `<a href="https://lichess.org/training/${encodeURIComponent(e.id)}" target="_blank" rel="noopener noreferrer">${e.id}</a>`
      : "–";

    tr.innerHTML = `
      <td>${date}</td>
      <td>${idCell}</td>
      <td>${e.puzzleRating ?? "–"}</td>
      <td>${levelLabel}</td>
      <td><span class="log-result ${resultClass}">${result}</span></td>
      <td class="log-change ${e.change > 0 ? "up" : e.change < 0 ? "down" : ""}">${change}</td>
      <td>${formatDuration(e.ms)}</td>`;
    body.appendChild(tr);
  });

  if (emptyEl) emptyEl.hidden = rows.length > 0;
  if (moreBtn) moreBtn.hidden = rows.length <= puzzleLogVisible;
}

function renderPuzzleChart(history) {
  const el = document.getElementById("profile-puzzle-chart");
  if (!el) return;

  if (history.length < 2) {
    el.innerHTML =
      '<p class="profile-empty">Solve a few puzzles to see your rating graph.</p>';
    return;
  }

  // Gerçek piksel boyutu: geniş ekranda yazılar büyümesin
  const W = el.clientWidth > 0 ? Math.max(300, el.clientWidth - 28) : 600;
  const H = 190;
  const padL = 40;
  const padR = 12;
  const padT = 10;
  const padB = 32;

  const values = history.map((p) => p.r);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (max - min < 40) {
    min -= 20;
    max += 20;
  }
  const span = max - min;
  min -= span * 0.1;
  max += span * 0.1;

  const x = (i) => padL + (i / (history.length - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);

  const line = history
    .map((p, i) => `${x(i).toFixed(1)},${y(p.r).toFixed(1)}`)
    .join(" ");
  const area = `${padL},${H - padB} ${line} ${x(history.length - 1).toFixed(1)},${H - padB}`;

  const ticks = [min, (min + max) / 2, max].map((v) => Math.round(v));
  const grid = ticks
    .map(
      (v) => `
      <line x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}" class="chart-grid"/>
      <text x="${padL - 6}" y="${y(v) + 4}" class="chart-label" text-anchor="end">${v}</text>`,
    )
    .join("");

  // Tarih ekseni: ilk ve son nokta (gün + ay + yıl) ile ay/yıl değişimleri
  const last = history.length - 1;
  const fullDate = (t) =>
    new Date(t).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const candidates = [{ i: 0, label: fullDate(history[0].t), anchor: "start" }];
  let prevMonthKey = (() => {
    const d = new Date(history[0].t);
    return d.getFullYear() * 12 + d.getMonth();
  })();
  for (let i = 1; i < last; i++) {
    const d = new Date(history[i].t);
    const key = d.getFullYear() * 12 + d.getMonth();
    if (key !== prevMonthKey) {
      const newYear = d.getMonth() === 0;
      candidates.push({
        i,
        label: d.toLocaleDateString(undefined, {
          month: "short",
          year: newYear ? "numeric" : undefined,
        }),
        anchor: "middle",
      });
      prevMonthKey = key;
    }
  }
  candidates.push({ i: last, label: fullDate(history[last].t), anchor: "end" });

  // Üst üste binmeyi önle: ilk ve son etiket korunur, aradakiler yeterince uzaksa kalır
  const MIN_GAP = 72;
  const kept = [];
  for (const tick of candidates) {
    const isLast = tick.i === last;
    const px = x(tick.i);
    const prev = kept[kept.length - 1];
    if (!prev || px - x(prev.i) >= MIN_GAP) {
      kept.push(tick);
    } else if (isLast) {
      // son etiket için yer aç: önceki (ilk değilse) etiketi at
      if (kept.length > 1) kept.pop();
      if (!kept.length || px - x(kept[kept.length - 1].i) >= MIN_GAP)
        kept.push(tick);
    }
  }

  const dateAxis = kept
    .map(
      (t) => `
      <line x1="${x(t.i).toFixed(1)}" x2="${x(t.i).toFixed(1)}" y1="${H - padB}" y2="${H - padB + 4}" class="chart-grid" style="stroke-dasharray:none"/>
      <text x="${x(t.i).toFixed(1)}" y="${H - padB + 15}" class="chart-label" text-anchor="${t.anchor}">${t.label}</text>`,
    )
    .join("");

  const dots = history
    .map((p, i) => {
      const isLast = i === history.length - 1;
      const when = new Date(p.t).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      return `<circle cx="${x(i).toFixed(1)}" cy="${y(p.r).toFixed(1)}" r="${isLast ? 5 : 3}" class="${isLast ? "chart-dot-last" : "chart-dot"}"><title>${p.r} · ${when}</title></circle>`;
    })
    .join("");

  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="rating-chart" role="img" aria-label="Puzzle rating history">
      ${grid}
      <polygon points="${area}" class="chart-area"/>
      <polyline points="${line}" class="chart-line"/>
      ${dots}
      ${dateAxis}
    </svg>`;
}

function renderPuzzleProfile() {
  const st = puzzleStats;
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  set("pp-rating", puzzleRating);
  set("pp-best", Math.max(st.bestRating, puzzleRating));
  set("pp-solved", `${st.solved} / ${st.played}`);
  set(
    "pp-rate",
    st.played ? `${Math.round((st.solved / st.played) * 100)}%` : "–",
  );
  set("pp-streak", st.streak);
  set("pp-best-streak", st.bestStreak);
  set("pp-hints", st.hinted);

  const timed = puzzleLog.filter((e) => e.ms != null).slice(0, 50);
  set(
    "pp-time",
    timed.length
      ? formatDuration(timed.reduce((sum, e) => sum + e.ms, 0) / timed.length)
      : "–",
  );

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  set("pp-today", puzzleLog.filter((e) => e.t >= startOfDay.getTime()).length);

  renderPuzzleLog();

  renderPuzzleChart(st.ratingHistory);

  const levelsEl = document.getElementById("profile-puzzle-levels");
  if (levelsEl) {
    levelsEl.innerHTML = "";
    for (const [key, label] of Object.entries(PUZZLE_LEVEL_LABELS)) {
      const lv = st.levels[key] || { played: 0, solved: 0 };
      const percent = lv.played ? Math.round((lv.solved / lv.played) * 100) : 0;

      const row = document.createElement("div");
      row.className = "profile-variation-row";
      row.innerHTML = `
        <div class="profile-variation-header">
          <span>${label}</span>
          <span>${lv.solved} / ${lv.played}${lv.played ? ` · ${percent}%` : ""}</span>
        </div>
        <div class="profile-progress-track">
          <div class="profile-progress-fill" style="width:${percent}%"></div>
        </div>`;
      levelsEl.appendChild(row);
    }
  }
}

// ---------- Ayarlar paneli ----------
function initSettingsPanel() {
  const volumeEl = document.getElementById("setting-volume");
  const volumeValueEl = document.getElementById("setting-volume-value");
  const muteEl = document.getElementById("setting-mute");
  const resetBtn = document.getElementById("btn-reset-puzzle-stats");

  const sync = () => {
    if (volumeEl) volumeEl.value = Math.round(settings.volume * 100);
    if (volumeValueEl)
      volumeValueEl.textContent = settings.muted
        ? "Muted"
        : `${Math.round(settings.volume * 100)}%`;
    if (muteEl) muteEl.checked = settings.muted;
    if (volumeEl) volumeEl.disabled = settings.muted;
  };
  sync();

  volumeEl?.addEventListener("input", () => {
    settings.volume = Number(volumeEl.value) / 100;
    saveSettings();
    sync();
  });
  volumeEl?.addEventListener("change", () => playSound("move")); // sesi duyup ayarla

  muteEl?.addEventListener("change", () => {
    settings.muted = muteEl.checked;
    saveSettings();
    sync();
  });

  // ---------- Oyun / analiz ayarları ----------
  const bindSelect = (id, key, parse = (v) => v) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = String(settings[key]);
    el.addEventListener("change", () => {
      settings[key] = parse(el.value);
      saveSettings();
    });
  };
  const bindCheck = (id, key, after) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.checked = !!settings[key];
    el.addEventListener("change", () => {
      settings[key] = el.checked;
      saveSettings();
      applyAppearance();
      after?.();
    });
  };
  bindSelect("setting-review-depth", "reviewDepth", Number);
  bindSelect("setting-live-depth", "liveDepth", Number);
  bindSelect("setting-anim-speed", "animSpeed");
  bindSelect("setting-default-puzzle", "defaultPuzzleLevel");
  bindCheck("setting-coords", "showCoords");
  bindCheck("setting-legal-dots", "showLegalDots");
  bindCheck("setting-last-move", "showLastMove");
  bindCheck("setting-auto-next", "autoNextPuzzle");
  bindCheck("setting-promo-ask", "promotionAsk");

  // ---------- Görünüm kontrolleri ----------
  const themeGrid = document.getElementById("theme-swatches");
  const boardGrid = document.getElementById("board-swatches");
  const accentInput = document.getElementById("setting-accent");
  const lightInput = document.getElementById("setting-light");
  const darkInput = document.getElementById("setting-dark");

  const renderAppearance = () => {
    if (themeGrid) {
      themeGrid.innerHTML = "";
      for (const [key, theme] of Object.entries(THEMES)) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "swatch" + (settings.theme === key ? " active" : "");
        btn.setAttribute("aria-pressed", settings.theme === key);
        btn.innerHTML = `<span class="swatch-preview" style="background: linear-gradient(135deg, ${theme.vars["--panel"]} 50%, ${theme.vars["--accent-strong"]} 50%); border-color: ${theme.vars["--panel-border"]}"></span><span>${theme.name}</span>`;
        btn.addEventListener("click", () => {
          settings.theme = key;
          settings.customAccent = null;
          saveSettings();
          applyAppearance();
          renderAppearance();
        });
        themeGrid.appendChild(btn);
      }
    }

    if (boardGrid) {
      boardGrid.innerHTML = "";
      for (const [key, b] of Object.entries(BOARD_THEMES)) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "swatch" + (settings.board === key ? " active" : "");
        btn.setAttribute("aria-pressed", settings.board === key);
        btn.innerHTML = `<span class="swatch-preview board" style="background: conic-gradient(${b.light} 25%, ${b.dark} 0 50%, ${b.light} 0 75%, ${b.dark} 0) 0 0 / 50% 50%"></span><span>${b.name}</span>`;
        btn.addEventListener("click", () => {
          settings.board = key;
          saveSettings();
          applyAppearance();
          renderAppearance();
        });
        boardGrid.appendChild(btn);
      }
    }

    const theme = THEMES[settings.theme] || THEMES.azurite;
    const board = currentBoardColors();
    if (accentInput)
      accentInput.value =
        settings.customAccent || theme.vars["--accent-strong"];
    if (lightInput) lightInput.value = board.light;
    if (darkInput) darkInput.value = board.dark;
  };
  renderAppearance();

  accentInput?.addEventListener("input", () => {
    settings.customAccent = accentInput.value;
    saveSettings();
    applyAppearance();
  });
  const onBoardColor = () => {
    settings.board = "custom";
    settings.customLight = lightInput.value;
    settings.customDark = darkInput.value;
    saveSettings();
    applyAppearance();
  };
  lightInput?.addEventListener("input", onBoardColor);
  darkInput?.addEventListener("input", onBoardColor);
  lightInput?.addEventListener("change", renderAppearance);
  darkInput?.addEventListener("change", renderAppearance);

  document
    .getElementById("btn-reset-appearance")
    ?.addEventListener("click", () => {
      settings.theme = "azurite";
      settings.board = "teal";
      settings.customAccent = null;
      settings.customLight = null;
      settings.customDark = null;
      saveSettings();
      applyAppearance();
      renderAppearance();
    });

  // Profile sekmeleri
  const tabs = document.querySelectorAll(".profile-tab");
  const panes = document.querySelectorAll(".profile-pane");
  const showTab = (name) => {
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    panes.forEach((p) => (p.hidden = p.dataset.pane !== name));
    if (name === "puzzles") renderPuzzleChart(puzzleStats.ratingHistory); // görünür olunca gerçek genişliğe göre çiz
    try {
      localStorage.setItem("azurite-profile-tab", name);
    } catch {}
  };
  tabs.forEach((t) =>
    t.addEventListener("click", () => showTab(t.dataset.tab)),
  );
  let savedTab = "openings";
  try {
    savedTab = localStorage.getItem("azurite-profile-tab") || "openings";
  } catch {}
  showTab(
    [...tabs].some((t) => t.dataset.tab === savedTab) ? savedTab : "openings",
  );

  let chartResizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(chartResizeTimer);
    chartResizeTimer = setTimeout(() => {
      const pane = document.querySelector('[data-pane="puzzles"]');
      if (pane && !pane.hidden && pane.offsetParent !== null) {
        renderPuzzleChart(puzzleStats.ratingHistory);
      }
    }, 150);
  });

  // Puzzle kayıt defteri kontrolleri
  document
    .getElementById("puzzle-log-filter")
    ?.addEventListener("change", (e) => {
      puzzleLogFilter = e.target.value;
      puzzleLogVisible = 20;
      renderPuzzleLog();
    });
  document.getElementById("puzzle-log-more")?.addEventListener("click", () => {
    puzzleLogVisible += 20;
    renderPuzzleLog();
  });

  document
    .getElementById("btn-export-puzzle-data")
    ?.addEventListener("click", () => {
      const data = {
        exportedAt: new Date().toISOString(),
        rating: puzzleRating,
        stats: puzzleStats,
        log: puzzleLog,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "azurite-puzzle-data.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

  resetBtn?.addEventListener("click", () => {
    if (
      !confirm(
        "Reset puzzle rating, history, statistics and the puzzle log? This cannot be undone.",
      )
    )
      return;
    puzzleLog = [];
    savePuzzleLog();

    puzzleRating = 1500;
    puzzleHistory = [];
    try {
      localStorage.setItem("azurite-puzzle-rating", puzzleRating);
      localStorage.setItem("azurite-puzzle-history", "[]");
    } catch {}
    puzzleStats = defaultPuzzleStats();
    savePuzzleStats();

    if (puzzleRatingEl) puzzleRatingEl.textContent = puzzleRating;
    renderPuzzleHistory();
    renderPuzzleProfile();
  });
}

initSettingsPanel();

function renderPuzzleHistory() {
  if (!puzzleHistoryGrid) return;
  puzzleHistoryGrid.innerHTML = "";

  puzzleHistory.forEach((item) => {
    const box = document.createElement("div");
    box.className =
      "puzzle-history-box " + (item.hint ? "hint" : item.won ? "win" : "loss");
    box.textContent = item.hint
      ? "X"
      : `${item.change > 0 ? "+" : ""}${item.change}`;
    puzzleHistoryGrid.appendChild(box);
  });
}

analyseBoardEl?.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 || analyseDrag) return;

  const name = analyseSquareFromPoint(e.clientX, e.clientY);
  if (!name) return;
  e.preventDefault();

  if (
    analyseSelectedSquare &&
    analyseLegalMoves.some((move) => move.to === name)
  ) {
    const fromSq = analyseSelectedSquare;
    pickPromotion(analyseGame, fromSq, name).then((p) => {
      if (p) makeAnalyseMove(fromSq, name, p);
      else renderAnalyseBoard();
    });
    return;
  }

  const piece = analyseGame.get(name);
  if (piece && piece.color === analyseGame.turn()) {
    const wasSelected = analyseSelectedSquare === name;
    analyseSelectedSquare = name;
    analyseLegalMoves = analyseGame.moves({ square: name, verbose: true });
    renderAnalyseBoard();

    analyseDrag = {
      from: name,
      piece,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      wasSelected,
      ghost: null,
      size: 0,
    };
    return;
  }

  clearAnalyseSelection();
  renderAnalyseBoard();
});

window.addEventListener("pointermove", (e) => {
  if (!analyseDrag) return;

  if (!analyseDrag.moved) {
    const distance = Math.hypot(
      e.clientX - analyseDrag.startX,
      e.clientY - analyseDrag.startY,
    );
    if (distance < ANALYSE_DRAG_THRESHOLD) return;
    startAnalyseDrag();
  }

  moveAnalyseGhost(e.clientX, e.clientY);
  updateAnalyseHover(analyseSquareFromPoint(e.clientX, e.clientY));
});

window.addEventListener("pointerup", (e) => endAnalyseDrag(e));
window.addEventListener("pointercancel", (e) => endAnalyseDrag(e, true));

drillActionEl?.addEventListener("click", () => {
  if (!drill) return;
  if (drill.phase === "mistake") retryDrill();
  else if (drill.phase === "complete") startDrill();
});

function renderDrillAlternatives() {
  const panel = document.getElementById("drill-alternatives");
  if (!panel) return;
  panel.innerHTML = "";

  if (!drill || !drill.hintShown || !drill.alternatives?.length) {
    panel.hidden = true;
    return;
  }

  panel.hidden = false;
  const title = document.createElement("h3");
  title.textContent = "Correct moves";
  panel.appendChild(title);

  drill.alternatives.forEach((edge, index) => {
    const item = document.createElement("div");
    item.className = "drill-alternative " + (index === 0 ? "main" : "other");
    item.textContent = `${index === 0 ? "Main move" : "Alternative"}: ${edge.san}`;
    panel.appendChild(item);
  });
}

function renderRepLibrary() {
  const container = document.getElementById("rep-library");
  const count = document.getElementById("rep-count");

  if (!container || !count) return;
  container.innerHTML = "";

  const repertoires = library.items;
  count.textContent = `${repertoires.length} Saved`;

  repertoires.forEach((rep) => {
    const card = document.createElement("div");
    card.className = "rep-card";

    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      if (library.active?.id === rep.id) return;

      endDrill();
      library.setActive(rep.id);
      persist();

      if (library.active) orientation = library.active.color;
      setNotice("");
      update();
    });

    if (library.active?.id === rep.id) card.classList.add("active");
    if (drill?.rep.id === rep.id) card.classList.add("drilling");

    const title = document.createElement("h3");
    title.textContent = rep.name;
    const positionCount = document.createElement("p");
    positionCount.className = "rep-card-position-count";
    positionCount.textContent = `${rep.stats().positions} positions, as ${rep.color === "w" ? "White" : "Black"}`;

    const cardDrillButton = document.createElement("button");
    const isDrillingThisRep = drill?.rep.id === rep.id;
    cardDrillButton.textContent = isDrillingThisRep ? "Stop" : "Drill";
    cardDrillButton.className = "rep-card-drill";

    cardDrillButton.addEventListener("click", () => {
      if (drill?.rep.id === rep.id) {
        endDrill();
        drillGame.reset();
        repertoireGame.reset();
        repViewPly = null;
        repSelectedSquare = null;
        repLegalMoves = [];
        drillHintSquares = [];
        updateRepertoirePage(false);
        return;
      }

      endDrill();
      library.setActive(rep.id);
      persist();
      orientation = rep.color;
      setNotice("");
      startDrill();
    });

    const renameButton = document.createElement("button");
    renameButton.textContent = "Rename";
    renameButton.addEventListener("click", () => {
      const name = prompt("Rename repertoire", rep.name);
      if (name === null) return;
      const trimmed = name.trim().slice(0, 60);
      if (!trimmed) return;

      rep.name = trimmed;
      persist();
      update();
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      if (!confirm(`Delete "${rep.name}"? This cannot be undone.`)) return;

      endDrill();
      library.remove(rep.id);
      persist();
      setNotice("");
      update();
    });

    const actions = document.createElement("div");
    actions.className = "rep-card-actions";
    actions.append(cardDrillButton, renameButton, deleteButton);
    card.append(title, positionCount, actions);
    container.appendChild(card);
  });
}

document.getElementById("custom-upload-btn")?.addEventListener("click", () => {
  document.getElementById("pgn-upload")?.click();
});

const navLinks = document.querySelectorAll(".nav-link");
const brandLink = document.querySelector(".nav-brand");

const pages = {
  play: document.querySelector("#play"),
  analyse: document.querySelector("#analyse"),
  puzzles: document.querySelector("#puzzles"),
  openings: document.querySelector("#openings"),
  repertoire: document.querySelector("#repertoire"),
  profile: document.querySelector("#profile"),
};

function showPage(pageName) {
  Object.entries(pages).forEach(([name, element]) => {
    if (element) element.hidden = name !== pageName;
  });

  navLinks.forEach((link) => {
    link.classList.toggle(
      "active",
      link.getAttribute("href") === `#${pageName}`,
    );
  });

  const isNormalPlay = pageName === "play" && !lesson && !trainMode;
  if (analysisPanel) analysisPanel.hidden = !isNormalPlay;

  if (isNormalPlay) {
    const currentView = syncView();
    requestEngineEvaluation(currentView.fen(), "play");
  }

  if (pageName === "analyse") {
    renderAnalyseBoard();
    requestEngineEvaluation(analyseGame.fen(), "analyse");
  }
  if (pageName === "repertoire") updateRepertoirePage();
  if (pageName === "profile") renderProfileProgress();
  if (pageName === "puzzles") initPuzzle();
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const pageName = link.getAttribute("href").slice(1);
    showPage(pageName);
    history.replaceState(null, "", `#${pageName}`);
  });
});

brandLink?.addEventListener("click", (event) => {
  event.preventDefault();
  showPage("play");
  history.replaceState(null, "", "#play");
});

document
  .getElementById("learn-variation-select")
  ?.addEventListener("change", selectLearnVariation);
document
  .getElementById("learn-next")
  ?.addEventListener("click", nextLessonMove);
document
  .getElementById("learn-back")
  ?.addEventListener("click", previousLessonMove);
document.getElementById("learn-exit")?.addEventListener("click", exitLearn);

document.getElementById("filter-all")?.addEventListener("click", () => {
  openingFilter = "all";
  document.getElementById("filter-all")?.classList.add("active");
  document.getElementById("filter-favorites")?.classList.remove("active");
  renderOpenings();
});

document.getElementById("filter-favorites")?.addEventListener("click", () => {
  openingFilter = "favorites";
  document.getElementById("filter-favorites")?.classList.add("active");
  document.getElementById("filter-all")?.classList.remove("active");
  renderOpenings();
});

document
  .getElementById("learn-complete-close")
  ?.addEventListener("click", () => {
    document.getElementById("learn-complete-overlay").hidden = true;

    clearTimeout(learnCompleteTimer);
    clearTimeout(trainMistakeTimer);
    clearTimeout(trainOpponentTimer);

    trainMode = false;
    trainHintShown = false;
    trainHintSquares = [];
    trainMistakeCount = 0;
    trainCorrectMoves = 0;
    trainTotalMistakes = 0;
    trainPhase = "your-move";

    game.reset();
    viewPly = null;
    if (lesson) lesson.index = 0;

    clearSelection();
    update();
  });

document
  .getElementById("learn-complete-train")
  ?.addEventListener("click", startCurrentLearnTrain);

const hintButton = document.getElementById("train-hint");

const menuToggle = document.getElementById("menu-toggle");
const navLinksContainer = document.querySelector(".nav-links");

if (menuToggle && navLinksContainer) {
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    navLinksContainer.classList.toggle("open");
  });

  navLinksContainer.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      navLinksContainer.classList.remove("open");
    });
  });

  window.addEventListener("click", (e) => {
    if (
      !menuToggle.contains(e.target) &&
      !navLinksContainer.contains(e.target)
    ) {
      navLinksContainer.classList.remove("open");
    }
  });
}

document.getElementById("btn-back-to-board")?.addEventListener("click", () => {
  document.getElementById("analyse-board")?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
});

document.getElementById("analyse-nav-first")?.addEventListener("click", () => {
  goToAnalysePly(0);
});
document.getElementById("analyse-nav-prev")?.addEventListener("click", () => {
  if (analyseCurrentPly > 0) goToAnalysePly(analyseCurrentPly - 1);
});
document.getElementById("analyse-nav-next")?.addEventListener("click", () => {
  if (analyseCurrentPly < analyseHistory.length)
    goToAnalysePly(analyseCurrentPly + 1);
});
document.getElementById("analyse-nav-last")?.addEventListener("click", () => {
  goToAnalysePly(analyseHistory.length);
});

if (hintButton) {
  hintButton.addEventListener("click", () => {
    if (!trainMode || trainPhase !== "your-move") return;

    trainHintShown = !trainHintShown;
    if (trainHintShown) {
      const move = lesson?.variation?.moves[lesson.index];
      if (!move) {
        trainHintShown = false;
        return;
      }
      trainHintSquares =
        trainMistakeCount <= 1 ? [move.from] : [move.from, move.to];
    } else {
      trainHintSquares = [];
    }

    hintButton.classList.toggle("active", trainHintShown);
    update(false);
  });
}

async function initCuratedOpenings() {
  try {
    const response = await fetch("assets/openings/index.json");
    if (!response.ok) {
      throw new Error("Could not load opening index.");
    }

    const files = await response.json();
    openingLibrary = await Promise.all(
      files.map((file) => loadOpening(file.replace(".json", ""), Chess)),
    );

    curatedOpening = openingLibrary[0] || null;
    renderOpenings();
  } catch (error) {
    console.error("Could not load openings:", error);
  }
}

initStockfish();
initCuratedOpenings();
update();

// Telefon Learn/Train: sabit panelin yüksekliğini CSS'e bildir (tahta boyu ve alt boşluk için)
{
  const panel = document.getElementById("learn-panel");
  if (panel && "ResizeObserver" in window) {
    const setH = () => {
      const h = panel.hidden
        ? 0
        : Math.round(panel.getBoundingClientRect().height);
      document.documentElement.style.setProperty(
        "--learn-panel-h",
        `${h || 220}px`,
      );
    };
    new ResizeObserver(setH).observe(panel);
    new MutationObserver(setH).observe(panel, {
      attributes: true,
      attributeFilter: ["hidden"],
    });
    setH();
  }
}
