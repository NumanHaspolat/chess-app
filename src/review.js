// Analiz matematiği: kazanma yüzdesi, doğruluk, feda hesabı ve hamle sınıflandırması (DOM'a dokunmaz).
import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.0.0/+esm";

export const PIECE_VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

// Lichess/chess.com tarzı: centipawn -> kazanma yüzdesi (beklenen puan x 100)
export function winPercent(cp) {
  const c = Math.max(-1200, Math.min(1200, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * c)) - 1);
}

// Hamle doğruluğu: kazanma yüzdesi kaybına göre (Lichess formülü)
export function moveAccuracy(winLoss) {
  const acc =
    103.1668100711649 * Math.exp(-0.04354415386753951 * Math.max(0, winLoss)) -
    3.166924740191411 +
    1;
  return Math.max(0, Math.min(100, acc));
}

// Oyun doğruluğu: oynaklık ağırlıklı ortalama ile harmonik ortalamanın ortalaması
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

// Bir karedeki alış-veriş zincirinin, sırası gelen taraf için net kazancı (basit statik takas).
export function quiesceGain(chess, square, depth) {
  if (depth <= 0) return 0;

  const captures = chess
    .moves({ verbose: true })
    .filter((m) => m.to === square && m.captured);
  if (!captures.length) return 0;

  captures.sort((a, b) => PIECE_VAL[a.piece] - PIECE_VAL[b.piece]);

  let best = 0; // almamak serbest
  for (const m of captures.slice(0, 3)) {
    chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    const value = PIECE_VAL[m.captured] - quiesceGain(chess, square, depth - 1);
    chess.undo();
    best = Math.max(best, value);
  }
  return best;
}

// Motorun ana varyantını oynatıp, takaslar bitince hamle yapanın materyal farkını ölçer.
// Negatif sonuç = materyal feda edilmiş (örn. -3 = bir taş).
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

  // İlk "sakin" nokta: rakibin en az bir hamlesi oynanmış ve sıradaki hamle alma değil
  for (let k = 1; k + 1 < diffs.length; k++) {
    if (!captures[k + 1]) return diffs[k] - start;
  }

  if (chess.isGameOver()) return diffs[diffs.length - 1] - start;

  // Hat takasın ortasında kesildiyse, son karedeki alış-verişi tahmin ederek tamamla
  let final = diffs[diffs.length - 1];
  if (captures[captures.length - 1]) {
    const gain = quiesceGain(chess, lastTo, 4);
    final += (chess.turn() === color ? 1 : -1) * gain;
  }
  return final - start;
}

// İleriye bakış: motorun hattı sonuna kadar oynanınca feda edilen materyal GERİ ALINMIYOR mu?
// Pozitif sayı = hat sonunda hâlâ o kadar materyal geride (ya da rakip değil, hamle yapan mat ediyor = 99).
// Feda hemen geri alınıyorsa (takas) ya da küçük bir oyalamaysa brilliant sayılmaz.
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
    // sırası gelen taraf mat olmuş: hamle yapan taraf kazandıysa fedası karşılığını almıştır
    return chess.turn() !== color ? 99 : -99;
  }

  let final = materialDiff(chess, color);
  if (lastCapture) {
    // Hat bir takasın ortasında kesilmiş olabilir: o karedeki alış-verişi tamamla
    const gain = quiesceGain(chess, lastTo, 4);
    final += (chess.turn() === color ? 1 : -1) * gain;
  }
  return start - final;
}

// Rakibin, sırası ona geçseydi (ya da şimdi) bir pozisyonda alabileceği en kârlı takas zinciri.
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

// Hamleden hemen sonra feda edilen materyal (statik takas hesabı, motor hattından bağımsız).
// raw = rakibin kazanabileceği - bu hamlede alınan taş
// net = raw - HAMLEDEN ÖNCE zaten var olan tehdit (zaten asılı duran taş feda sayılmaz)
export function staticSacrifice(fenBefore, uci, color) {
  try {
    // Hamleden önceki tehdit: sırayı rakibe verip alabileceği en çok materyal
    let threatBefore = 0;
    try {
      const parts = fenBefore.split(" ");
      parts[1] = parts[1] === "w" ? "b" : "w";
      parts[3] = "-";
      threatBefore = maxCaptureGain(new Chess(parts.join(" ")));
    } catch {
      threatBefore = 0;
    }

    const chess = new Chess(fenBefore);
    const mv = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci[4] || undefined,
    });
    if (!mv) return { raw: 0, net: 0 };
    const gained = mv.captured ? PIECE_VAL[mv.captured] : 0;
    const maxGain = maxCaptureGain(chess);
    const raw = Math.max(0, maxGain - gained);
    const net = Math.max(0, maxGain - gained - threatBefore);
    return { raw, net };
  } catch {
    return { raw: 0, net: 0 };
  }
}

// Sınıflandırma (kaybedilen kazanma % eşikleri):
//   brilliant (!!)  : iyi hamle + büyük feda
//   excellent (!)   : zor bulunan hamle (tek iyi hamle / küçük feda)
//   best            : motorun en iyisi ya da kaybı ≤ 2
//   good ≤ 5 · inaccuracy ≤ 10 · mistake ≤ 20 · blunder > 20
export function classifyMove({
  uci,
  best,
  loss,
  winBefore,
  winAfter,
  winAlt, // oynanan hamle dışındaki en iyi alternatifin değeri (yoksa null = tek yasal/zorunlu hamle)
  gap,
  isRecapture,
  sacrificeSwing,
  hangSwing = 0,
  persist = 0, // hat sonunda hâlâ geride kalınan materyal (ileriye bakış)
  moverPiece,
  cpBefore,
  cpAfter,
}) {
  const playedBest = uci === best;

  // Brilliant (chess.com tanımı): iyi bir taş feda etmek. Hamle en iyi ya da en iyiye yakın olmalı,
  // hamleden sonra pozisyon kötü olmamalı ve hamleyi bulmasan da zaten tamamen kazanıyor olmamalısın.
  // "Hamleyi bulmasan da zaten tamamen kazanıyor olmamalısın" = en iyi ALTERNATİF de kazanç olmamalı.
  // (winBefore kullanılamaz: motor hamleyi bulduğu için feda sonrası matı zaten görür ve winBefore ~%100 çıkar.)
  if (
    moverPiece !== "k" &&
    winAlt !== null &&
    loss <= 2 &&
    sacrificeSwing <= -2 &&
    winAlt < 97 &&
    winAfter >= 47
  ) {
    return "brilliant";
  }

  // Excellent (!): zor bulunan hamle. Ya tek iyi hamle (alternatifler belirgin kötü)
  // ya da küçük bir feda (genelde piyon). Brilliant (!!) kadar büyük değil.
  const nearBest = loss <= 1;
  const onlyMove = winAlt !== null && gap >= 12 && !isRecapture;
  const smallSacrifice =
    moverPiece !== "k" &&
    winAlt !== null &&
    sacrificeSwing <= -1 &&
    winAlt < 97 &&
    winAfter >= 45;

  if (nearBest && (onlyMove || smallSacrifice)) {
    return "excellent";
  }

  // Best: motorun en iyi hamlesi ya da onunla pratikte aynı seviye (kayıp < 0.5).
  // Good: makul bir seçenek ama daha iyi hamleler var.
  if (playedBest || loss < 0.5) return "best";
  if (loss <= 5) return "good";
  if (loss <= 10) return "inaccuracy";

  // Blunder: bedava taş vermek, matı kaçırmak, mat yemek ya da oyunu tamamen çevirmek.
  // Bunların dışındaki büyük hatalar "mistake" kalır.
  const missedMate = cpBefore >= 3000 && cpAfter < 3000;
  const allowsMate = cpAfter <= -3000 && cpBefore > -3000;
  const hangsPiece = hangSwing <= -3 || sacrificeSwing <= -3; // motorun hattında en az bir taş kaybı
  const flipsGame = loss > 20 && winBefore >= 40 && winAfter <= 25;

  if (allowsMate || missedMate || hangsPiece || flipsGame || loss >= 35) {
    return "blunder";
  }
  return "mistake";
}
