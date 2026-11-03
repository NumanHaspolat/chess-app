const SPRITE_DIR = "./assets/pieces/";

let workingSuffix = 0; 

export const PIECE_TYPES = ["p", "n", "b", "r", "q", "k"];

export function pieceSrc(color, type, suffixIndex = workingSuffix) {
  return `${SPRITE_DIR}${color}${type.toUpperCase()}.png`;
}

export function createPieceEl(color, type, extraClass = "") {
  const el = document.createElement("img");
  el.className = `piece ${color}` + (extraClass ? ` ${extraClass}` : "");
  el.alt = "";
  el.draggable = false;
  loadSprite(el, color, type);
  return el;
}

function loadSprite(el, color, type) {
  let attempt = 0;
  let index = workingSuffix;

  el.addEventListener("load", () => {
    workingSuffix = index; // remember which naming works
  });
  el.addEventListener("error", () => {
    attempt++;
    if (attempt >= SUFFIXES.length) return; // both names failed
    index = (index + 1) % SUFFIXES.length;
    el.src = pieceSrc(color, type, index);
  });

  el.src = pieceSrc(color, type, index);
}

// Preload every sprite so re-rendering the board never flashes empty squares
export function preloadPieces() {
  for (const color of ["w", "b"]) {
    for (const type of PIECE_TYPES) {
      const img = new Image();
      let attempt = 0;
      let index = workingSuffix;
      img.addEventListener("load", () => {
        workingSuffix = index;
      });
      img.addEventListener("error", () => {
        attempt++;
        if (attempt >= SUFFIXES.length) return;
        index = (index + 1) % SUFFIXES.length;
        img.src = pieceSrc(color, type, index);
      });
      img.src = pieceSrc(color, type, index);
    }
  }
}
