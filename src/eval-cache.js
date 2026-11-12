// Oyun analizi önbelleği: aynı maç aynı derinlikte tekrar açılırsa motor çalışmaz.
// localStorage'da en fazla MAX_GAMES maç tutulur (en eski silinir).

const KEY = "azurite-review-cache";
const MAX_GAMES = 8;

function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++)
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function reviewCacheKey(sanMoves, depth) {
  const text = sanMoves.join(" ");
  return `${hashString(text)}-${text.length}-d${depth}`;
}

function readAll() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function loadCachedReview(key, expectedLength) {
  const entry = readAll().find((e) => e.key === key);
  if (
    !entry ||
    !Array.isArray(entry.evals) ||
    entry.evals.length !== expectedLength
  ) {
    return null;
  }
  return entry;
}

export function saveCachedReview(key, evals, deep = {}) {
  let all = readAll().filter((e) => e.key !== key);
  all.push({ key, at: Date.now(), evals, deep });
  all = all.slice(-MAX_GAMES);
  // Kota dolarsa en eskileri atıp tekrar dene
  for (let tries = 0; tries < 4; tries++) {
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
      return;
    } catch {
      all = all.slice(1);
      if (!all.length) return;
    }
  }
}

export function clearReviewCache() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
