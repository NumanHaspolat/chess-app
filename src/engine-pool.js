// Stockfish işçi havuzu: oyun analizinde birden fazla pozisyonu paralel değerlendirir.
// Her işçi MultiPV 2 ile çalışır. Sonuç biçimi: { cp, second, best, lines, pv } (cp beyaz bakışı).

const WORKER_PATH = "./assets/stockfish/stockfish-19-lite-single.js";

function parseInfo(msg, whiteToMove, lines) {
  if (!msg.startsWith("info ") || /\b(lowerbound|upperbound)\b/.test(msg))
    return;
  const rank = Number(msg.match(/\bmultipv (\d+)/)?.[1] ?? 1);
  const cp = msg.match(/\bscore cp (-?\d+)/);
  const mate = msg.match(/\bscore mate (-?\d+)/);
  const pvMatch = msg.match(/\bpv (.+)$/);
  let value = null;
  if (cp) value = Number(cp[1]);
  else if (mate) value = Number(mate[1]) > 0 ? 3000 : -3000;
  if (value === null) return;
  lines[rank] = {
    cp: whiteToMove ? value : -value,
    pv: pvMatch ? pvMatch[1].trim().split(/\s+/).slice(0, 10) : [],
  };
}

export function defaultPoolSize() {
  const cores = navigator.hardwareConcurrency || 2;
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  return Math.max(1, Math.min(mobile ? 2 : 4, cores - 1));
}

export class EnginePool {
  constructor(size = defaultPoolSize()) {
    this.size = size;
    this.slots = []; // { worker, ready: Promise, busy, current }
    this.queue = []; // { fen, depth, isCancelled, resolve }
  }

  _createSlot() {
    const worker = new Worker(WORKER_PATH);
    const slot = { worker, busy: false, current: null };
    slot.ready = new Promise((resolve, reject) => {
      worker.onerror = reject;
      const onMsg = (event) => {
        const msg = String(event.data).trim();
        if (msg === "uciok") {
          worker.postMessage("setoption name MultiPV value 2");
          worker.postMessage("setoption name Hash value 16");
          worker.postMessage("isready");
        } else if (msg === "readyok") {
          worker.removeEventListener("message", onMsg);
          resolve();
        }
      };
      worker.addEventListener("message", onMsg);
      worker.postMessage("uci");
    });
    this.slots.push(slot);
    return slot;
  }

  // Pozisyonu değerlendir. isCancelled() true dönerse iş atlanır ve null döner.
  evaluate(fen, depth, isCancelled = () => false) {
    return new Promise((resolve) => {
      this.queue.push({ fen, depth, isCancelled, resolve });
      this._pump();
    });
  }

  _pump() {
    while (this.queue.length) {
      let slot = this.slots.find((s) => !s.busy);
      if (!slot && this.slots.length < this.size) slot = this._createSlot();
      if (!slot) return;

      const job = this.queue.shift();
      if (job.isCancelled()) {
        job.resolve(null);
        continue;
      }
      this._run(slot, job);
    }
  }

  async _run(slot, job) {
    slot.busy = true;
    slot.current = job;
    try {
      await slot.ready;
    } catch {
      slot.busy = false;
      job.resolve(null);
      this._pump();
      return;
    }

    const { worker } = slot;
    const whiteToMove = job.fen.split(" ")[1] === "w";
    const lines = {};

    const onMsg = (event) => {
      const msg = String(event.data).trim();
      if (msg.startsWith("info ")) {
        parseInfo(msg, whiteToMove, lines);
      } else if (msg.startsWith("bestmove")) {
        worker.removeEventListener("message", onMsg);
        slot.busy = false;
        slot.current = null;
        const best = msg.split(" ")[1];
        job.resolve(
          job.isCancelled()
            ? null
            : {
                cp: lines[1]?.cp ?? 0,
                second: lines[2]?.cp ?? null,
                best: best && best !== "(none)" ? best : null,
                lines,
                pv: lines[1]?.pv ?? [],
              },
        );
        this._pump();
      }
    };

    worker.addEventListener("message", onMsg);
    worker.postMessage(`position fen ${job.fen}`);
    worker.postMessage(`go depth ${job.depth}`);
  }

  // Bekleyen işleri iptal eder ve çalışanları durdurur
  cancelAll() {
    for (const job of this.queue) job.resolve(null);
    this.queue = [];
    for (const slot of this.slots) {
      if (slot.busy) slot.worker.postMessage("stop");
    }
  }
}
