// Stockfish'e karşı oynama: kendi worker'ı olan ayrı bir motor.
//  - 1320+ Elo: motorun kendi UCI_LimitStrength / UCI_Elo ayarı
//  - 1320 altı: motor zayıf ayarlanamaz, bu yüzden en iyi birkaç hamle arasından
//    sıcaklıklı rastgele seçim + belirli olasılıkla rastgele (gaf) hamle yapılır.

export const BOT_LEVELS = [
  { elo: 100, label: "100 · Absolute beginner" },
  { elo: 400, label: "400 · Beginner" },
  { elo: 700, label: "700 · Casual" },
  { elo: 1000, label: "1000 · Club newcomer" },
  { elo: 1320, label: "1320 · Improving" },
  { elo: 1500, label: "1500 · Intermediate" },
  { elo: 1800, label: "1800 · Strong club player" },
  { elo: 2000, label: "2000 · Expert" },
  { elo: 2200, label: "2200 · Candidate master" },
  { elo: 2500, label: "2500 · Master" },
  { elo: 2800, label: "2800 · Super GM" },
  { elo: 3190, label: "Max · Full strength" },
];

const MIN_UCI_ELO = 1320;
const MAX_UCI_ELO = 3190;

// Stockfish's UCI_Elo is calibrated for long time controls on native builds.
// The lite single-threaded WASM build with a short movetime searches far
// shallower, so the same UCI_Elo plays noticeably weaker (e.g. 2200 felt
// like 1800). We compensate in two ways:
//  1. add an Elo boost on top of the requested level (table below),
//  2. give the engine more thinking time at higher levels.
// Tune these two tables if a level still feels too weak or too strong.
const ELO_BOOST = [
  // [requested elo, extra elo sent to the engine]
  [1320, 0],
  [1500, 120],
  [1800, 280],
  [2000, 350],
  [2200, 420],
  [2500, 380],
  [2800, 250],
];

// Linear interpolation over ELO_BOOST.
export function eloBoost(elo) {
  if (elo <= ELO_BOOST[0][0]) return ELO_BOOST[0][1];
  for (let i = 1; i < ELO_BOOST.length; i++) {
    const [e1, b1] = ELO_BOOST[i];
    const [e0, b0] = ELO_BOOST[i - 1];
    if (elo <= e1) return b0 + ((b1 - b0) * (elo - e0)) / (e1 - e0);
  }
  return ELO_BOOST[ELO_BOOST.length - 1][1];
}

// The Elo value that is actually sent to Stockfish (UCI_Elo).
export function effectiveUciElo(elo) {
  const boosted = Math.round(elo + eloBoost(elo));
  return Math.min(MAX_UCI_ELO, Math.max(MIN_UCI_ELO, boosted));
}

// Thinking time per move in milliseconds.
export function moveTimeFor(elo) {
  if (elo >= 2800) return 3000;
  if (elo >= 2500) return 2500;
  if (elo >= 2200) return 2000;
  if (elo >= 1800) return 1400;
  if (elo >= 1500) return 900;
  return 600;
}

// Düşük seviyeler için ayarlar (elo < 1320)
export function weakParams(elo) {
  const k = Math.min(1, Math.max(0, (MIN_UCI_ELO - elo) / (MIN_UCI_ELO - 100)));
  return {
    blunder: 0.04 + 0.5 * Math.pow(k, 1.2), // rastgele hamle olasılığı
    temperature: 60 + 340 * k, // cp; yüksek = daha dağınık seçim
    depth: k > 0.6 ? 1 : 2,
  };
}

// candidates: [{ uci, cp }] (cp = oynayan taraf açısından), legal: ["e2e4", ...]
export function chooseWeakMove(candidates, legal, elo, rng = Math.random) {
  const { blunder, temperature } = weakParams(elo);
  if (!candidates.length || rng() < blunder) {
    return legal[Math.floor(rng() * legal.length)];
  }
  const best = Math.max(...candidates.map((c) => c.cp));
  const weights = candidates.map((c) => Math.exp((c.cp - best) / temperature));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i].uci;
  }
  return candidates[0].uci;
}

// When may the search be cut short? Conservative on purpose so that the level
// does not drop: the best move must be stable for several consecutive depths,
// a minimum depth must be reached and a minimum share of the time spent.
export function earlyStopPolicy(elo) {
  if (elo >= 2800) return { minDepth: 16, stableDepths: 6, minFraction: 0.55 };
  if (elo >= 2200) return { minDepth: 14, stableDepths: 5, minFraction: 0.5 };
  if (elo >= 1800) return { minDepth: 12, stableDepths: 4, minFraction: 0.45 };
  return { minDepth: 10, stableDepths: 4, minFraction: 0.4 };
}

export class BotEngine {
  constructor(path = "./assets/stockfish/stockfish-19-lite-single.js") {
    this.path = path;
    this.worker = null;
    this.ready = null;
    this.listener = null;
    this.opts = {}; // last value sent for each UCI option (avoid resending)
    this.lastFullmove = null; // used to detect a new game without call-site changes
  }

  // Load the engine ahead of time so the first bot move is not delayed.
  warmUp() {
    return this.init().catch(() => {});
  }

  // Only send a UCI option when its value actually changed.
  _setOpt(name, value) {
    const v = String(value);
    if (this.opts[name] === v) return;
    this.opts[name] = v;
    this._send(`setoption name ${name} value ${v}`);
  }

  init() {
    if (this.ready) return this.ready;
    this.ready = new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(this.path);
      } catch (e) {
        reject(e);
        return;
      }
      this.worker.onerror = (e) => reject(e);
      this.worker.onmessage = (event) => {
        const msg = String(event.data).trim();
        if (msg === "uciok") this.worker.postMessage("isready");
        else if (msg === "readyok" && !this.listener) resolve();
        else this.listener?.(msg);
      };
      this.worker.postMessage("uci");
    });
    return this.ready;
  }

  _send(cmd) {
    this.worker.postMessage(cmd);
  }

  stop() {
    if (this.worker) this._send("stop");
  }

  // Picks a move for the given difficulty. Returns a UCI move ("e2e4", "e7e8q").
  //
  // Speed without losing strength:
  //  - the engine stays warm (see warmUp) and the transposition table is kept
  //    between moves of the same game (ucinewgame only on a new game),
  //  - options are only sent when they change,
  //  - the search stops early once the best move has been stable for several
  //    depths (like Stockfish's own time management), instead of always
  //    burning the whole time budget. Hard or unstable positions still get the
  //    full movetime, so playing strength is preserved.
  async pickMove(fen, legal, elo) {
    await this.init();
    if (!legal.length) return null;
    if (legal.length === 1) return legal[0];

    const weak = elo < MIN_UCI_ELO;
    const full = elo >= MAX_UCI_ELO;

    // New game detection: the full-move counter went backwards (or first call).
    const fullmove = Number(fen.split(/\s+/)[5]) || 1;
    if (this.lastFullmove === null || fullmove < this.lastFullmove) {
      this._send("ucinewgame");
    }
    this.lastFullmove = fullmove;

    this._setOpt("UCI_LimitStrength", !weak && !full);
    if (!weak && !full) this._setOpt("UCI_Elo", effectiveUciElo(elo));
    this._setOpt("Skill Level", weak ? 0 : 20);
    this._setOpt("MultiPV", weak ? 6 : 1);
    this._send(`position fen ${fen}`);

    const budget = full ? 3000 : moveTimeFor(elo);
    const policy = earlyStopPolicy(elo);
    const startedAt = performance.now();
    let lastDepth = 0;
    let lastMove = null;
    let stableDepths = 0;
    let stopSent = false;

    const lines = new Map(); // multipv -> { uci, cp }
    return new Promise((resolve) => {
      this.listener = (msg) => {
        if (
          msg.startsWith("info ") &&
          / pv /.test(msg) &&
          !/\b(lowerbound|upperbound)\b/.test(msg)
        ) {
          const mpv = Number((msg.match(/\bmultipv (\d+)/) || [, 1])[1]);
          const cp = msg.match(/\bscore cp (-?\d+)/);
          const mate = msg.match(/\bscore mate (-?\d+)/);
          const pv = msg.match(/ pv (\S+)/);
          if (pv && (cp || mate)) {
            lines.set(mpv, {
              uci: pv[1],
              cp: cp
                ? Number(cp[1])
                : Math.sign(Number(mate[1])) *
                  (10000 - Math.abs(Number(mate[1]))),
            });
          }

          // Early stop (strong mode only): best move stable for N depths.
          if (!weak && mpv === 1 && pv && !stopSent) {
            const depth = Number((msg.match(/\bdepth (\d+)/) || [, 0])[1]);
            if (depth > lastDepth) {
              lastDepth = depth;
              if (pv[1] === lastMove) stableDepths++;
              else {
                lastMove = pv[1];
                stableDepths = 1;
              }
              const elapsed = performance.now() - startedAt;
              const isMate = !!mate; // never cut a forced-mate search short
              if (
                !isMate &&
                depth >= policy.minDepth &&
                stableDepths >= policy.stableDepths &&
                elapsed >= budget * policy.minFraction
              ) {
                stopSent = true;
                this._send("stop");
              }
            }
          }
          return;
        }
        if (msg.startsWith("bestmove")) {
          this.listener = null;
          const best = msg.split(/\s+/)[1];
          if (weak) {
            const cands = [...lines.values()].filter((c) =>
              legal.includes(c.uci),
            );
            resolve(chooseWeakMove(cands, legal, elo));
          } else {
            resolve(best && best !== "(none)" ? best : legal[0]);
          }
        }
      };
      if (weak) {
        this._send(`go depth ${weakParams(elo).depth}`);
      } else {
        this._send(`go movetime ${budget}`);
      }
    });
  }
}
