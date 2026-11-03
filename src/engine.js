const stockfish = new Worker(
  new URL("../assets/stockfish/stockfish-19-lite-single.js", import.meta.url),
);

let engineReady = false;
let latestFen = null;
let analysisListener = null;

const analysisLines = new Map();

stockfish.onmessage = (event) => {
  const message = String(event.data);

  if (message === "uciok") {
    stockfish.postMessage("setoption name MultiPV value 3");
    stockfish.postMessage("isready");
    return;
  }

  if (message === "readyok") {
    engineReady = true;
    console.log("Stockfish is ready!");

    if (latestFen) {
      analyzePosition(latestFen);
    }
    return;
  }

  if (message.startsWith("info ")) {
    const depth = Number(message.match(/\bdepth (\d+)/)?.[1] || 0);
    const multipv = Number(message.match(/\bmultipv (\d+)/)?.[1] || 1);
    const cp = message.match(/\bscore cp (-?\d+)/);
    const mate = message.match(/\bscore mate (-?\d+)/);
    const pv = message.match(/\bpv (.+)$/);

    if (!pv) return;

    analysisLines.set(multipv, {
      multipv,
      depth,
      scoreType: mate ? "mate" : "cp",
      score: mate ? Number(mate[1]) : cp ? Number(cp[1]) : 0,
      pv: pv[1].trim().split(/\s+/),
    });

    if (analysisListener) {
      analysisListener(
        [...analysisLines.values()].sort((a, b) => a.multipv - b.multipv),
      );
    }
  }

  if (message.startsWith("bestmove")) {
    console.log("Stockfish:", message);
  }
};

stockfish.postMessage("uci");

export function setAnalysisListener(callback) {
  analysisListener = callback;
}

export function analyzePosition(fen, depth = 15) {
  latestFen = fen;
  if (!engineReady) return;

  analysisLines.clear();

  if (analysisListener) {
    analysisListener([]);
  }

  stockfish.postMessage("stop");
  stockfish.postMessage("position fen " + fen);
  stockfish.postMessage("go depth " + depth);
}

export function stopAnalysis() {
  stockfish.postMessage("stop");
}
