import { playPromoteSound } from "../main.js";

export function judgeMove(rep, fenBefore, san) {
  const node = rep.getNode(fenBefore);
  return !!node && node.edges.has(san);
}

// Picks one of the repertoire moves in `fen` at random (equal chance each).
// Returns the edge, or null when the line ends here.
export function pickReply(rep, fen, rng = Math.random) {
  const node = rep.getNode(fen);
  if (!node || node.edges.size === 0) return null;
  const edges = [...node.edges.values()];
  return edges[Math.floor(rng() * edges.length)];
}

export function lineEnded(rep, fen) {
  const node = rep.getNode(fen);
  return !node || node.edges.size === 0;
}

// Splits a UCI move like "e7e8q" into the arguments the board needs.
export function parseUci(uci) {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : "q",
  };
}
