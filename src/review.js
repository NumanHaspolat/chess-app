// Analysis math: win percentage, accuracy, sacrifice detection and move classification (never touches the DOM).
import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.0.0/+esm";

export const PIECE_VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

// Lichess / chess.com style: centipawns -> win percentage (expected score x 100)
export function winPercent(cp) {
  const c = Math.max(-1200, Math.min(1200, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * c)) - 1);
}

// Move accuracy from the win-percentage loss (Lichess formula)
export function moveAccuracy(winLoss) {
  const acc =
    103.1668100711649 * Math.exp(-0.04354415386753951 * Math.max(0, winLoss)) -
    3.166924740191411 +
    1;
  return Math.max(0, Math.min(100, acc));
}

// Game accuracy: mean of the volatility-weighted mean and the harmonic mean
export function combineAccuracy(accs, weights) {
  if (!accs.length) return null;
  const weightSum = weights.reduce((a, b) => a + b, 0) || 1;
  const weighted =
    accs.reduce((sum, a, i) => sum + a * weights[i], 0) / weightSum;
  const harmonic =
    accs.length / accs.reduce((sum, a) => sum + 1 / Math.max(a, 1), 0);

  return Math.min(100, Math.max(0, (weighted + harmonic) / 2));
}

export function volatilityWeights(winSeries) {
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

export function materialDiff(chess, color) {
  let diff = 0;
  for (const row of chess.board()) {
    for (const p of row) {
      if (!p || p.type === "k") continue;
      diff += (p.color === color ? 1 : -1) * PIECE_VAL[p.type];
    }
  }
  return diff;
}

// Net gain of the capture chain on one square for the side to move (simple static exchange).
export function quiesceGain(chess, square, depth) {
  if (depth <= 0) return 0;

  const captures = chess
    .moves({ verbose: true })
    .filter((m) => m.to === square && m.captured);
  if (!captures.length) return 0;

  captures.sort((a, b) => PIECE_VAL[a.piece] - PIECE_VAL[b.piece]);

  let best = 0; // not capturing is always allowed
  for (const m of captures.slice(0, 3)) {
    chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    const value = PIECE_VAL[m.captured] - quiesceGain(chess, square, depth - 1);
    chess.undo();
    best = Math.max(best, value);
  }
  return best;
}

// Plays the engine's principal variation and measures the mover's material difference
// once the exchanges are over. Negative = material was sacrificed (e.g. -3 = a piece).
export function pvMaterialSwing(fenBefore, pvMoves, color) {
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

  // First "quiet" point: the opponent has moved at least once and the next move is not a capture
  for (let k = 1; k + 1 < diffs.length; k++) {
    if (!captures[k + 1]) return diffs[k] - start;
  }

  if (chess.isGameOver()) return diffs[diffs.length - 1] - start;

  // The line was cut in the middle of an exchange: estimate the rest of the capture chain
  let final = diffs[diffs.length - 1];
  if (captures[captures.length - 1]) {
    const gain = quiesceGain(chess, lastTo, 4);
    final += (chess.turn() === color ? 1 : -1) * gain;
  }
  return final - start;
}

// Look-ahead: after the engine line is played to the end, is the sacrificed material still missing?
// Positive = still that much material behind (99 = the mover delivers checkmate).
// A sacrifice that is regained at once (a trade) or a short delay is not brilliant.
export function persistentDeficit(fenBefore, pvMoves, color) {
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
    // The side to move is mated: if the mover delivered it, the sacrifice paid off
    return chess.turn() !== color ? 99 : -99;
  }

  let final = materialDiff(chess, color);
  if (lastCapture) {
    // The line may stop in the middle of an exchange: finish the capture chain on that square
    const gain = quiesceGain(chess, lastTo, 4);
    final += (chess.turn() === color ? 1 : -1) * gain;
  }
  return start - final;
}

// The most profitable capture chain the side to move has in a position.
export function maxCaptureGain(chess) {
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

// Material given up right after a move (static exchange, independent of the engine line).
// raw = what the opponent can win - what this move captured
// net = raw - the threat that already existed BEFORE the move (a piece that was already hanging is not a sacrifice)

function opponentTurnPosition(fen) {
  const parts = fen.split(" ");
  parts[1] = parts[1] === "w" ? "b" : "w";
  parts[3] = "-";
  return new Chess(parts.join(" "));
}

function captureThreatAt(chess, square) {
  if (!chess.get(square)) return 0;
  return quiesceGain(chess, square, 4);
}

// Yalnızca oynanan taşın hamle öncesi ve sonrası tehditlerini karşılaştırır.
export function staticSacrifice(fenBefore, uci, color) {
  try {
    const before = new Chess(fenBefore);
    const from = uci.slice(0, 2);
    const moving = before.get(from);

    if (!moving || moving.color !== color || moving.type === "k") {
      return { raw: 0, net: 0 };
    }

    const threatBefore = captureThreatAt(opponentTurnPosition(fenBefore), from);

    const after = new Chess(fenBefore);
    const mv = after.move(uciToMove(uci));
    if (!mv) return { raw: 0, net: 0 };

    const gained = mv.captured ? PIECE_VAL[mv.captured] : 0;
    const threatAfter = captureThreatAt(after, mv.to);

    const raw = Math.max(0, threatAfter - gained);
    const net = Math.max(0, threatAfter - gained - threatBefore);

    return { raw, net };
  } catch {
    return { raw: 0, net: 0 };
  }
}

// Rakibin, özellikle hamleyi yapan taşı alarak elde edeceği net kazanç.
export function offeredSacrifice(fenBefore, uci) {
  const out = { net: 0, victim: 0, square: null, threat: 0 };

  try {
    const before = new Chess(fenBefore);
    const from = uci.slice(0, 2);
    const threatBefore = captureThreatAt(opponentTurnPosition(fenBefore), from);

    const after = new Chess(fenBefore);
    const mv = after.move(uciToMove(uci));
    if (!mv) return out;

    const offeredPiece = after.get(mv.to);
    if (!offeredPiece || offeredPiece.color !== mv.color) return out;

    const victim = PIECE_VAL[offeredPiece.type];
    if (victim < 3) return out;

    const gained = mv.captured ? PIECE_VAL[mv.captured] : 0;
    const threatAfter = captureThreatAt(after, mv.to);

    out.threat = threatBefore;
    out.net = Math.max(0, threatAfter - gained - threatBefore);
    out.victim = victim;
    out.square = mv.to;
  } catch {
    // Geçersiz pozisyon veya hamle: fedakârlık yok.
  }

  return out;
}

// ---------------------------------------------------------------------------
// Brilliant moves (!!)  –  chess.com definition: "a good piece sacrifice".
//
// What a brilliant move must be (all of it is checked, see assessBrilliant):
//  1. a REAL piece sacrifice: the mover gives up at least a minor piece and the
//     material stays missing after the exchanges settle (or the line ends in
//     mate). A trade, a pawn fork that wins the piece back a move later, a
//     pawn grab or a pure exchange sacrifice (rook for minor) is NOT enough.
//  2. the sacrifice is a CHOICE: if the piece would have been lost anyway (it was
//     already hanging / trapped) the best alternative line loses it too, so the
//     "sacrifice" is subtracted and nothing is left.
//  3. the move is the best or nearly best at deep depth (loss <= maxLoss).
//  4. the position afterwards is not bad (winAfter >= minWinAfter).
//  5. the best ALTERNATIVE is not already completely winning (winAlt <= maxWinAlt).
//  6. it is not a recapture, a king move, a checkmating move or the only legal move.
//
// Notes:
//  - A sacrifice usually does not move the eval when it is played; its value
//    shows only after the opponent's best reply, so the verification always
//    runs at a deeper depth than the normal review (see checkBrilliant in main.js).
//  - If the opponent is practically forced (best reply far better than the
//    second best), thresholds are relaxed a little ("forced" mode).
// All thresholds live here so they are easy to tune.
// ---------------------------------------------------------------------------
export const BRILLIANT_CFG = {
  maxLoss: 7, // max win% lost versus the engine's best line
  maxLossForced: 10, // same, when the opponent is practically forced
  minWinAfter: 35, // must not be in a bad position afterwards (win%)
  minWinAfterForced: 28,
  maxWinAlt: 96, // best alternative must not already be completely winning (~ +540 cp)
  minSacrifice: 1, // net material points given up by the move itself (piece for 2 pawns = 1)
  minPieceValue: 3, // the piece given away must be at least a minor piece
  minSustained: 2, // a sacrifice that is regained later must stay down for this many opponent replies (1 = a plain trade)
  forcedGap: 15, // win% gap between the opponent's best and second best reply
  pvPlies: 14, // how far along the engine line the sacrifice is measured
  mateCp: 2900, // cp at or above this = the engine sees a forced mate
  candidateMinWinAfter: 4, // shallow pre-filter: skip moves that are plainly losing even with compensation
  maxChecks: 24, // deep verifications per game (best candidates first)
  allowExchangeSac: true, // rook for a minor piece counts (chess.com marks these brilliant)
  minOfferedNet: 1, // a piece (>= 3 points) put en prise that nets the opponent at least this much
};

// chess.com: "we are also more generous in defining a piece sacrifice for newer
// players". The thresholds therefore depend on the mover's rating (PGN WhiteElo /
// BlackElo). Unknown rating = the base values above.
export function brilliantConfigFor(rating) {
  const base = BRILLIANT_CFG;
  const r = Number(rating);
  if (!Number.isFinite(r) || r <= 0) return base;
  if (r < 1000) {
    return {
      ...base,
      maxLoss: base.maxLoss + 2,
      maxLossForced: base.maxLossForced + 2,
      minWinAfter: base.minWinAfter - 4,
      minWinAfterForced: base.minWinAfterForced - 4,
      maxWinAlt: 98,
      allowExchangeSac: true, // rook for a minor piece may count
    };
  }
  if (r < 1600) {
    return {
      ...base,
      maxLoss: base.maxLoss + 1,
      maxLossForced: base.maxLossForced + 1,
      maxWinAlt: 97,
    };
  }
  // 1600+: the base values. Higher rated players are NOT judged more strictly:
  // chess.com only says it is more generous for newer players.
  return base;
}

function uciToMove(u) {
  return {
    from: u.slice(0, 2),
    to: u.slice(2, 4),
    promotion: u.length > 4 ? u[4] : undefined,
  };
}

function isCaptureUci(g, u) {
  return !!g.get(u.slice(2, 4));
}

// Replays an engine line (first move = the mover's move) and describes the
// sacrifice. Only "settled" moments count: right after an opponent move, when
// the mover's next move is not a capture (so a pending exchange is not mistaken
// for a sacrifice). Returns:
//   peak          deepest material deficit at a settled moment
//   final         deficit once the line ends and the last exchange is finished
//   sustained     number of settled moments with deficit >= minSacrifice
//   mate          the mover delivers checkmate inside the line
//   lostMax       value of the most valuable mover piece lost up to the peak
//   exchangeOnly  the deficit is just a rook given for a minor piece
export function sacrificeProfile(
  fenBefore,
  pv,
  color,
  maxPlies = BRILLIANT_CFG.pvPlies,
) {
  const out = {
    valid: false,
    peak: 0,
    final: 0,
    sustained: 0,
    mate: false,
    plies: 0,
    lostMax: 0,
    exchangeOnly: false,
    first: 0, // deficit at the FIRST settled moment = what the move itself gives up
    firstLost: 0, // most valuable mover piece lost by then
    firstCapture: false, // the move itself is a capture
    lostAny: 0, // most valuable mover piece lost anywhere in the line
  };
  let firstDone = false;
  let firstLostBag = {};
  let firstGainedBag = {};
  if (!pv || !pv.length) return out;

  let g;
  try {
    g = new Chess(fenBefore);
  } catch {
    return out;
  }

  const min = BRILLIANT_CFG.minSacrifice;
  const start = materialDiff(g, color);
  const list = pv.slice(0, maxPlies);
  const lost = {};
  const gained = {};
  let peakLost = {};
  let peakGained = {};
  let played = 0;
  let last = null;

  for (let k = 0; k < list.length; k++) {
    let mv = null;
    try {
      mv = g.move(uciToMove(list[k]));
    } catch {
      mv = null;
    }
    if (!mv) break;
    played++;
    last = mv;
    if (k === 0) out.firstCapture = !!mv.captured;

    if (mv.captured) {
      const bag = mv.color === color ? gained : lost;
      bag[mv.captured] = (bag[mv.captured] || 0) + 1;
    }

    if (k % 2 === 1) {
      const next = list[k + 1];
      if (!(next && isCaptureUci(g, next))) {
        const deficit = start - materialDiff(g, color);
        if (!firstDone) {
          // Only the first settled moment is attributed to THIS move. Deficits
          // that appear later come from the mover's own following moves.
          firstDone = true;
          out.first = Math.max(0, deficit);
          firstLostBag = { ...lost };
          firstGainedBag = { ...gained };
        }
        if (deficit >= min) out.sustained++;
        if (deficit > out.peak) {
          out.peak = deficit;
          peakLost = { ...lost };
          peakGained = { ...gained };
        }
      }
    }
  }
  if (!played) return out;

  out.valid = true;
  out.plies = played;
  out.mate = g.isCheckmate() && last.color === color;

  // Finish a capture chain the line was cut in the middle of
  let finalDiff = materialDiff(g, color);
  if (last && last.captured) {
    const gain = quiesceGain(g, last.to, 4);
    finalDiff += (g.turn() === color ? 1 : -1) * gain;
  }
  out.final = start - finalDiff;

  out.lostMax = Math.max(0, ...Object.keys(peakLost).map((t) => PIECE_VAL[t]));
  out.lostAny = Math.max(0, ...Object.keys(lost).map((t) => PIECE_VAL[t]));
  out.firstLost = Math.max(
    0,
    ...Object.keys(firstLostBag).map((t) => PIECE_VAL[t]),
  );
  const lostKeys = Object.keys(firstLostBag);
  const gainedKeys = Object.keys(firstGainedBag);
  // Rook given for a minor piece (plus maybe a pawn): just an exchange.
  out.exchangeOnly =
    out.first <= 2 &&
    lostKeys.length === 1 &&
    lostKeys[0] === "r" &&
    firstLostBag.r === 1 &&
    ((firstGainedBag.n || 0) + (firstGainedBag.b || 0) >= 1 ||
      (firstGainedBag.r || 0) >= 1);

  return out;
}

// Is that profile a real, lasting piece sacrifice? `alt` = profile of the best
// alternative move: material the mover would lose anyway is not a sacrifice.
export function judgeSacrifice(
  profile,
  alt = null,
  { matingEval = false, cfg = BRILLIANT_CFG } = {},
) {
  const c = cfg;
  if (!profile || !profile.valid) {
    return { ok: false, reason: "no-line", size: 0 };
  }
  const mate = profile.mate || matingEval;
  const altCost = alt && alt.valid && !alt.mate ? Math.max(0, alt.final) : 0;
  // What the move itself gives up (first settled moment), minus what would have
  // been lost anyway.
  const size = profile.first - altCost;
  const realPiece =
    profile.firstLost >= c.minPieceValue &&
    (!profile.exchangeOnly || mate || !!c.allowExchangeSac);
  const persistent =
    (mate && profile.lostAny >= c.minPieceValue) ||
    profile.final - altCost >= c.minSacrifice ||
    profile.sustained >= c.minSustained;
  const longEnough = profile.plies >= 3;

  let reason = "ok";
  if (size < c.minSacrifice) reason = "no-sacrifice";
  else if (!realPiece) reason = "not-a-piece";
  else if (!persistent) reason = "regained";
  else if (!longEnough) reason = "line-too-short";

  return {
    ok: reason === "ok",
    reason,
    size,
    mate,
    altCost,
    realPiece,
    persistent,
  };
}

// Pure decision function (no chess logic besides the sacrifice profile).
// With `profile` the sacrifice is judged properly (persistence, alternative,
// piece value). Without it only the plain `sacrifice` number is used (legacy).
// allowNullAlt: true when the caller could not obtain an alternative line.
export function brilliantVerdict({
  loss,
  winAfter,
  winAlt,
  sacrifice = 0,
  oppGap = 0,
  moverPiece = "p",
  allowNullAlt = false,
  profile = null,
  altProfile = null,
  matingEval = false,
  cfg = BRILLIANT_CFG,
}) {
  const c = cfg;
  const forced = oppGap >= c.forcedGap;
  const okLoss = loss <= (forced ? c.maxLossForced : c.maxLoss);
  const okAfter = winAfter >= (forced ? c.minWinAfterForced : c.minWinAfter);
  const okAlt = winAlt === null ? allowNullAlt : winAlt <= c.maxWinAlt;
  let sac = profile
    ? judgeSacrifice(profile, altProfile, { matingEval, cfg: c })
    : { ok: sacrifice >= c.minSacrifice, size: sacrifice, reason: "legacy" };
  // Rook for a minor piece is only a brilliant when it is a quiet, deliberate
  // offer in a position that is not already clearly winning. A capture that
  // simply swaps rook for bishop/knight (Rxf5 exf5) or any exchange when the
  // game is already won is just a trade.
  if (
    sac.ok &&
    profile &&
    profile.exchangeOnly &&
    !(sac.mate || matingEval) &&
    (profile.firstCapture || (winAlt !== null && winAlt > 80))
  ) {
    sac = { ...sac, ok: false, reason: "exchange-sac" };
  }
  const okPiece = moverPiece !== "k";
  return {
    brilliant: okLoss && okAfter && okAlt && sac.ok && okPiece,
    forced,
    okLoss,
    okAfter,
    okAlt,
    okSac: sac.ok,
    sac,
  };
}

// Walks an engine line and reports the mover's deepest material deficit at a
// "quiet" moment (kept for compatibility; sacrificeProfile is the stricter version).
export function pvSacrifice(fenBefore, pv, color, maxPlies = 8) {
  const p = sacrificeProfile(fenBefore, pv, color, maxPlies);
  return { worst: p.peak, last: p.final };
}

// Cheap pre-filter: after the move, can the opponent win a piece (>= 3 points)
// with a capture that nets >= 2 points of material (1-ply exchange check)?
export function leavesPieceEnPrise(fenBefore, uci) {
  const g = new Chess(fenBefore);
  try {
    if (!g.move(uciToMove(uci))) return false;
  } catch {
    return false;
  }
  for (const opp of g.moves({ verbose: true })) {
    if (!opp.captured) continue;
    const victim = PIECE_VAL[opp.captured];
    if (victim < 3) continue;
    const g2 = new Chess(g.fen());
    g2.move({ from: opp.from, to: opp.to, promotion: opp.promotion });
    const recapture = g2
      .moves({ verbose: true })
      .some((x) => x.to === opp.to && x.captured);
    const net = victim - (recapture ? PIECE_VAL[opp.piece] : 0);
    if (net >= 1) return true;
  }
  return false;
}

// Full brilliant assessment from engine results. No engine calls and no DOM,
// so it can be unit tested; main.js feeds it the (deep) evaluations.
//   before = engine result for the position BEFORE the move
//            { cp, best, second, lines: { 1: {cp, pv}, 2: {cp, pv}, ... } }
//   after  = engine result for the position AFTER the move { cp, pv, second }
//   mv     = { uci, san, color, piece }
// Returns { brilliant, info } (info explains every rule, for logging/tuning).
export function assessBrilliant({
  fenBefore,
  mv,
  before,
  after,
  isRecapture = false,
  rating = null, // mover's rating (PGN header) – lower rated players get more leeway
}) {
  const c = brilliantConfigFor(rating);
  const sign = mv.color === "w" ? 1 : -1;
  const info = { san: mv.san, brilliant: false, reason: "" };
  const no = (reason) => ({ brilliant: false, info: { ...info, reason } });

  if (isRecapture) return no("recapture");
  if (mv.piece === "k") return no("king-move");
  if ((mv.san || "").includes("#")) return no("gives-mate");

  try {
    if (new Chess(fenBefore).moves().length < 2) return no("only-legal-move");
  } catch {
    return no("bad-fen");
  }
  if (!before || !after) return no("no-eval");

  const lines = before.lines || {};
  const ranked = Object.keys(lines)
    .map(Number)
    .sort((a, b) => a - b)
    .map((k) => lines[k])
    .filter((l) => l && l.pv && l.pv.length);
  const playedLine = ranked.find((l) => l.pv[0] === mv.uci);
  const altLine = ranked.find((l) => l.pv[0] !== mv.uci);

  const playedCp = playedLine ? playedLine.cp : after.cp;
  const pv = playedLine ? playedLine.pv : [mv.uci, ...(after.pv || [])];
  let altCp = altLine ? altLine.cp : null;
  if (altCp === null && before.best && before.best !== mv.uci)
    altCp = before.cp;

  const winBest = winPercent(sign * before.cp);
  const winPlayed = winPercent(sign * playedCp);
  const winAlt = altCp === null ? null : winPercent(sign * altCp);
  const loss = Math.max(0, winBest - winPlayed);

  let oppGap = 0;
  if (after.second != null) {
    oppGap = winPercent(-sign * after.cp) - winPercent(-sign * after.second);
  }

  const profile = sacrificeProfile(fenBefore, pv, mv.color);
  const altProfile = altLine
    ? sacrificeProfile(fenBefore, altLine.pv, mv.color)
    : null;
  const matingEval = sign * playedCp >= c.mateCp;

  // The alternative line's material loss only counts when a piece was ALREADY
  // under threat before the move (then it would have been lost anyway). Otherwise
  // the alternative merely loses material differently (e.g. another sacrifice),
  // which must not cancel this one.
  const off = offeredSacrifice(fenBefore, mv.uci);
  const useAlt = off.threat >= c.minPieceValue ? altProfile : null;

  const verdict = brilliantVerdict({
    loss,
    winAfter: winPlayed,
    winAlt,
    oppGap,
    moverPiece: mv.piece,
    allowNullAlt: true,
    profile,
    altProfile: useAlt,
    matingEval,
    cfg: c,
  });

  // Without a known alternative the "already winning" test falls back to the best eval

  // Alternatif hamle biliniyorsa onu, bilinmiyorsa mevcut pozisyonun
  // değerlendirmesini kullan. Zaten tamamen kazanılmış pozisyonda
  // Brilliant rozeti verme.
  const okBest =
    winAlt !== null ? winAlt <= c.maxWinAlt : winBest <= c.maxWinAlt;

  // Brilliant için gerçek ve kalıcı taş fedası şart.
  // Sadece bir taşın tehdit altında olması artık tek başına yeterli değil.
  // A piece (>= 3 points) put on a square where the opponent could win it with
  // a net gain (knight lands on f2 next to the king, etc.) is a real offer even
  // when the engine line declines it: the opponent's refusal is the point.
  // It still has to be (nearly) the best move, leave a good position and not
  // come from an already-winning one. A piece that was already attacked before
  // the move does not count (it would have been lost anyway).
  const viaOffer =
    !verdict.okSac &&
    off.victim >= c.minPieceValue &&
    off.net >= c.minOfferedNet &&
    off.threat < c.minPieceValue &&
    verdict.okLoss &&
    verdict.okAfter &&
    verdict.okAlt &&
    okBest &&
    winPlayed >= c.minWinAfter + 10;
  const brilliant = (verdict.brilliant && okBest) || viaOffer;

  const f = (n) => (n === null ? null : +n.toFixed(1));
  return {
    brilliant,
    info: {
      san: mv.san,
      brilliant,
      viaOffer,
      offered: off.net,
      reason: brilliant
        ? viaOffer
          ? "offer"
          : "ok"
        : !verdict.okSac
          ? verdict.sac.reason
          : !verdict.okLoss
            ? "loss"
            : !verdict.okAfter
              ? "bad-position"
              : !verdict.okAlt
                ? "already-winning"
                : !okBest
                  ? "already-winning"
                  : "rejected",
      loss: f(loss),
      winPlayed: f(winPlayed),
      winAlt: f(winAlt),
      oppGap: f(oppGap),
      forced: verdict.forced,
      sacrifice: verdict.sac.size,
      peak: profile.peak,
      first: profile.first,
      firstLost: profile.firstLost,
      final: profile.final,
      sustained: profile.sustained,
      mate: profile.mate || matingEval,
      altCost: verdict.sac.altCost ?? 0,
      rating: rating || null,
    },
  };
}

// Classification (win-percentage loss thresholds):
//   brilliant (!!)  : good move + a real, lasting piece sacrifice (see above)
//   excellent (!)   : hard-to-find move (only good move) or a pawn sacrifice – never a piece sacrifice
//   best            : the engine's best move or a loss <= 2
//   good <= 5 · inaccuracy <= 10 · mistake <= 20 · blunder > 20
//
// IMPORTANT: at review depth this function can only suggest a brilliant move
// (shallow evals are not trustworthy for sacrifices). main.js therefore calls it
// with allowBrilliant:false and awards "brilliant" only after the deep check
// (assessBrilliant). The brilliant branch is kept for direct callers and tests.
export function classifyMove({
  uci,
  best,
  loss,
  winBefore,
  winAfter,
  winAlt, // value of the best alternative to the played move (null = only legal/forced move)
  gap,
  isRecapture,
  sacrificeSwing,
  hangSwing = 0,
  persist = 0, // material still missing at the end of the engine line (look-ahead)
  oppGap = 0, // how forced the opponent's reply is (win% gap best vs second best reply)
  moverPiece,
  cpBefore,
  cpAfter,
  profile = null, // sacrificeProfile of the played line
  altProfile = null, // sacrificeProfile of the best alternative
  matingEval = false,
  givesMate = false,
  allowBrilliant = true,
}) {
  const playedBest = uci === best;

  if (
    allowBrilliant &&
    !givesMate &&
    winAlt !== null &&
    !isRecapture &&
    brilliantVerdict({
      loss,
      winAfter,
      winAlt,
      // legacy callers (no profile): a sacrifice only counts if it persists
      sacrifice: persist >= BRILLIANT_CFG.minSacrifice ? -sacrificeSwing : 0,
      oppGap,
      moverPiece,
      profile,
      altProfile,
      matingEval,
    }).brilliant
  ) {
    return "brilliant";
  }

  // Excellent (!): a hard-to-find move. Either the only good move (alternatives are clearly worse)
  // or a small sacrifice (usually a pawn). Not as big as a Brilliant (!!).
  // A sacrifice of a piece worth more than a pawn (>= 2 points down) belongs to
  // Brilliant only. If the deep check rejected it, it must not fall back to
  // Excellent: Excellent = pawn sacrifice or a hard-to-find move WITHOUT a sacrifice.
  const nearBest = loss <= 1;
  const pieceSacrifice = sacrificeSwing <= -2;
  const onlyMove =
    winAlt !== null && gap >= 12 && !isRecapture && !pieceSacrifice;
  const smallSacrifice =
    moverPiece !== "k" &&
    winAlt !== null &&
    sacrificeSwing <= -1 &&
    !pieceSacrifice &&
    winAlt < 97 &&
    winAfter >= 45;

  if (nearBest && (onlyMove || smallSacrifice)) {
    return "excellent";
  }

  // Best: the engine's best move or practically equal to it (loss < 0.5).
  // Good: a reasonable option, but there were better moves.
  if (playedBest || loss < 0.5) return "best";
  if (loss <= 5) return "good";
  if (loss <= 10) return "inaccuracy";

  // Blunder: giving away a free piece, missing a mate, allowing mate or completely turning the game.
  // Other large mistakes stay "mistake".
  const missedMate = cpBefore >= 3000 && cpAfter < 3000;
  const allowsMate = cpAfter <= -3000 && cpBefore > -3000;
  const hangsPiece = hangSwing <= -3 || sacrificeSwing <= -3; // at least one piece lost in the engine line
  const flipsGame = loss > 20 && winBefore >= 40 && winAfter <= 25;

  if (allowsMate || missedMate || hangsPiece || flipsGame || loss >= 35) {
    return "blunder";
  }
  return "mistake";
}
