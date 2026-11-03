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

let orientation = "w";
let selectedSquare = null;
let legalMoves = [];
let drillHintSquares = [];

let drag = null; // active press/drag state
let hoverSquare = null;
let repSuppressClick = false;
let repDrag = null;
let repHoverSquare = null;
let drillMistakeTimer = null;
let drillCompleteTimer = null;
let learnCompleteTimer = null;
let viewPly = null; // null = live position, otherwise number of plies being viewed
let view = game; // the position currently displayed on the board
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

      const moveResult = analyseGame.move({
        from,
        to,
        promotion,
      });

      if (!moveResult) return;

      analyseCurrentPly++;

      renderAnalyseBoard();
      renderAnalyseMoves();
      requestEngineEvaluation(analyseGame.fen(), "analyse");
    });

    analyseAnalysisLinesEl.appendChild(row);
  });
}

let favoriteOpenings = new Set(
  JSON.parse(localStorage.getItem("azurite-favorites") || "[]"),
);
/* ---------- Coordinates helpers ---------- */

function playSound(name, speed = 1) {
  const sound = SOUNDS[name];

  if (!sound) return;

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
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;

    drillCompleteStats.innerHTML = `
  Accuracy: <span class="drill-accuracy">${accuracy}%</span>
  · Mistakes: <span class="drill-mistakes">${mistakes}</span>
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
    audio.volume = 0.6;

    audio.play().catch((error) => {
      console.warn("Promote sound could not play:", error);
    });
  }, 500);
}
function squareName(row, col) {
  // row/col are screen positions (0 = top-left)
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

function renderRepertoireBoard(animate = true) {
  if (!repBoardEl) return;

  const currentGame = drill ? drillGame : repertoireGame;
  const displayGame = drill ? drillGame : syncRepView();
  const lastMove = currentGame.history({ verbose: true }).at(-1);

  let oldPieceRect = null;

  if (animate && lastMove) {
    const oldPiece = repBoardEl.querySelector(
      `[data-square="${lastMove.from}"] .piece`,
    );

    if (oldPiece) {
      oldPieceRect = oldPiece.getBoundingClientRect();
    }
  }

  const boardGame = displayGame;

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

      const lastMove = boardGame.history({ verbose: true }).at(-1);

      if (
        lastMove &&
        (lastMove.from === squareName || lastMove.to === squareName)
      ) {
        square.classList.add("last-move");
      }

      const legalMove = repLegalMoves.find((move) => move.to === squareName);

      if (legalMove) {
        square.classList.add("legal");
        if (legalMove.captured) square.classList.add("capture");
      }

      const piece = boardGame.get(squareName);

      if (piece) {
        square.appendChild(createPieceEl(piece.color, piece.type));
      }

      if (col === 0) addCoord(square, "rank", squareName[1]);
      if (row === 7) addCoord(square, "file", squareName[0]);

      repBoardEl.appendChild(square);
    }
  }

  // Animate the moved piece to its new square.
  if (animate && oldPieceRect && lastMove) {
    const toSquare = repBoardEl.querySelector(`[data-square="${lastMove.to}"]`);
    const newPiece = toSquare?.querySelector(".piece");

    if (newPiece) {
      const newRect = newPiece.getBoundingClientRect();

      const deltaX = oldPieceRect.left - newRect.left;
      const deltaY = oldPieceRect.top - newRect.top;

      newPiece.style.transition = "none";
      newPiece.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      newPiece.offsetHeight;

      requestAnimationFrame(() => {
        newPiece.style.transition = "transform 180ms ease";
        newPiece.style.transform = "translate(0, 0)";
      });
    }
  }
}

function renderRepertoireMoves() {
  if (!repMovesEl) return;

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

  const activeEl = repMovesEl.querySelector(".move.active");
  if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
}

function endAnalyseDrag(e, cancelled = false) {
  if (!analyseDrag) return;

  const { from, moved, wasSelected, ghost } = analyseDrag;

  if (ghost) ghost.remove();

  setAnalyseHover(analyseHoverSquare, false);
  analyseHoverSquare = null;

  analyseDrag = null;

  // Sadece tıklama yapıldıysa
  if (!moved) {
    if (wasSelected) {
      clearAnalyseSelection();
    }

    renderAnalyseBoard();
    return;
  }

  // Sürüklenen taş bırakıldı.
  const target = cancelled
    ? null
    : analyseSquareFromPoint(e.clientX, e.clientY);

  if (target && analyseLegalMoves.some((move) => move.to === target)) {
    makeAnalyseMove(from, target);
    return;
  }

  if (target !== from) {
    clearAnalyseSelection();
  }

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

repBoardEl.addEventListener("pointerdown", (e) => {
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
      const currentGame = drill ? drillGame : repertoireGame;

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
    repLegalMoves = currentGame.moves({
      square: name,
      verbose: true,
    });

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

  if (currentDrag.ghost) {
    currentDrag.ghost.remove();
  }

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

window.addEventListener("pointerup", (e) => {
  endRepDrag(e);
});

window.addEventListener("pointercancel", (e) => {
  endRepDrag(e, true);
});

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

repBoardEl.addEventListener("click", (event) => {
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
    repLegalMoves = currentGame.moves({
      square: name,
      verbose: true,
    });
  } else {
    repSelectedSquare = null;
    repLegalMoves = [];
  }

  updateRepertoireBoard();
});

repBackBtn.addEventListener("click", () => {
  repertoireGame.undo();
  repSelectedSquare = null;
  repLegalMoves = [];
  updateRepertoirePage();
});

repResetBtn.addEventListener("click", () => {
  repertoireGame.reset();
  repViewPly = null;
  repSelectedSquare = null;
  repLegalMoves = [];
  updateRepertoirePage();
});

repMovesEl.addEventListener("click", (e) => {
  const moveEl = e.target.closest(".move");
  if (!moveEl || drill) return;

  goToRepPly(Number(moveEl.dataset.ply));
});

repFlipBtn.addEventListener("click", () => {
  repOrientation = repOrientation === "w" ? "b" : "w";
  updateRepertoireBoard();
});
/* ---------- View (history navigation) ---------- */

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

function goToRepPly(ply) {
  const total = repertoireGame.history().length;

  repViewPly = Math.max(0, Math.min(ply, total));

  if (repViewPly >= total) {
    repViewPly = null;
  }

  repSelectedSquare = null;
  repLegalMoves = [];

  updateRepertoirePage(false);
}

function goToPly(ply) {
  const total = game.history().length;

  viewPly = Math.max(0, Math.min(ply, total));

  if (viewPly >= total) {
    viewPly = null;
  }

  selectedSquare = null;
  legalMoves = [];

  update(false);
}

/* ---------- Stockfish evaluation ---------- */

let stockfishWorker = null;
let engineReady = false;
let engineBusy = false;
let engineStopping = false;

let pendingEngineFen = null;
let activeEngineFen = null;
let requestedEngineFen = null;
let analysisLinesByRank = new Map();

const ENGINE_DEPTH = 13;
let requestedEvaluationTarget = "play";

function initStockfish() {
  try {
    stockfishWorker = new Worker(
      "./assets/stockfish/stockfish-19-lite-single.js",
    );

    stockfishWorker.onmessage = (event) => {
      const message = String(event.data).trim();

      // Motor başlangıcı
      if (message === "uciok") {
        stockfishWorker.postMessage("isready");
        return;
      }

      if (message === "readyok") {
        engineReady = true;

        if (pendingEngineFen) {
          startEngineAnalysis(pendingEngineFen);
        }
        return;
      }

      // Analiz sonuçları
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

      // Mevcut analiz tamamlandı
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
      evaluationScoreEl.textContent = "Engine error";
    };

    stockfishWorker.postMessage("uci");
  } catch (error) {
    console.error("Could not start Stockfish:", error);
    evaluationScoreEl.textContent = "Engine unavailable";
  }
}

function requestEngineEvaluation(fen, target = "play") {
  if (!stockfishWorker) return;

  const targetChanged = target !== requestedEvaluationTarget;
  const fenChanged = fen !== requestedEngineFen;

  // Aynı pozisyon ve aynı hedef zaten analiz ediliyorsa tekrar başlatma.
  if (!fenChanged && !targetChanged) return;

  requestedEvaluationTarget = target;
  requestedEngineFen = fen;
  analysisFen = fen;

  analysisLinesByRank.clear();

  if (target === "analyse") {
    if (analyseAnalysisLinesEl) {
      analyseAnalysisLinesEl.innerHTML = "";
    }

    if (analyseAnalysisStatusEl) {
      analyseAnalysisStatusEl.textContent = "Analyzing 5 lines...";
    }
  } else {
    if (analysisLinesEl) {
      analysisLinesEl.innerHTML = "";
    }

    if (analysisStatusEl) {
      analysisStatusEl.textContent = "Analyzing 5 lines...";
    }
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
  stockfishWorker.postMessage(`go depth ${ENGINE_DEPTH}`);
}
function renderAnalysisLine(fen, pv, depth) {
  if (!analysisLinesEl || !analysisStatusEl) return;
  if (!pv || !pv.length) return;

  const analysisGame = new Chess(fen);
  const moves = [];

  for (const uci of pv.slice(0, 10)) {
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci[4];

    const number = analysisGame.moveNumber();
    const color = analysisGame.turn();

    try {
      const move = analysisGame.move({
        from,
        to,
        promotion: promotion || "q",
      });

      if (!move) break;

      moves.push({
        number,
        color,
        san: move.san,
      });
    } catch {
      break;
    }
  }

  let output = "";

  for (const move of moves) {
    if (move.color === "w") {
      output += `<span class="analysis-move-number">${move.number}.</span> `;
    } else if (
      moves[0]?.color === "b" ||
      moves[moves.indexOf(move) - 1]?.color !== "w"
    ) {
      output += `<span class="analysis-move-number">${move.number}...</span> `;
    }

    output += `<span class="analysis-move">${move.san}</span> `;
  }

  analysisLinesEl.innerHTML = output;
  analysisStatusEl.textContent = `Stockfish · Depth ${depth}`;
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
  let scoreType;
  let scoreText;
  let whiteScore;

  if (mateMatch) {
    scoreType = "mate";
    score = Number(mateMatch[1]);

    if (sideToMove === "b") score = -score;

    whiteScore = score > 0 ? 1000 : -1000;
    scoreText = score > 0 ? `+M${score}` : `-M${Math.abs(score)}`;
  } else {
    scoreType = "cp";
    score = Number(cpMatch[1]);

    if (sideToMove === "b") score = -score;

    whiteScore = score;
    const pawns = score / 100;
    scoreText = `${pawns > 0 ? "+" : ""}${pawns.toFixed(1)}`;
  }

  // Varyasyonu sırasına göre kaydet.
  analysisLinesByRank.set(multipv, {
    fen: activeEngineFen,
    pv: pvMatch[1].trim().split(/\s+/).slice(0, 4),
    depth,
    score,
    scoreType,
    scoreText,
  });

  // Bes varyasyonu sıralı şekilde göster.
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
  const clamped = Math.max(-1000, Math.min(1000, whiteScore));
  const whitePercent = 100 / (1 + Math.exp(-clamped / 300));
  const safePercent = Math.max(5, Math.min(95, whitePercent));

  // Play evaluation bar
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

/* ---------- Rendering ---------- */

function renderBoard(animate = true) {
  const history = view.history({ verbose: true });
  const lastMove = history[history.length - 1];

  // Animasyondan önce taşın eski konumunu kaydet.
  let oldPieceRect = null;

  if (animate && lastMove) {
    const fromSquare = boardEl.querySelector(
      `[data-square="${lastMove.from}"]`,
    );
    const oldPiece = fromSquare?.querySelector(".piece");

    if (oldPiece) {
      oldPieceRect = oldPiece.getBoundingClientRect();
    }
  }

  boardEl.innerHTML = "";

  // Learn okları için SVG katmanı
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

      if (drillHintSquares.includes(name)) {
        squareEl.classList.add("drill-hint");
      }
      if (trainMode && trainHintSquares.includes(name)) {
        squareEl.classList.add("drill-hint");
      }

      if (learnHintMove) {
        if (name === learnHintMove.from) {
          squareEl.classList.add("learn-from");
        }

        if (name === learnHintMove.to) {
          squareEl.classList.add("learn-to");
        }
      }

      if (lastMove && (name === lastMove.from || name === lastMove.to)) {
        squareEl.classList.add("last-move");
      }

      if (trainMode && trainCorrectSquares.includes(name)) {
        squareEl.classList.add("train-correct");
      }

      if (name === selectedSquare) {
        squareEl.classList.add("selected");
      }

      if (name === checkSquare) {
        squareEl.classList.add("check");
      }

      const move = legalMoves.find((m) => m.to === name);

      if (move) {
        squareEl.classList.add("legal");
        if (move.captured) squareEl.classList.add("capture");
      }

      const piece = view.get(name);

      if (piece) {
        squareEl.appendChild(createPieceEl(piece.color, piece.type));
      }

      if (col === 0) addCoord(squareEl, "rank", name[1]);
      if (row === 7) addCoord(squareEl, "file", name[0]);

      boardEl.appendChild(squareEl);
    }
  }

  // Learn modunda önerilen hamle için ok çiz
  if (learnHintMove) {
    const files = "abcdefgh";

    const fromCol = files.indexOf(learnHintMove.from[0]);
    const fromRow = 8 - Number(learnHintMove.from[1]);

    const toCol = files.indexOf(learnHintMove.to[0]);
    const toRow = 8 - Number(learnHintMove.to[1]);

    const dx = toCol - fromCol;
    const dy = toRow - fromRow;
    const length = Math.hypot(dx, dy);

    if (length > 0) {
      const offset = 0.22;

      const arrow = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );

      arrow.setAttribute("x1", fromCol + 0.5);
      arrow.setAttribute("y1", fromRow + 0.5);
      arrow.setAttribute("x2", toCol + 0.5 - (dx / length) * offset);
      arrow.setAttribute("y2", toRow + 0.5 - (dy / length) * offset);
      arrow.setAttribute("marker-end", "url(#learn-arrow-head)");
      arrow.classList.add("learn-arrow");

      const defs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs",
      );

      const marker = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "marker",
      );

      marker.setAttribute("id", "learn-arrow-head");
      marker.setAttribute("markerWidth", "4");
      marker.setAttribute("markerHeight", "4");
      marker.setAttribute("refX", "3");
      marker.setAttribute("refY", "2");
      marker.setAttribute("orient", "auto");
      marker.setAttribute("markerUnits", "userSpaceOnUse");

      const head = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );

      head.setAttribute("d", "M 0 0 L 4 2 L 0 4 Z");
      head.classList.add("learn-arrow-head");

      marker.appendChild(head);
      defs.appendChild(marker);

      arrowLayer.appendChild(defs);
      arrowLayer.appendChild(arrow);
    }
  }
  // Yeni tahtadaki hedef taşını eski konumundan kaydır.
  if (animate && oldPieceRect && lastMove) {
    const toSquare = boardEl.querySelector(`[data-square="${lastMove.to}"]`);
    const newPiece = toSquare?.querySelector(".piece");

    if (newPiece) {
      const newRect = newPiece.getBoundingClientRect();

      const deltaX = oldPieceRect.left - newRect.left;
      const deltaY = oldPieceRect.top - newRect.top;

      newPiece.style.transition = "none";
      newPiece.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      // Başlangıç konumunu tarayıcıya uygulat.
      newPiece.offsetHeight;

      requestAnimationFrame(() => {
        newPiece.style.transition = "transform 180ms ease";
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

  if (square) {
    square.classList.toggle("drag-over", on);
  }
}

function updateAnalyseHover(name) {
  if (name === analyseHoverSquare) return;

  setAnalyseHover(analyseHoverSquare, false);

  analyseHoverSquare = name;

  setAnalyseHover(name, true);
}

function makeAnalyseMove(from, to, promotion = "q") {
  const target = analyseGame.get(to);

  const move = analyseGame.move({
    from,
    to,
    promotion,
  });

  if (!move) return false;

  // Geçmişteki bir konumdan yeni hamle yapılırsa
  // eski devam hamlelerini sil.
  analyseHistory = analyseHistory.slice(0, analyseCurrentPly);
  analyseHistory.push(move.san);

  analyseCurrentPly++;

  if (analyseGame.isCheckmate()) {
    playSound("gameover");
  } else if (analyseGame.inCheck()) {
    playSound("check");
  } else if (move.flags.includes("k") || move.flags.includes("q")) {
    playSound("castle");
  } else if (move.flags.includes("p")) {
    playSound("promote");
  } else if (target || move.flags.includes("e")) {
    playSound("capture");
  } else {
    playSound("move");
  }

  clearAnalyseSelection();

  renderAnalyseBoard();
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

function renderAnalyseBoard() {
  if (!analyseBoardEl) return;

  analyseBoardEl.innerHTML = "";

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

      if (piece) {
        squareEl.appendChild(createPieceEl(piece.color, piece.type));
      }

      if (col === 0) addCoord(squareEl, "rank", name[1]);
      if (row === 7) addCoord(squareEl, "file", name[0]);

      analyseBoardEl.appendChild(squareEl);
    }
  }
}

function playAnalyseMove(from, to, promotion = "q") {
  const target = analyseGame.get(to);

  const move = analyseGame.move({ from, to, promotion });
  if (!move) return;

  analyseCurrentPly = analyseGame.history().length;

  analyseSelectedSquare = null;
  analyseLegalMoves = [];

  if (analyseGame.isCheckmate()) {
    playSound("gameover");
  } else if (analyseGame.inCheck()) {
    playSound("check");
  } else if (move.flags.includes("k") || move.flags.includes("q")) {
    playSound("castle");
  } else if (move.flags.includes("p")) {
    playSound("promote");
  } else if (target || move.flags.includes("e")) {
    playSound("capture");
  } else {
    playSound("move");
  }

  renderAnalyseBoard();
  renderAnalyseMoves();

  const statusEl = document.getElementById("analyse-status");
  if (statusEl) {
    statusEl.textContent = `Move ${Math.ceil(analyseCurrentPly / 2)} · ${
      analyseCurrentPly % 2 ? "White" : "Black"
    } played`;
  }

  requestEngineEvaluation(analyseGame.fen(), "analyse");
}

analyseBoardEl.addEventListener("click", (e) => {
  const squareEl = e.target.closest(".square");
  if (!squareEl) return;

  const name = squareEl.dataset.square;
  if (!name) return;

  // Seçili taşın legal hedefine tıklandıysa hamleyi yap.
  if (
    analyseSelectedSquare &&
    analyseLegalMoves.some((move) => move.to === name)
  ) {
    playAnalyseMove(analyseSelectedSquare, name);
    return;
  }

  const piece = analyseGame.get(name);

  // Kendi sırasındaki taşı seç.
  if (piece && piece.color === analyseGame.turn()) {
    analyseSelectedSquare = name;
    analyseLegalMoves = analyseGame.moves({
      square: name,
      verbose: true,
    });

    renderAnalyseBoard();
    return;
  }

  // Boş veya rakip kareye tıklanınca seçimi kaldır.
  analyseSelectedSquare = null;
  analyseLegalMoves = [];
  renderAnalyseBoard();
});

function addCoord(squareEl, type, text) {
  const el = document.createElement("span");
  el.className = `coord ${type}`;
  el.textContent = text;
  squareEl.appendChild(el);
}

function renderStatus() {
  // Reviewing an earlier position
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
  if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
}

const analyseMovesEl = document.getElementById("analyse-moves");

function renderAnalyseMoves() {
  if (!analyseMovesEl) return;

  const sanMoves = analyseHistory;
  analyseMovesEl.innerHTML = "";

  for (let i = 0; i < sanMoves.length; i += 2) {
    const li = document.createElement("li");

    const whiteMove = createMoveEl(sanMoves[i], i + 1, analyseCurrentPly);

    whiteMove.addEventListener("click", () => {
      goToAnalysePly(i + 1);
    });

    li.appendChild(whiteMove);

    if (sanMoves[i + 1]) {
      const blackMove = createMoveEl(sanMoves[i + 1], i + 2, analyseCurrentPly);

      blackMove.addEventListener("click", () => {
        goToAnalysePly(i + 2);
      });

      li.appendChild(blackMove);
    }

    analyseMovesEl.appendChild(li);
  }

  const activeEl = analyseMovesEl.querySelector(".move.active");

  if (activeEl) {
    activeEl.scrollIntoView({ block: "nearest" });
  }
}

function goToAnalysePly(ply) {
  if (ply < 0 || ply > analyseHistory.length) return;

  analyseGame.reset();

  for (let i = 0; i < ply; i++) {
    analyseGame.move(analyseHistory[i]);
  }

  analyseCurrentPly = ply;

  clearAnalyseSelection();

  renderAnalyseBoard();
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
  analyseSelectedSquare = null;
  analyseLegalMoves = [];

  goToAnalysePly(0);
});

document.getElementById("analyse-btn-undo").addEventListener("click", () => {
  if (analyseCurrentPly <= 0) return;
  goToAnalysePly(analyseCurrentPly - 1);
});

document.getElementById("analyse-btn-flip").addEventListener("click", () => {
  analyseOrientation = analyseOrientation === "w" ? "b" : "w";
  renderAnalyseBoard();
});

document.getElementById("analyse-btn-reset").addEventListener("click", () => {
  goToAnalysePly(0);
});

/* ---------- Material ---------- */

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

  if (analysisPanel) {
    analysisPanel.hidden = !showAnalysis;
  }

  if (showAnalysis) {
    requestEngineEvaluation(view.fen(), "play");
  } else {
    if (analysisLinesEl) {
      analysisLinesEl.textContent = "";
    }

    if (analysisStatusEl) {
      analysisStatusEl.textContent = "Analysis is available in normal Play.";
    }
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
    renderRepertoireBoard(false);
  }
}
/* ---------- Game actions ---------- */

function clearSelection() {
  selectedSquare = null;
  legalMoves = [];
}

function playMove(from, to, promotion = "q", byDrill = false, animate = true) {
  if (lesson && !byDrill) {
    const expectedMove = lesson.variation.moves[lesson.index];

    if (!expectedMove) return;

    // Train: hamleyi önce tahtada oynat, sonra doğruluğunu kontrol et.
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

      // Doğru hamle
      // Doğru hamle
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

    // Learn: mevcut doğrulama davranışı aynen korunur.
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

  if (game.isCheckmate()) {
    playSound("gameover");
  } else if (game.inCheck()) {
    playSound("check");
  } else if (move.flags.includes("k") || move.flags.includes("q")) {
    playSound("castle");
  } else if (move.flags.includes("p")) {
    playSound("promote");
  } else if (target || move.flags.includes("e")) {
    playSound("capture");
  } else {
    playSound("move");
  }

  if (lesson && !trainMode) {
    lesson.index++;
    const nextMove = lesson.variation.moves[lesson.index];
    learnHintMove = nextMove ? { from: nextMove.from, to: nextMove.to } : null;
  }

  clearSelection();
  update(animate);

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
        if (trainMode) {
          renderLearnTrainCompleteStats();
        }

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

  // İlk hata: taşın bulunduğu kare.
  // İkinci ve sonraki hatalar: hedef kare.
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

    if (boardWrap) {
      boardWrap.classList.remove("board-shake");
    }

    trainMistakeTimer = null;
  }, 650);
}

function continueTrain() {
  if (!trainMode || !lesson || !lesson.variation) return;

  const moves = lesson.variation.moves;

  // Varyant tamamlandı.
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

  // Sıradaki hamle rakibinse otomatik oynat.
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
      continueTrain();
    }, 500);

    renderLearnPanel();
    return;
  }

  trainPhase = "your-move";
  renderLearnPanel();
}
/* ---------- Pointer input (click + drag) ---------- */

boardEl.addEventListener("pointerdown", (e) => {
  if (lesson && !trainMode) return;
  if (trainMode && trainPhase !== "your-move") return;
  if (e.button !== 0 || drag) return;

  // Moves can only be played on the live position
  if (viewPly !== null) return;

  // During a drill the board only accepts moves when it is the player's turn
  if (drill && drill.phase !== "your-move") return;

  const name = squareFromPoint(e.clientX, e.clientY);
  if (!name) return;
  e.preventDefault();

  // 1. A piece is selected and a legal destination was pressed -> click-to-move
  if (selectedSquare && legalMoves.some((m) => m.to === name)) {
    playMove(selectedSquare, name);
    return;
  }

  // 2. Own piece pressed -> select it and arm a possible drag
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

  // 3. Anything else -> deselect
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

drillStopBtn.addEventListener("click", () => {
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

drillContinueBtn.addEventListener("click", () => {
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

  // Plain click on an own piece: pressing an already selected piece deselects it
  if (!moved) {
    if (wasSelected) clearSelection();
    renderBoard();
    return;
  }

  // Dropped after a drag
  const target = cancelled ? null : squareFromPoint(e.clientX, e.clientY);
  if (target && legalMoves.some((m) => m.to === target)) {
    playMove(from, target, "q", false, false);
    return;
  }

  // Dropped back on its own square keeps the selection, anywhere else clears it
  if (target !== from) clearSelection();
  renderBoard();
}

/* ---------- Notation list and keyboard navigation ---------- */

movesEl.addEventListener("click", (e) => {
  const moveEl = e.target.closest(".move");
  if (!moveEl) return;
  goToPly(Number(moveEl.dataset.ply));
});

window.addEventListener("keydown", (e) => {
  if (
    drag ||
    repDrag ||
    drill ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
  ) {
    return;
  }

  // Learn mode keyboard navigation
  if (lesson && !trainMode) {
    if (trainMode) return;
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

  if (!isRepPage && !isPlayPage) return;

  const total = isRepPage
    ? repertoireGame.history().length
    : game.history().length;

  const current = isRepPage ? (repViewPly ?? total) : (viewPly ?? total);

  let nextPly;

  if (e.key === "ArrowLeft") nextPly = current - 1;
  else if (e.key === "ArrowRight") nextPly = current + 1;
  else if (e.key === "Home") nextPly = 0;
  else if (e.key === "End") nextPly = total;
  else return;

  e.preventDefault();

  if (isRepPage) {
    goToRepPly(nextPly);
  } else {
    goToPly(nextPly);
  }
});

/* ---------- Buttons ---------- */

undoBtnEl.addEventListener("click", () => {
  if (drill) return; // undoing would desync the drill (use Try again instead)
  game.undo();
  viewPly = null;
  clearSelection();
  update();
});

document.getElementById("btn-flip").addEventListener("click", () => {
  orientation = orientation === "w" ? "b" : "w";
  update();
});

document.getElementById("btn-reset").addEventListener("click", () => {
  if (drill) {
    startDrill(); // Reset during a drill restarts it
    return;
  }
  game.reset();
  viewPly = null;
  clearSelection();
  update();
});

/* ---------- Opening recognition (lichess chess-openings, CC0) ---------- */

let openingBook = null;
let curatedOpening = null;
let openingLibrary = curatedOpening ? [curatedOpening] : [];
let lesson = null;
let savedPlayState = null;

/* ---------- Opening learning progress ---------- */

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

  // Eski kayıtları yeni yüzde sistemine uyarla.
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

    console.log("Loaded openings:", openingLibrary);

    renderOpenings();
  } catch (error) {
    console.error("Could not load openings:", error);
  }
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

  const overlay = document.getElementById("learn-complete-overlay");
  overlay.hidden = true;

  update();
}

function nextLessonMove() {
  if (!lesson || !lesson.variation) return;

  // Geçmiş bir konum görüntüleniyorsa önce güncel konuma dön.
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

  // Geçmiş bir konum görüntüleniyorsa önce güncel konuma dön.
  if (viewPly !== null) {
    viewPly = null;
  }

  game.undo();
  lesson.index--;

  clearSelection();
  update();
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

  if (savedPlayState?.pgn) {
    game.loadPgn(savedPlayState.pgn);
  }

  if (savedPlayState) {
    orientation = savedPlayState.orientation;
  }

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
    `${lesson.opening.name} · ${lesson.variation.name} · ${isTrain ? "Train" : "Learn"}`;

  const select = document.getElementById("learn-variation-select");

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

  document.getElementById("learn-title").textContent =
    `${lesson.opening.name} · ${lesson.variation.name}`;

  document.getElementById("learn-progress").textContent =
    `Move ${lesson.index} / ${moves.length}`;

  document.getElementById("learn-explanation").textContent =
    currentMove?.explanation || "Starting position. Press Next to begin.";

  document.getElementById("learn-back").disabled = lesson.index === 0;

  document.getElementById("learn-next").disabled = lesson.index >= moves.length;
}

async function loadOpenings() {
  try {
    const response = await fetch("assets/openings/index.json");

    if (!response.ok) {
      throw new Error("Opening index could not be loaded.");
    }

    const files = await response.json();

    const openings = await Promise.all(
      files.map(async (file) => {
        const openingResponse = await fetch(`assets/openings/${file}`);

        if (!openingResponse.ok) {
          throw new Error(`Could not load ${file}`);
        }

        return openingResponse.json();
      }),
    );

    openingLibrary = openings;
    curatedOpening = openingLibrary[0] || null;

    renderOpenings();
  } catch (error) {
    console.error("Opening loading failed:", error);
  }
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

    learnButton.addEventListener("click", () => {
      startLearn(opening);
    });

    trainButton.addEventListener("click", () => {
      startTrain(opening);
    });

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
// built after assets/openings.json has loaded

function renderOpening() {
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
  // Dimmed when the current position is already past the last named position
}

fetch("./assets/openings.json")
  .then((res) => res.json())
  .then((rows) => {
    openingBook = OpeningBook.build(rows, Chess);
    renderOpening();
  })
  .catch((err) => console.warn("Could not load openings.json", err));

importRepBtnEl.addEventListener("click", () => {
  pgnFileEl.click();
});

const library = Library.load();
let repNotice = { text: "", isError: false };
let drill = null;
let completedDrillLines = new Set();
let drillLinePath = []; // null = not drilling, otherwise see startDrill()

if (library.active) orientation = library.active.color;

function setNotice(text, isError = false) {
  repNotice = { text, isError };
}

function persist() {
  if (!library.save()) {
    setNotice("Could not save to browser storage (full or blocked).", true);
  }
}

function colorName(color) {
  return color === "w" ? "White" : "Black";
}

function renderRepertoire() {
  const repertoire = library.active;
  undoBtnEl.disabled = !!drill;
  drillBtnEl.hidden = true;

  repNoticeEl.textContent = repNotice.text;
  repNoticeEl.classList.toggle("error", repNotice.isError);
  repNextEl.innerHTML = "";
  repCommentEl.textContent = "";
  repTurnEl.textContent = "";
  repTurnEl.classList.remove("off");
  drillActionEl.hidden = true;

  if (!repertoire) {
    repInfoEl.textContent = "No repertoire yet. Import a PGN file to start.";
    return;
  }

  const { positions, moves } = repertoire.stats();
  // repInfoEl.textContent = `${positions} positions, ${moves} moves`;

  // Comment attached to the move that led to this position
  const last = repertoireGame.history({ verbose: true }).at(-1);
  if (last && last.before) {
    const edge = repertoire.getNode(last.before)?.edges.get(last.san);
    if (edge && edge.comment) repCommentEl.textContent = edge.comment;
  }

  // While drilling the next moves stay hidden (that would give the answer away)
  if (drill) {
    renderDrillStatus();
    return;
  }

  const node = repertoire.getNode(repertoireGame.fen());
  if (!node) {
    repTurnEl.textContent = "Out of repertoire";
    repTurnEl.classList.add("off");
    return;
  }
  if (node.edges.size === 0) {
    repTurnEl.textContent = "End of line";
    return;
  }

  repTurnEl.textContent =
    repertoireGame.turn() === repertoire.color
      ? "Your move"
      : "Opponent's options";

  let first = true;
  for (const edge of node.edges.values()) {
    const btn = document.createElement("button");
    btn.className = "rep-move" + (first ? " main" : "");
    btn.dataset.san = edge.san;
    btn.textContent = edge.san;
    if (edge.comment) btn.title = edge.comment;
    repNextEl.appendChild(btn);
    first = false;
  }
}

// Clicking a suggested move plays it on the repertoire board only.
repNextEl.addEventListener("click", (e) => {
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

pgnFileEl.addEventListener("change", async () => {
  const file = pgnFileEl.files[0];
  pgnFileEl.value = ""; // allows importing the same file again
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

/* ---------- Drill ---------- */
// drill = { rep, phase, mistake, empty, timer }
// phase: "your-move" | "opponent" | "mistake" | "complete"

const OPPONENT_DELAY_MS = 500;

function endDrill() {
  drillHintSquares = [];
  if (drill && drill.timer) clearTimeout(drill.timer);
  drill = null;
  clearTimeout(drillCompleteTimer);
  drillCompleteTimer = null;
}

function getAvailableDrillLines(rep) {
  const startFen = new Chess().fen();
  const lines = [];

  function walk(fen, path, visited) {
    const node = rep.getNode(fen);

    if (!node || node.edges.size === 0) {
      if (path.length > 0) {
        lines.push([...path]);
      }
      return;
    }

    for (const edge of node.edges.values()) {
      const nextPath = [...path, edge.uci];
      const nextVisited = new Set(visited);
      nextVisited.add(node.key);

      // Döngüye girilmesini önle.
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

  if (!completedDrillLines) {
    completedDrillLines = new Set();
  }

  // Drill artık kendi oyun nesnesini kullanacak.
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
// Decides what happens next at the live position: finish, wait for the player,
// or let the opponent answer with a random repertoire move.
function advanceDrill() {
  if (!drill || drill.phase === "complete") return;

  const { rep } = drill;

  if (lineEnded(rep, drillGame.fen())) {
    drill.phase = "complete";

    playSound("promote");

    drill.empty = drillGame.history().length === 0;

    if (drillCompleteTimer) {
      clearTimeout(drillCompleteTimer);
    }

    drillCompleteOverlay.hidden = true;

    drillCompleteTimer = setTimeout(() => {
      if (drill?.phase === "complete") {
        update();
      }
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
      update(false);
      advanceDrill();
    }
  }, OPPONENT_DELAY_MS);
}

// Called after the player moved during a drill
function onDrillMove(move) {
  if (!drill) return;

  // Doğru hamle
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

  // Yanlış hamle
  drill.mistakes++;
  drill.mistakeCount++;

  const node = drill.rep.getNode(move.before);
  const correctEdges = node ? [...node.edges.values()] : [];

  // İlk hatada doğru hamlenin çıkış karesini göster.
  if (drill.mistakeCount >= 1) {
    drillHintSquares = correctEdges.length
      ? [parseUci(correctEdges[0].uci).from]
      : [];
  }

  // İkinci hatada doğru hamleleri göster.
  if (drill.mistakeCount >= 2) {
    drill.hintShown = true;
    drill.alternatives = correctEdges.slice(0, 2);
  }

  drill.phase = "mistake";
  drill.mistake = move.san;

  const boardWrap = document.querySelector(".board-wrap");

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

    if (boardWrap) {
      boardWrap.classList.remove("board-shake");
    }

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
  switch (drill.phase) {
    case "your-move":
      repTurnEl.textContent = "Your move";
      break;
    case "opponent":
      repTurnEl.textContent = "Opponent's move...";
      break;
    case "mistake":
      repTurnEl.textContent = `Mistake: ${drill.mistake} is not in your repertoire.`;
      repTurnEl.classList.add("off");
      drillActionEl.textContent = "Try again";
      drillActionEl.hidden = false;
      break;
    case "complete": {
      const total = drill.correctMoves + drill.mistakes;
      const accuracy = total
        ? Math.round((drill.correctMoves / total) * 100)
        : 100;

      repTurnEl.textContent = drill.empty
        ? "This repertoire has no moves."
        : `Line complete! ${accuracy}% accuracy`;

      drillActionEl.textContent = "Restart";
      drillActionEl.hidden = drill.empty;
      break;
    }
  }
}

drillBtnEl.addEventListener("click", () => {
  if (drill) {
    endDrill();
    update();
  } else {
    startDrill();
  }
});

analyseBoardEl.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 || analyseDrag) return;

  const name = analyseSquareFromPoint(e.clientX, e.clientY);
  if (!name) return;

  e.preventDefault();

  // Seçili taşın yasal hedefine tıklandı.
  if (
    analyseSelectedSquare &&
    analyseLegalMoves.some((move) => move.to === name)
  ) {
    makeAnalyseMove(analyseSelectedSquare, name);
    return;
  }

  // Kendi taşımıza tıklandı.
  const piece = analyseGame.get(name);

  if (piece && piece.color === analyseGame.turn()) {
    const wasSelected = analyseSelectedSquare === name;

    analyseSelectedSquare = name;

    analyseLegalMoves = analyseGame.moves({
      square: name,
      verbose: true,
    });

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

  // Boş veya rakip taş: seçimi kaldır.
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

window.addEventListener("pointerup", (e) => {
  endAnalyseDrag(e);
});

window.addEventListener("pointercancel", (e) => {
  endAnalyseDrag(e, true);
});

drillActionEl.addEventListener("click", () => {
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

      if (library.active) {
        orientation = library.active.color;
      }

      setNotice("");
      update();
    });

    if (library.active?.id === rep.id) {
      card.classList.add("active");
    }
    if (drill?.rep.id === rep.id) {
      card.classList.add("drilling");
    }

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
      if (!confirm(`Delete "${rep.name}"? This cannot be undone.`)) {
        return;
      }

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

// Navbar page navigation
const navLinks = document.querySelectorAll(".nav-link");
const brandLink = document.querySelector(".nav-brand");

const pages = {
  play: document.querySelector("#play"),
  analyse: document.querySelector("#analyse"),
  openings: document.querySelector("#openings"),
  repertoire: document.querySelector("#repertoire"),
  profile: document.querySelector("#profile"),
};

function showPage(pageName) {
  Object.entries(pages).forEach(([name, element]) => {
    element.hidden = name !== pageName;
  });

  navLinks.forEach((link) => {
    link.classList.toggle(
      "active",
      link.getAttribute("href") === `#${pageName}`,
    );
  });

  const isNormalPlay = pageName === "play" && !lesson && !trainMode;

  if (analysisPanel) {
    analysisPanel.hidden = !isNormalPlay;
  }

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
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const pageName = link.getAttribute("href").slice(1);
    showPage(pageName);
    history.replaceState(null, "", `#${pageName}`);
  });
});

brandLink.addEventListener("click", (event) => {
  event.preventDefault();
  showPage("play");
  history.replaceState(null, "", "#play");
});

document
  .getElementById("learn-variation-select")
  .addEventListener("change", selectLearnVariation);

document.getElementById("learn-next").addEventListener("click", nextLessonMove);

document
  .getElementById("learn-back")
  .addEventListener("click", previousLessonMove);

document.getElementById("learn-exit").addEventListener("click", exitLearn);

document.getElementById("filter-all").addEventListener("click", () => {
  openingFilter = "all";

  document.getElementById("filter-all").classList.add("active");
  document.getElementById("filter-favorites").classList.remove("active");

  renderOpenings();
});

document.getElementById("filter-favorites").addEventListener("click", () => {
  openingFilter = "favorites";

  document.getElementById("filter-favorites").classList.add("active");
  document.getElementById("filter-all").classList.remove("active");

  renderOpenings();
});

document.getElementById("analyse-btn-undo").addEventListener("click", () => {
  if (analyseCurrentPly <= 0) return;

  goToAnalysePly(analyseCurrentPly - 1);
});

document.getElementById("analyse-btn-flip").addEventListener("click", () => {
  analyseOrientation = analyseOrientation === "w" ? "b" : "w";

  renderAnalyseBoard();
});

document.getElementById("analyse-btn-reset").addEventListener("click", () => {
  goToAnalysePly(0);
});

document
  .getElementById("learn-complete-close")
  .addEventListener("click", () => {
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
    lesson.index = 0;

    clearSelection();
    update();
  });

document
  .getElementById("learn-complete-train")
  .addEventListener("click", startCurrentLearnTrain);

const hintButton = document.getElementById("train-hint");

hintButton.addEventListener("click", () => {
  if (!trainMode || trainPhase !== "your-move") return;

  trainHintShown = !trainHintShown;

  if (trainHintShown) {
    const move = lesson.variation.moves[lesson.index];
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

initStockfish();
initCuratedOpenings();
update();
