// Pixel-art piece sprites: assets/pieces/{w|b}{P|N|B|R|Q|K}<SUFFIX>.svg

const SPRITE_DIR = "./assets/pieces/";

// Your sprite files end with " (5)" (e.g. "wB (5).svg"), so this stays " (5)".
// If you rename the files to plain "wB.svg", set this to "".

export const PIECE_TYPES = ["p", "n", "b", "r", "q", "k"];

export function pieceSrc(color, type) {
  return `${SPRITE_DIR}${color}${type.toUpperCase()}.svg`;
}

export function createPieceEl(color, type, extraClass = "") {
  const el = document.createElement("img");
  el.className = `piece ${color}` + (extraClass ? ` ${extraClass}` : "");
  el.src = pieceSrc(color, type);
  el.alt = "";
  el.draggable = false;
  return el;
}

// Preload every sprite so re-rendering the board never flashes empty squares
export function preloadPieces() {
  for (const color of ["w", "b"]) {
    for (const type of PIECE_TYPES) {
      new Image().src = pieceSrc(color, type);
    }
  }
}
