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

export class BotEngine {
  constructor(path = "./assets/stockfish/stockfish-19-lite-single.js") {
    this.path = path;
    this.worker = null;
    this.ready = null;
    this.listener = null;
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

  // Zorluğa göre bir hamle seçer. Döner: UCI hamlesi ("e2e4", "e7e8q")
  async pickMove(fen, legal, elo) {
    await this.init();
    if (!legal.length) return null;
    if (legal.length === 1) return legal[0];

    const weak = elo < MIN_UCI_ELO;
    const full = elo >= MAX_UCI_ELO;

    this._send("ucinewgame");
    this._send(`setoption name UCI_LimitStrength value ${!weak && !full}`);
    if (!weak && !full) this._send(`setoption name UCI_Elo value ${elo}`);
    this._send(`setoption name Skill Level value ${weak ? 0 : 20}`);
    this._send(`setoption name MultiPV value ${weak ? 6 : 1}`);
    this._send(`position fen ${fen}`);

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
        this._send(
          `go movetime ${elo >= 2500 ? 1500 : elo >= 1800 ? 900 : 500}`,
        );
      }
    });
  }
}
