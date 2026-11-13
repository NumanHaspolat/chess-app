// Açılış öğrenme / antrenman ilerlemesi (localStorage). main.js'ten ayrıldı.
// openingProgress aynı nesne olarak paylaşılır; yalnızca yerinde değiştirilir.

const KEY = "azurite-opening-progress";
const HISTORY_LIMIT = 10;

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export const openingProgress = load();

export function reloadOpeningProgress() {
  for (const k of Object.keys(openingProgress)) delete openingProgress[k];
  Object.assign(openingProgress, load());
}

export function saveOpeningProgress() {
  try {
    localStorage.setItem(KEY, JSON.stringify(openingProgress));
  } catch {}
}

export function getOpeningProgress(opening, variation) {
  const openingId = opening.id || opening.name;
  const variationId = variation.id || variation.name;

  openingProgress[openingId] ??= {
    name: opening.name,
    studied: false,
    learnCount: 0,
    variations: {},
  };

  const data = openingProgress[openingId];
  data.variations[variationId] ??= {
    name: variation.name,
    studied: false,
    learnCount: 0,
    trainCount: 0,
    progress: 0,
  };

  const v = data.variations[variationId];
  if (v.progress === undefined) {
    v.progress = Math.min(100, (v.perfectTrainCount || 0) * 25);
  }
  v.name = variation.name;
  v.plies ??= {}; // ply -> { ok, bad, san }
  v.history ??= []; // son antrenman doğrulukları
  return v;
}

export function recordLearn(opening, variation) {
  const v = getOpeningProgress(opening, variation);
  const o = openingProgress[opening.id || opening.name];
  o.name = opening.name;
  o.studied = true;
  v.studied = true;
  v.learnCount++;
  v.progress = Math.min(100, (v.progress || 0) + 2);
  saveOpeningProgress();
}

export function recordTrain(opening, variation, accuracy, mistakes = 0) {
  const v = getOpeningProgress(opening, variation);
  const o = openingProgress[opening.id || opening.name];
  o.studied = true;
  v.studied = true;
  v.trainCount++;
  v.progress = Math.min(100, (v.progress || 0) + accuracy * 0.25);
  v.history.push({ acc: Math.round(accuracy), mistakes, t: Date.now() });
  if (v.history.length > HISTORY_LIMIT)
    v.history.splice(0, v.history.length - HISTORY_LIMIT);
  saveOpeningProgress();
}

// Her hamle için doğru / yanlış sayacı (zayıf noktaları bulmak için)
export function recordPly(opening, variation, ply, san, ok) {
  const v = getOpeningProgress(opening, variation);
  const p = (v.plies[ply] ??= { ok: 0, bad: 0, san });
  p.san = san;
  if (ok) p.ok++;
  else p.bad++;
  // Doğru oynadıkça eski hatalar silinir: son 3 doğru hatayı 1 azaltır
  if (ok && p.bad > 0 && p.ok % 3 === 0) p.bad--;
  saveOpeningProgress();
}

export function getVariationProgress(v) {
  return Math.round(v.progress || 0);
}

export function openingMastery(opening) {
  const data = openingProgress[opening.id || opening.name];
  const list = opening.variations || [];
  if (!list.length) return 0;
  const total = list.reduce((sum, variation) => {
    const v = data?.variations?.[variation.id || variation.name];
    return sum + (v?.progress || 0);
  }, 0);
  return Math.round(total / list.length);
}

// En çok hata yapılan hamleler: [{ ply, san, bad, ok, label }]
export function troubleSpots(v, limit = 3) {
  return Object.entries(v.plies || {})
    .map(([ply, p]) => ({ ply: Number(ply), ...p }))
    .filter((p) => p.bad > 0)
    .sort(
      (a, b) =>
        b.bad / (b.bad + b.ok) - a.bad / (a.bad + a.ok) || b.bad - a.bad,
    )
    .slice(0, limit)
    .map((p) => ({
      ...p,
      label: `${Math.floor(p.ply / 2) + 1}${p.ply % 2 ? "..." : "."} ${p.san}`,
    }));
}

export function averageAccuracy(v) {
  if (!v.history?.length) return null;
  return Math.round(
    v.history.reduce((s, h) => s + h.acc, 0) / v.history.length,
  );
}
