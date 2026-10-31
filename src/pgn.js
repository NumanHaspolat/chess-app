// PGN -> Repertoire. Understands variations "( ... )", comments "{ ... }" and
// ";" comments, NAGs ($1), move numbers, multi-game files and result tokens.
//
// The chess.js class is passed in (instead of imported) so this file works
// both in the browser (CDN import) and in Node tests.

import { positionKey } from "./repertoire.js";

const RESULTS = new Set(["1-0", "0-1", "1/2-1/2", "*"]);

/* ---------- Splitting a file into games ---------- */

export function splitGames(text) {
  const games = [];
  let cur = { headers: {}, lines: [], inMoves: false };

  const flush = () => {
    const movetext = cur.lines.join("\n").trim();
    if (movetext) games.push({ headers: cur.headers, movetext });
    cur = { headers: {}, lines: [], inMoves: false };
  };

  const clean = text.replace(/^\uFEFF/, "").replace(/\r/g, "");
  for (const raw of clean.split("\n")) {
    const line = raw.trim();
    const tag = /^\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]$/.exec(line);
    if (tag) {
      if (cur.inMoves) flush(); // a header after movetext starts a new game
      cur.headers[tag[1]] = tag[2].replace(/\\(["\\])/g, "$1");
      continue;
    }
    if (line.startsWith("%")) continue; // PGN escape line
    if (line) cur.inMoves = true;
    cur.lines.push(line);
  }
  flush();
  return games;
}

/* ---------- Tokenizer ---------- */

function cleanComment(text) {
  return text
    .replace(/\[%[^\]]*\]/g, "") // [%clk ...], [%eval ...], [%csl ...]
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s) {
  const tokens = [];
  const n = s.length;
  let i = 0;

  while (i < n) {
    const c = s[i];

    if (/\s/.test(c)) {
      i++;
    } else if (c === "{") {
      const end = s.indexOf("}", i + 1);
      const stop = end === -1 ? n : end;
      const text = cleanComment(s.slice(i + 1, stop));
      if (text) tokens.push({ type: "comment", text });
      i = stop + 1;
    } else if (c === ";") {
      const end = s.indexOf("\n", i);
      const stop = end === -1 ? n : end;
      const text = cleanComment(s.slice(i + 1, stop));
      if (text) tokens.push({ type: "comment", text });
      i = stop + 1;
    } else if (c === "(") {
      tokens.push({ type: "open" });
      i++;
    } else if (c === ")") {
      tokens.push({ type: "close" });
      i++;
    } else if (c === "$") {
      i++; // NAG like $1, $14: skip the digits
      while (i < n && /\d/.test(s[i])) i++;
    } else {
      let j = i;
      while (j < n && !/[\s(){};$]/.test(s[j])) j++;
      let word = s.slice(i, j);
      i = j;

      word = word.replace(/^\d+\.+/, ""); // "12." / "12..." / glued "1.e4"
      if (!word || /^\.+$/.test(word) || /^\d+$/.test(word)) continue;
      if (RESULTS.has(word) || word === "e.p.") continue;

      word = word
        .replace(/[!?]+$/, "") // move annotations !, ?, !?, ??
        .replace(/^0-0-0$/, "O-O-O")
        .replace(/^0-0$/, "O-O");
      if (word) tokens.push({ type: "move", san: word });
    }
  }
  return tokens;
}

/* ---------- Parsing one (sub)line ---------- */

// Skips tokens until the ")" that closes the current line. Returns its index.
function skipToLineEnd(tokens, i) {
  let depth = 0;
  while (i < tokens.length) {
    if (tokens[i].type === "open") depth++;
    else if (tokens[i].type === "close") {
      if (depth === 0) return i;
      depth--;
    }
    i++;
  }
  return i;
}

// Parses moves starting from startFen. Stops at the ")" closing this line (or
// at the end) and returns that index. A "(" starts an alternative to the move
// just played, so it is parsed from the position BEFORE that move.
function parseLine(tokens, i, startFen, ctx) {
  const chess = new ctx.Chess(startFen);
  let prevFen = null; // position before the last move of this line
  let lastEdge = null;

  while (i < tokens.length) {
    const t = tokens[i];

    if (t.type === "close") return i;

    if (t.type === "open") {
      if (prevFen === null) {
        i = skipToLineEnd(tokens, i + 1) + 1; // variation with nothing before it
      } else {
        i = parseLine(tokens, i + 1, prevFen, ctx) + 1;
      }
      continue;
    }

    if (t.type === "comment") {
      if (lastEdge) {
        lastEdge.comment = lastEdge.comment
          ? `${lastEdge.comment} ${t.text}`
          : t.text;
      }
      i++;
      continue;
    }

    // move
    const before = chess.fen();
    let move;
    try {
      move = chess.move(t.san);
    } catch {
      ctx.errors.push({
        game: ctx.game,
        san: t.san,
        message: `Illegal or unreadable move "${t.san}"`,
      });
      return skipToLineEnd(tokens, i + 1);
    }
    const uci = move.from + move.to + (move.promotion ?? "");
    const { edge, isNew } = ctx.rep.addMove(before, move.san, uci, chess.fen());
    if (isNew) ctx.newMoves++;
    prevFen = before;
    lastEdge = edge;
    i++;
  }
  return i;
}

/* ---------- Public API ---------- */

// Adds every game in `text` to `rep`. Returns a summary.
export function importPgn(text, Chess, rep) {
  const summary = { games: 0, skipped: 0, newMoves: 0, errors: [] };
  const startFen = new Chess().fen();

  splitGames(text).forEach((g, index) => {
    const game = index + 1;

    if (g.headers.Variant && !/^standard$/i.test(g.headers.Variant)) {
      summary.skipped++;
      summary.errors.push({
        game,
        message: `Variant "${g.headers.Variant}" is not supported`,
      });
      return;
    }
    if (g.headers.FEN && positionKey(g.headers.FEN) !== positionKey(startFen)) {
      summary.skipped++;
      summary.errors.push({
        game,
        message: "Custom start positions (FEN) are not supported",
      });
      return;
    }

    const tokens = tokenize(g.movetext);
    const ctx = { Chess, rep, game, errors: summary.errors, newMoves: 0 };

    let i = 0;
    while (i < tokens.length) {
      i = parseLine(tokens, i, startFen, ctx) + 1; // +1 skips a stray ")"
    }

    summary.games++;
    summary.newMoves += ctx.newMoves;
  });

  return summary;
}
