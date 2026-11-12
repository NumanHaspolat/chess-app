// Günlük hedef ve gün serisi. Çözülen/bitirilen her puzzle o günün sayacını artırır.
// Seri: hedefi tutturulan ardışık günler (bugün henüz tamamlanmadıysa seri bozulmaz).

const KEY = "azurite-daily";
const KEEP_DAYS = 400;
export const GOAL_OPTIONS = [1, 3, 5, 10, 20, 50];

export function dateKey(d = new Date()) {
  const pad = (v) => String(v).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      goal: GOAL_OPTIONS.includes(data.goal) ? data.goal : 5,
      days: data.days && typeof data.days === "object" ? data.days : {},
    };
  } catch {
    return { goal: 5, days: {} };
  }
}

function save(state) {
  const keys = Object.keys(state.days).sort();
  while (keys.length > KEEP_DAYS) delete state.days[keys.shift()];
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export function getGoal() {
  return load().goal;
}

export function setGoal(goal) {
  const state = load();
  if (!GOAL_OPTIONS.includes(goal)) return;
  state.goal = goal;
  save(state);
}

export function addToday(n = 1) {
  const state = load();
  const key = dateKey();
  state.days[key] = (state.days[key] || 0) + n;
  save(state);
}

function shiftDays(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

export function dailySummary() {
  const { goal, days } = load();
  const today = new Date();
  const todayCount = days[dateKey(today)] || 0;
  const met = (d) => (days[dateKey(d)] || 0) >= goal;

  // Güncel seri: bugünden (tamamlandıysa) ya da dünden geriye doğru
  let cursor = met(today) ? today : shiftDays(today, -1);
  let streak = 0;
  while (met(cursor)) {
    streak++;
    cursor = shiftDays(cursor, -1);
  }

  // En iyi seri
  const keys = Object.keys(days)
    .filter((k) => days[k] >= goal)
    .sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const k of keys) {
    const [y, m, d] = k.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    run = prev && dateKey(shiftDays(prev, 1)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }

  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = shiftDays(today, -i);
    week.push({
      key: dateKey(d),
      label: d.toLocaleDateString("en", { weekday: "short" }).slice(0, 2),
      count: days[dateKey(d)] || 0,
      met: met(d),
      isToday: i === 0,
    });
  }

  return {
    goal,
    today: todayCount,
    streak,
    best: Math.max(best, streak),
    week,
  };
}
