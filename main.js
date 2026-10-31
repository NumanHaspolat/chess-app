import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.0.0/+esm";
import { createPieceEl, preloadPieces } from "./src/pieces.js";
import { Repertoire } from "./src/repertoire.js";
import { Library } from "./src/library.js";
import { judgeMove, pickReply, lineEnded, parseUci } from "./src/drill.js";
import { importPgn } from "./src/pgn.js";
import { OpeningBook } from "./src/openings.js";

const game = new Chess(); // the real game (always the full move history)

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
const statusEl = document.getElementById("status");
const movesEl = document.getElementById("moves");
const stripTopEl = document.getElementById("strip-top");
const stripBottomEl = document.getElementById("strip-bottom");
const openingEl = document.getElementById("opening");
const pgnFileEl = document.getElementById("pgn-file");
const importRepBtnEl = document.getElementById("btn-import-rep");
const drillBtnEl = document.getElementById("btn-drill");
const drillActionEl = document.getElementById("btn-drill-action");
const undoBtnEl = document.getElementById("btn-undo");
const repInfoEl = document.getElementById("rep-info");
const repNoticeEl = document.getElementById("rep-notice");
const repTurnEl = document.getElementById("rep-turn");
const repNextEl = document.getElementById("rep-next");
const repCommentEl = document.getElementById("rep-comment");

let orientation = "w";
let selectedSquare = null;
let legalMoves = [];
let drillHintSquares = [];
let drag = null; // active press/drag state
let hoverSquare = null;

let viewPly = null; // null = live position, otherwise number of plies being viewed
let view = game; // the position currently displayed on the board

/* ---------- Coordinates helpers ---------- */

function playSound(name) {
  const sound = SOUNDS[name];

  if (!sound) return;

  sound.pause();
  sound.currentTime = 0;

  sound.play().catch(() => {});
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

function findKingSquare(color) {
  const king = view
    .board()
    .flat()
    .find((p) => p && p.type === "k" && p.color === color);
  return king ? king.square : null;
}

/* ---------- View (history navigation) ---------- */

function syncView() {
  const moves = game.history();

  if (viewPly === null || viewPly >= moves.length) {
    viewPly = null;
    view = game;
    return;
  }

  view = new Chess();
  for (let i = 0; i < viewPly; i++) {
    view.move(moves[i]);
  }
}

function goToPly(ply) {
  const total = game.history().length;
  const clamped = Math.max(0, Math.min(ply, total));
  viewPly = clamped >= total ? null : clamped;
  clearSelection();
  update();
}

/* ---------- Rendering ---------- */

function renderBoard() {
  boardEl.innerHTML = "";

  const history = view.history({ verbose: true });
  const lastMove = history[history.length - 1];
  const checkSquare = view.inCheck() ? findKingSquare(view.turn()) : null;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const name = squareName(row, col);
      const fileIndex = FILES.indexOf(name[0]);
      const rankNumber = Number(name[1]);

      const squareEl = document.createElement("div");

      squareEl.className =
        "square " + ((fileIndex + rankNumber) % 2 === 0 ? "dark" : "light");

      squareEl.dataset.square = name;

      if (drillHintSquares.includes(name)) {
        squareEl.classList.add("drill-hint");
      }
      squareEl.className =
        "square " + ((fileIndex + rankNumber) % 2 === 0 ? "dark" : "light");

      squareEl.dataset.square = name;

      if (drillHintSquares.includes(name)) {
        squareEl.classList.add("drill-hint");
      }

      if (lastMove && (name === lastMove.from || name === lastMove.to)) {
        squareEl.classList.add("last-move");
      }
      if (name === selectedSquare) squareEl.classList.add("selected");
      if (name === checkSquare) squareEl.classList.add("check");

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
}

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

/* ---------- Material ---------- */

function getMaterial() {
  const counts = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };

  view
    .board()
    .flat()
    .forEach((piece) => {
      if (piece && piece.type !== "k") counts[piece.color][piece.type]++;
    });

  // Pieces each side is "ahead" by, shown in the opponent's color
  const ahead = { w: [], b: [] };
  let net = 0; // positive = white ahead

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
  const material = getMaterial();
  const bottomColor = orientation;
  const topColor = orientation === "w" ? "b" : "w";
  renderStrip(stripBottomEl, bottomColor, material);
  renderStrip(stripTopEl, topColor, material);
}

function update() {
  syncView();
  renderBoard();
  renderStrips();
  renderStatus();
  renderOpening();
  renderRepertoire();
  renderMoves();
  renderRepLibrary();
  renderDrillAlternatives();
}

/* ---------- Game actions ---------- */

function clearSelection() {
  selectedSquare = null;
  legalMoves = [];
}

function playMove(from, to, promotion = "q", byDrill = false) {
  const target = game.get(to);

  const move = game.move({
    from,
    to,
    promotion,
  });

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

  clearSelection();
  update();

  if (drill) {
    if (byDrill) advanceDrill();
    else onDrillMove(move);
  }
}

/* ---------- Pointer input (click + drag) ---------- */

boardEl.addEventListener("pointerdown", (e) => {
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
    playMove(from, target);
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
  if (drag) return;

  const total = game.history().length;
  const current = viewPly ?? total;

  if (e.key === "ArrowLeft") goToPly(current - 1);
  else if (e.key === "ArrowRight") goToPly(current + 1);
  else if (e.key === "Home") goToPly(0);
  else if (e.key === "End") goToPly(total);
  else return;

  e.preventDefault();
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

let openingBook = null; // built after assets/openings.json has loaded

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
  if (!hit.exact) openingEl.classList.add("dim");
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
let drill = null; // null = not drilling, otherwise see startDrill()

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
  drillBtnEl.hidden = !repertoire;
  drillBtnEl.textContent = drill ? "Stop drill" : "Drill";
  drillBtnEl.classList.toggle("active", !!drill);

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
  repInfoEl.textContent = `${positions} positions, ${moves} moves`;

  // Comment attached to the move that led to this position
  const last = view.history({ verbose: true }).at(-1);
  if (last && last.before) {
    const edge = repertoire.getNode(last.before)?.edges.get(last.san);
    if (edge && edge.comment) repCommentEl.textContent = edge.comment;
  }

  // While drilling the next moves stay hidden (that would give the answer away)
  if (drill) {
    renderDrillStatus();
    return;
  }

  const node = repertoire.getNode(view.fen());
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
    view.turn() === repertoire.color ? "Your move" : "Opponent's options";

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

// Clicking a suggested move plays it on the board
repNextEl.addEventListener("click", (e) => {
  if (drill) return;
  const btn = e.target.closest(".rep-move");
  if (!btn) return;

  if (viewPly !== null) goToPly(game.history().length); // back to the live position

  const move = game
    .moves({ verbose: true })
    .find((m) => m.san === btn.dataset.san);
  if (move) playMove(move.from, move.to, move.promotion);
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
}

function startDrill() {
  const rep = library.active;
  if (!rep) return;
  endDrill();

  game.reset();
  drillHintSquares = [];
  viewPly = null;
  clearSelection();
  orientation = rep.color;

  drill = {
    rep,
    phase: "your-move",
    mistake: null,

    // Hata ve ipucu takibi
    mistakeCount: 0,
    hintShown: false,

    // Alternatif doğru hamleler
    alternatives: [],
  };
  advanceDrill();
}

// Decides what happens next at the live position: finish, wait for the player,
// or let the opponent answer with a random repertoire move.
function advanceDrill() {
  if (!drill) return;
  const { rep } = drill;

  if (lineEnded(rep, game.fen())) {
    drill.phase = "complete";
    drill.empty = game.history().length === 0;
    update();
    return;
  }

  if (game.turn() === rep.color) {
    drill.phase = "your-move";
    update();
    return;
  }

  drill.phase = "opponent";
  update();
  drill.timer = setTimeout(() => {
    if (!drill) return;
    drill.timer = null;
    const edge = pickReply(rep, game.fen());
    if (!edge) {
      advanceDrill();
      return;
    }
    const { from, to, promotion } = parseUci(edge.uci);
    playMove(from, to, promotion, true);
  }, OPPONENT_DELAY_MS);
}

// Called after the player moved during a drill
function onDrillMove(move) {
  if (judgeMove(drill.rep, move.before, move.san)) {
    drill.mistakeCount = 0;
    drill.hintShown = false;
    drillHintSquares = [];
    drill.alternatives = [];

    renderDrillAlternatives();
    advanceDrill();
    return;
  }

  drill.mistakeCount++;

  const node = drill.rep.getNode(move.before);

  const correctEdges = node ? [...node.edges.values()] : [];

  // İlk hatada mor kareyi göster.
  if (drill.mistakeCount >= 1) {
    drillHintSquares = correctEdges.length
      ? [parseUci(correctEdges[0].uci).from]
      : [];
  }

  // İkinci hatada panelde doğru hamleleri göster.
  if (drill.mistakeCount >= 2) {
    drill.hintShown = true;
    drill.alternatives = correctEdges.slice(0, 2);
  }

  drill.phase = "mistake";
  drill.mistake = move.san;

  update();
  renderDrillAlternatives();
}
function retryDrill() {
  if (!drill || drill.phase !== "mistake") return;

  // Yanlış hamle sadece Try Again'e basıldığında geri alınır.
  game.undo();

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
    case "complete":
      repTurnEl.textContent = drill.empty
        ? "This repertoire has no moves."
        : "Line complete. Well done!";
      drillActionEl.textContent = "Restart";
      drillActionEl.hidden = drill.empty;
      break;
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

drillActionEl.addEventListener("click", () => {
  if (!drill) return;
  if (drill.phase === "mistake") retryDrill();
  else if (drill.phase === "complete") startDrill();
});

function renderDrillAlternatives() {
  const panel = document.getElementById("drill-alternatives");

  if (!panel) {
    console.error("drill-alternatives HTML elementi bulunamadı!");
    return;
  }

  console.log("Panel kontrolü:", {
    phase: drill?.phase,
    hintShown: drill?.hintShown,
    alternatives: drill?.alternatives,
  });

  panel.innerHTML = "";

  if (
    !drill ||
    drill.phase !== "mistake" ||
    !drill.hintShown ||
    !drill.alternatives?.length
  ) {
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

    if (library.active?.id === rep.id) {
      card.classList.add("active");
    }

    const title = document.createElement("h3");
    title.textContent = rep.name;

    const selectButton = document.createElement("button");
    selectButton.textContent =
      library.active?.id === rep.id ? "Selected" : "Select";

    selectButton.addEventListener("click", () => {
      endDrill();
      library.setActive(rep.id);
      persist();

      if (library.active) {
        orientation = library.active.color;
      }

      setNotice("");
      update();
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

      if (library.active) {
        orientation = library.active.color;
      }

      setNotice("");
      update();
    });

    const actions = document.createElement("div");
    actions.className = "rep-card-actions";
    actions.append(selectButton, renameButton, deleteButton);

    card.append(title, actions);
    container.appendChild(card);
  });
}

update();
