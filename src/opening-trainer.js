const OPENING_BASE_PATH = "./assets/openings/";

function parseMoveText(moveText) {
  return moveText
    .replace(/\d+\.(?:\.\.)?/g, " ")
    .trim()
    .split(/\s+/)
    .filter(
      (token) => token && !["1-0", "0-1", "1/2-1/2", "*"].includes(token),
    );
}

export function normalizeColor(color) {
  return color === "b" || color === "black" ? "black" : "white";
}

export function validateVariation(variation, Chess) {
  const chess = new Chess();
  const sanMoves = parseMoveText(variation.moves);
  const moves = [];

  for (const san of sanMoves) {
    const fenBefore = chess.fen();

    let move;

    try {
      move = chess.move(san);
    } catch {
      throw new Error(
        `Invalid move "${san}" in variation "${variation.name}".`,
      );
    }

    if (!move) {
      throw new Error(
        `Invalid move "${san}" in variation "${variation.name}".`,
      );
    }

    moves.push({
      san: move.san,
      color: move.color,
      from: move.from,
      to: move.to,
      fenBefore,
      fenAfter: chess.fen(),
      ply: moves.length,
      // Yeni format: notes[i] = i. yarım hamlenin açıklaması (aynı SAN çakışmaz).
      // Eski format: explanations[san] (aynı SAN iki kez geçerse son yazılan kalır).
      explanation:
        (Array.isArray(variation.notes)
          ? variation.notes[moves.length]
          : null) ??
        variation.explanations?.[move.san] ??
        "",
    });
  }

  return {
    ...variation,
    moves,
  };
}

export async function loadOpening(id, Chess) {
  const file = `${OPENING_BASE_PATH}${id}.json`;

  const response = await fetch(file);

  if (!response.ok) {
    throw new Error(`Could not load opening: ${id}`);
  }

  const opening = await response.json();

  if (!Array.isArray(opening.variations)) {
    throw new Error(`Opening "${id}" has no valid variations.`);
  }

  const variations = opening.variations.map((variation) =>
    validateVariation(variation, Chess),
  );

  return {
    ...opening,
    color: normalizeColor(opening.color),
    category:
      opening.category || (opening.name.split(/\s+/).slice(-1)[0] ?? "Other"),
    difficulty: opening.difficulty || "medium",
    variations,
  };
}
