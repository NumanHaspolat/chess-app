// Aralıklı tekrar (Leitner kutuları): repertuvar drill'inde kullanıcının hamle yaptığı her
// pozisyon bir "kart"tır. Doğru bilinen kartlar seyrekleşir, hata yapılanlar sık çıkar.
// Drill'de rakibin cevabı, vadesi gelen/zayıf kartlara giden hamle ağırlıklı seçilir.

const KEY = "azurite-srs";
const DAY = 24 * 60 * 60 * 1000;
// kutu -> sonraki tekrara kadar süre
const INTERVALS = [0, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY];
const MAX_BOX = INTERVALS.length - 1;

const posKey = (fen) => fen.split(" ").slice(0, 4).join(" ");

function loadAll() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "{}");
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function saveAll(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

// result: "perfect" (ilk denemede doğru), "retry" (hata sonrası doğru), "fail" (yanlış hamle)
export function srsRecord(repId, fen, result, now = Date.now()) {
  const all = loadAll();
  const cards = (all[repId] ||= {});
  const k = posKey(fen);
  const card = (cards[k] ||= { box: 0, due: now, seen: 0, lapses: 0 });

  card.seen++;
  card.last = now;

  if (result === "perfect") {
    card.box = Math.min(MAX_BOX, card.box + 1);
    card.due = now + INTERVALS[card.box];
  } else if (result === "retry") {
    card.box = Math.max(0, Math.min(card.box, 1));
    card.due = now + 10 * 60 * 1000;
  } else {
    card.box = 0;
    card.lapses++;
    card.due = now;
  }
  saveAll(all);
}

// Kartın "tekrar önceliği" (yüksek = daha önce görmeli)
export function cardWeight(card, now = Date.now()) {
  if (!card) return 1.5; // hiç görülmemiş pozisyon
  if (card.due <= now) {
    const overdueDays = Math.min(10, (now - card.due) / DAY);
    return (
      3 +
      overdueDays * 0.3 +
      (MAX_BOX - card.box) * 0.5 +
      Math.min(card.lapses, 5) * 0.4
    );
  }
  return 0.3; // vadesi gelmemiş: yine de ara sıra çıkabilir
}

// Rakip cevabı seçimi: alt ağaçtaki vadesi gelen kartlara giden hamle daha olası.
export function pickReplySRS(rep, fen, now = Date.now()) {
  const node = rep.getNode(fen);
  if (!node || node.edges.size === 0) return null;
  const edges = [...node.edges.values()];
  if (edges.length === 1) return edges[0];

  const cards = loadAll()[rep.id] || {};
  const userColor = rep.color;

  const subtreeScore = (startFen) => {
    let max = 0;
    let sum = 0;
    let count = 0;
    let visitedNodes = 0;
    const seen = new Set();
    const stack = [startFen];
    while (stack.length && visitedNodes < 250) {
      const f = stack.pop();
      const key = posKey(f);
      if (seen.has(key)) continue;
      seen.add(key);
      const n = rep.getNode(f);
      if (!n || n.edges.size === 0) continue;
      visitedNodes++;
      if (f.split(" ")[1] === userColor) {
        const w = cardWeight(cards[key], now);
        max = Math.max(max, w);
        sum += w;
        count++;
      }
      for (const e of n.edges.values()) stack.push(e.to);
    }
    return count ? 0.2 + max + 0.3 * (sum / count) : 1;
  };

  const weights = edges.map((e) => subtreeScore(e.to));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < edges.length; i++) {
    r -= weights[i];
    if (r <= 0) return edges[i];
  }
  return edges[edges.length - 1];
}

export function srsSummary(repId, now = Date.now()) {
  const cards = loadAll()[repId] || {};
  const list = Object.values(cards);
  const due = list.filter((c) => c.due <= now).length;
  const mastered = list.filter((c) => c.box >= 4).length;
  return { tracked: list.length, due, mastered };
}

export function resetSrs() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
