// Account / profile report: pure statistics + advice (no DOM, no engine).
// main.js collects the games and (optionally) the engine's per-move losses and
// feeds them here.

// "Sicilian Defense: Smith-Morra Gambit" or a chess.com ECOUrl slug
// ("Sicilian-Defense-Smith-Morra-Gambit-Accepted...") -> "Sicilian Defense".
export function openingFamily(pgn) {
  const text = String(pgn || "");
  let name = (text.match(/\[Opening "([^"]+)"\]/) || [])[1];
  if (!name) {
    const url = (text.match(/\[ECOUrl "([^"]+)"\]/) || [])[1];
    if (url) name = decodeURIComponent(url.split("/").pop()).replace(/-/g, " ");
  }
  if (!name) return "Unknown";
  name = name.split(":")[0].replace(/\s+/g, " ").trim();
  const m = name.match(
    /^(.*?\b(?:Defense|Defence|Opening|Game|Gambit|Attack|System|Countergambit))\b/i,
  );
  const fam = (m ? m[1] : name.split(" ").slice(0, 3).join(" ")).trim();
  return fam || "Unknown";
}

export function phaseOf(fullmove, nonPawnMaterial) {
  if (fullmove <= 10) return "opening";
  if (nonPawnMaterial <= 16) return "endgame";
  return "middlegame";
}

const pct = (n, d) => (d ? Math.round((n / d) * 100) : null);
const score = (r) => (r.w + r.d * 0.5) / Math.max(1, r.w + r.d + r.l);

function tally() {
  return { w: 0, d: 0, l: 0 };
}
function add(t, result) {
  if (result === "Win") t.w++;
  else if (result === "Loss") t.l++;
  else t.d++;
}

// items: [{result, orientation, speed, reason, pgn}]
export function summarizeResults(items) {
  const all = tally();
  const byColor = { w: tally(), b: tally() };
  const bySpeed = {};
  const openings = { w: {}, b: {} };
  const ends = { timeLoss: 0, resignLoss: 0, mateLoss: 0, losses: 0 };

  for (const it of items) {
    const res = it.result || "Draw";
    const c = it.orientation === "b" ? "b" : "w";
    add(all, res);
    add(byColor[c], res);
    const sp = it.speed || "game";
    bySpeed[sp] = bySpeed[sp] || tally();
    add(bySpeed[sp], res);
    const fam = openingFamily(it.pgn);
    openings[c][fam] = openings[c][fam] || tally();
    add(openings[c][fam], res);
    if (res === "Loss") {
      ends.losses++;
      const r = String(it.reason || "").toLowerCase();
      if (/time/.test(r)) ends.timeLoss++;
      else if (/resign/.test(r)) ends.resignLoss++;
      else if (/mate/.test(r)) ends.mateLoss++;
    }
  }

  const list = (map) =>
    Object.entries(map)
      .map(([name, t]) => ({ name, ...t, games: t.w + t.d + t.l, score: score(t) }))
      .sort((a, b) => b.games - a.games);

  return {
    games: items.length,
    all,
    byColor,
    bySpeed: list(bySpeed),
    openings: { w: list(openings.w), b: list(openings.b) },
    ends,
  };
}

// games: [{ plies: [{ phase, loss, cls }] }] – only the player's own moves.
// loss = win% lost by that move. cls = classification string.
export function summarizeMoves(games) {
  const phases = {};
  for (const p of ["opening", "middlegame", "endgame"]) {
    phases[p] = { moves: 0, loss: 0, inacc: 0, mistake: 0, blunder: 0, games: 0 };
  }
  for (const g of games) {
    const seen = new Set();
    for (const m of g.plies) {
      const ph = phases[m.phase];
      if (!ph) continue;
      ph.moves++;
      ph.loss += m.loss;
      if (m.cls === "inaccuracy") ph.inacc++;
      else if (m.cls === "mistake") ph.mistake++;
      else if (m.cls === "blunder") ph.blunder++;
      if (!seen.has(m.phase)) {
        seen.add(m.phase);
        ph.games++;
      }
    }
  }
  for (const ph of Object.values(phases)) {
    ph.avgLoss = ph.moves ? ph.loss / ph.moves : 0;
    ph.bigPerGame = ph.games ? (ph.mistake + ph.blunder) / ph.games : 0;
  }
  return { games: games.length, phases };
}

const PHASE_TIPS = {
  opening:
    "Your opening is where you lose the most. Build a small repertoire and drill it in the Repertoire page; learn the ideas, not only the moves.",
  middlegame:
    "Middlegames cost you the most. Solve tactics puzzles daily (mixed themes) and check each move for forks, pins and hanging pieces before you play it.",
  endgame:
    "Endgames are your weak spot. Practise basic endings (king and pawn, rook endings) and try to convert won positions without hurry.",
};

// Builds the advice list. res = summarizeResults, mv = summarizeMoves | null.
export function buildAdvice(res, mv) {
  const tips = [];
  if (!res || !res.games) return tips;

  const { all, byColor, ends, openings } = res;
  const total = all.w + all.d + all.l;

  if (mv && mv.games >= 3) {
    const rank = Object.entries(mv.phases)
      .filter(([, p]) => p.moves >= 15)
      .sort((a, b) => b[1].avgLoss - a[1].avgLoss);
    if (rank.length) {
      const [name, p] = rank[0];
      const second = rank[1] ? rank[1][1].avgLoss : 0;
      if (p.avgLoss >= 3 && p.avgLoss > second * 1.2) {
        tips.push({ kind: "phase", text: PHASE_TIPS[name], focus: name });
      }
    }
    const big = Object.values(mv.phases).reduce(
      (s, p) => s + p.mistake + p.blunder,
      0,
    );
    if (big / mv.games >= 2) {
      tips.push({
        kind: "puzzles",
        text: `You make about ${(big / mv.games).toFixed(1)} mistakes or blunders per game. Solve puzzles every day and slow down for a quick safety check (what does my opponent threaten?) before each move.`,
      });
    }
  }

  const cw = byColor.w.w + byColor.w.d + byColor.w.l;
  const cb = byColor.b.w + byColor.b.d + byColor.b.l;
  if (cw >= 4 && cb >= 4) {
    const sw = score(byColor.w);
    const sb = score(byColor.b);
    if (Math.abs(sw - sb) >= 0.2) {
      const weak = sw < sb ? "White" : "Black";
      tips.push({
        kind: "color",
        text: `You score much worse with ${weak} (${Math.round(Math.min(sw, sb) * 100)}% vs ${Math.round(Math.max(sw, sb) * 100)}%). Spend repertoire time on your ${weak} openings.`,
      });
    }
  }

  for (const color of ["w", "b"]) {
    const worst = openings[color]
      .filter((o) => o.games >= 3 && o.score <= 0.35)
      .sort((a, b) => a.score - b.score)[0];
    if (worst) {
      tips.push({
        kind: "opening",
        text: `As ${color === "w" ? "White" : "Black"} the ${worst.name} gives you only ${Math.round(worst.score * 100)}% in ${worst.games} games. Review those games and add a prepared line to your repertoire.`,
      });
    }
  }

  if (ends.losses >= 3 && ends.timeLoss / ends.losses >= 0.3) {
    tips.push({
      kind: "time",
      text: `${pct(ends.timeLoss, ends.losses)}% of your losses are on time. Play a bit faster in the opening (use your repertoire) and keep a minimum of time for the endgame, or try a longer time control.`,
    });
  }
  if (ends.losses >= 3 && ends.mateLoss / ends.losses >= 0.4) {
    tips.push({
      kind: "safety",
      text: "Many of your losses end in checkmate. Practise mate-in-1/2 puzzles and keep your king safe: castle early and watch open lines near it.",
    });
  }

  if (total >= 8 && all.w / total >= 0.65 && !tips.length) {
    tips.push({
      kind: "good",
      text: "Strong results! Keep your routine and challenge yourself with harder puzzles and stronger opponents.",
    });
  }
  if (!tips.length) {
    tips.push({
      kind: "general",
      text: "No clear weakness stands out yet. Analyse more games (run the engine part on 20 games) for a sharper report.",
    });
  }
  return tips;
}