// Opening recognition from lichess-org/chess-openings (CC0 / public domain).
// assets/openings.json = [[eco, name, pgn], ...] (a.tsv..e.tsv merged).
//
// Every named opening is replayed once and indexed by position, so a
// transposition into the same position gets the same name.
//
// The chess.js class is passed in so this works in the browser and in Node.

import { positionKey } from "./repertoire.js";

const MOVE_NUMBER = /^\d+\.+/;

function pgnToSan(pgn) {
  return pgn
    .split(/\s+/)
    .map((t) => t.replace(MOVE_NUMBER, ""))
    .filter(Boolean);
}

export class OpeningBook {
  constructor() {
    this.byKey = new Map(); // position key -> { eco, name, ply }
  }

  static build(rows, Chess) {
    const book = new OpeningBook();
    const startFen = new Chess().fen();

    // prefix of moves -> FEN, so shared opening prefixes are only replayed once
    const fenCache = new Map([["", startFen]]);

    for (const [eco, name, pgn] of rows) {
      const moves = pgnToSan(pgn);

      // longest already-known prefix
      let k = moves.length;
      while (k > 0 && !fenCache.has(moves.slice(0, k).join(" "))) k--;

      const chess = new Chess(fenCache.get(moves.slice(0, k).join(" ")));
      let ok = true;
      for (let i = k; i < moves.length; i++) {
        try {
          chess.move(moves[i]);
        } catch {
          ok = false;
          break;
        }
        fenCache.set(moves.slice(0, i + 1).join(" "), chess.fen());
      }
      if (!ok || moves.length === 0) continue;

      const key = positionKey(chess.fen());
      const existing = book.byKey.get(key);
      if (!existing || moves.length > existing.ply) {
        book.byKey.set(key, { eco, name, ply: moves.length });
      }
    }
    return book;
  }

  lookup(fen) {
    return this.byKey.get(positionKey(fen)) ?? null;
  }

  // Walks the played moves (SAN list) and returns the LAST named position:
  // { eco, name, ply, exact } where `exact` means the current position itself
  // is a book position (otherwise the opening was left `plies - ply` moves ago).
  find(sanMoves, Chess) {
    const chess = new Chess();
    let best = null;
    for (let i = 0; i < sanMoves.length; i++) {
      try {
        chess.move(sanMoves[i]);
      } catch {
        break;
      }
      const hit = this.lookup(chess.fen());
      if (hit) best = { ...hit, at: i + 1 };
    }
    if (!best) return null;
    return { ...best, exact: best.at === sanMoves.length };
  }
}
