// XP, levels and achievements. main.js reports what happened with
// track("puzzle" | "drill" | "learn" | "train" | "review" | "daily" | "profile", data)
// and this file decides what it is worth. State lives in localStorage
// ("azurite-progress" + the plain number "azurite-xp") so it syncs with the account.
import { toast } from "./toast.js";
import { levelFromXp, renderLevel } from "./account-ui.js";

const KEY = "azurite-progress";
const XP_KEY = "azurite-xp";

const LEVEL_BONUS = {
  beginner: 0,
  easy: 2,
  medium: 5,
  hard: 10,
  expert: 15,
  master: 15,
};
const BADGE_XP = 25;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function blank() {
  return {
    xp: 0,
    badges: {},
    c: {
      puzzles: 0,
      solved: 0,
      run: 0,
      bestRun: 0,
      rating: 0,
      drills: 0,
      perfectDrills: 0,
      learns: 0,
      trains: 0,
      reviews: 0,
      brilliant: 0,
      dailyGoals: 0,
      dayStreak: 0,
      profiles: 0,
    },
    seen: [],
    days: {},
    seeded: false,
  };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === "object") {
      const b = blank();
      return { ...b, ...s, c: { ...b.c, ...(s.c || {}) } };
    }
  } catch {}
  return blank();
}

function save(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    localStorage.setItem(XP_KEY, JSON.stringify(s.xp));
  } catch {}
}

// ---------------------------------------------------------------- badges
// cat: puzzle | drill | learn | review | brilliant | streak | level
const BADGES = [];
function ladder(cat, glyph, field, steps, names, unit) {
  steps.forEach((n, i) =>
    BADGES.push({
      id: `${field}-${n}`,
      cat,
      glyph,
      name: names[i],
      desc: unit(n),
      progress: (s) => [s.c[field], n],
    }),
  );
}
ladder(
  "puzzle",
  "♞",
  "solved",
  [1, 10, 50, 100, 500],
  [
    "First Win",
    "Puzzle Apprentice",
    "Puzzle Solver",
    "Puzzle Master",
    "Puzzle Legend",
  ],
  (n) => (n === 1 ? "Solve your first puzzle" : `Solve ${n} puzzles`),
);
ladder(
  "puzzle",
  "♞",
  "bestRun",
  [5, 10, 25],
  ["Sharp Eye", "On a Roll", "Untouchable"],
  (n) => `Solve ${n} puzzles in a row without hints or mistakes`,
);
ladder(
  "puzzle",
  "♞",
  "rating",
  [1600, 1800, 2000],
  ["Rising Star", "Sharp Mind", "Expert Eye"],
  (n) => `Reach a puzzle rating of ${n}`,
);
ladder(
  "streak",
  "♨",
  "dayStreak",
  [3, 7, 30],
  ["3-Day Streak", "Week Warrior", "Monthly Grinder"],
  (n) => `Reach a ${n}-day streak`,
);
ladder(
  "streak",
  "♨",
  "dailyGoals",
  [1, 7],
  ["Goal Getter", "Goal Crusher"],
  (n) =>
    n === 1
      ? "Complete your daily goal"
      : `Complete your daily goal ${n} times`,
);
ladder(
  "drill",
  "♜",
  "drills",
  [1, 10, 50],
  ["First Drill", "Drill Sergeant", "Repertoire Machine"],
  (n) =>
    n === 1 ? "Finish a repertoire drill" : `Finish ${n} repertoire drills`,
);
BADGES.push({
  id: "perfect-drill",
  cat: "drill",
  glyph: "♜",
  name: "Flawless Drill",
  desc: "Finish a drill without a single mistake",
  progress: (s) => [s.c.perfectDrills, 1],
});
BADGES.push(
  {
    id: "learn-1",
    cat: "learn",
    glyph: "♝",
    name: "Student",
    desc: "Complete a Learn line",
    progress: (s) => [s.c.learns, 1],
  },
  {
    id: "learn-10",
    cat: "learn",
    glyph: "♝",
    name: "Scholar",
    desc: "Complete 10 Learn lines",
    progress: (s) => [s.c.learns, 10],
  },
  {
    id: "train-5",
    cat: "learn",
    glyph: "♝",
    name: "Practice Makes Perfect",
    desc: "Complete 5 Train lines",
    progress: (s) => [s.c.trains, 5],
  },
);
ladder(
  "review",
  "♛",
  "reviews",
  [1, 10, 50],
  ["Game Reviewer", "Analyst", "Deep Analyst"],
  (n) => (n === 1 ? "Review your first game" : `Review ${n} games`),
);
ladder(
  "brilliant",
  "!!",
  "brilliant",
  [1, 5, 25],
  ["First Brilliant", "Brilliant Mind", "Brilliancy Hunter"],
  (n) => (n === 1 ? "Play a brilliant move" : `Play ${n} brilliant moves`),
);
BADGES.push({
  id: "profile-1",
  cat: "review",
  glyph: "♛",
  name: "Know Thyself",
  desc: "Generate a profile report",
  progress: (s) => [s.c.profiles, 1],
});
[5, 10, 20].forEach((n) =>
  BADGES.push({
    id: `level-${n}`,
    cat: "level",
    glyph: "▲",
    name: `Level ${n}`,
    desc: `Reach level ${n}`,
    progress: (s) => [levelFromXp(s.xp).level, n],
  }),
);

export const ALL_BADGES = BADGES;

function earnedNow(s) {
  return BADGES.filter(
    (b) => !s.badges[b.id] && b.progress(s)[0] >= b.progress(s)[1],
  );
}

// ------------------------------------------------------------------ track
function addSeen(s, id) {
  s.seen.push(id);
  if (s.seen.length > 400) s.seen.splice(0, s.seen.length - 400);
}

function seed(s) {
  // Give credit for puzzles solved before this system existed (no popups).
  try {
    const st = JSON.parse(localStorage.getItem("azurite-puzzle-stats"));
    if (st && st.solved) {
      s.c.puzzles = st.played || 0;
      s.c.solved = st.solved || 0;
      s.c.bestRun = st.bestStreak || 0;
      s.c.rating = st.bestRating || 0;
      s.xp += st.solved * 10;
    }
  } catch {}
  for (const b of earnedNow(s)) s.badges[b.id] = Date.now();
  s.seeded = true;
}

export function track(event, d = {}) {
  try {
    handle(event, d);
  } catch (e) {
    console.warn("[progress]", e);
  }
}

function handle(event, d) {
  const s = load();
  const quiet = !s.seeded;
  if (!s.seeded) seed(s);

  const before = levelFromXp(s.xp).level;
  const gains = [];
  const day = today();
  s.days[day] = s.days[day] || {};
  const dayInfo = s.days[day];

  switch (event) {
    case "puzzle": {
      s.c.puzzles++;
      if (d.rating) s.c.rating = Math.max(s.c.rating, d.rating);
      if (d.won) {
        s.c.solved++;
        if (d.hint) {
          s.c.run = 0;
          gains.push([3, "Puzzle solved (hint used)"]);
        } else {
          s.c.run++;
          s.c.bestRun = Math.max(s.c.bestRun, s.c.run);
          const bonus = LEVEL_BONUS[d.level] ?? 0;
          gains.push([10 + bonus, "Puzzle solved"]);
        }
      } else {
        s.c.run = 0;
        gains.push([2, "Puzzle attempted"]);
      }
      break;
    }
    case "drill":
      s.c.drills++;
      if (!d.mistakes) s.c.perfectDrills++;
      gains.push([
        d.mistakes ? 25 : 35,
        d.mistakes ? "Drill complete" : "Perfect drill!",
      ]);
      break;
    case "learn":
      s.c.learns++;
      gains.push([15, "Line learned"]);
      break;
    case "train":
      s.c.trains++;
      gains.push([20, "Line trained"]);
      break;
    case "review": {
      const id = `review:${d.id || ""}`;
      if (d.id && s.seen.includes(id)) break;
      if (d.id) addSeen(s, id);
      s.c.reviews++;
      const b = Math.max(0, d.brilliant || 0);
      s.c.brilliant += b;
      gains.push([
        20 + b * 15,
        b ? `Game reviewed · ${b} brilliant` : "Game reviewed",
      ]);
      break;
    }
    case "daily":
      if (dayInfo.daily) break;
      dayInfo.daily = true;
      s.c.dailyGoals++;
      if (d.streak) s.c.dayStreak = Math.max(s.c.dayStreak, d.streak);
      gains.push([30, "Daily goal complete"]);
      break;
    case "profile":
      s.c.profiles++;
      if (!dayInfo.profile) {
        dayInfo.profile = true;
        gains.push([10, "Profile report"]);
      }
      break;
    default:
      return;
  }
  // keep only the last 14 days of bookkeeping
  const keys = Object.keys(s.days).sort();
  while (keys.length > 14) delete s.days[keys.shift()];

  for (const [xp] of gains) s.xp += xp;

  // badges (they pay XP too, which can trigger more badges like level ones)
  const newBadges = [];
  for (let guard = 0; guard < 4; guard++) {
    const fresh = earnedNow(s);
    if (!fresh.length) break;
    for (const b of fresh) {
      s.badges[b.id] = Date.now();
      s.xp += BADGE_XP;
      newBadges.push(b);
    }
  }

  const after = levelFromXp(s.xp).level;
  save(s);
  renderLevel();
  renderAchievements();

  if (quiet && !gains.length) return;
  const total = gains.reduce((a, g) => a + g[0], 0);
  if (total) {
    toast({
      kind: "xp",
      title: `+${total} XP`,
      text: gains.map((g) => g[1]).join(" · "),
      duration: 2800,
    });
  }
  newBadges.forEach((b, i) =>
    setTimeout(
      () =>
        toast({
          kind: "badge",
          icon: b.glyph,
          title: `Achievement: ${b.name}`,
          text: `${b.desc} (+${BADGE_XP} XP)`,
          duration: 5200,
        }),
      250 + i * 350,
    ),
  );
  if (after > before) {
    setTimeout(
      () =>
        toast({
          kind: "level",
          title: `Level ${after}!`,
          text: "You levelled up.",
          duration: 5200,
        }),
      400 + newBadges.length * 350,
    );
  }
}

// ----------------------------------------------------- achievements pane
export function renderAchievements() {
  const box = document.getElementById("achievements-list");
  if (!box) return;
  const s = load();
  const done = BADGES.filter((b) => s.badges[b.id]).length;
  const head = document.getElementById("achievements-count");
  if (head) head.textContent = `${done} / ${BADGES.length} unlocked`;
  const lv = levelFromXp(s.xp);
  const sum = document.getElementById("achievements-xp");
  if (sum)
    sum.textContent = `Level ${lv.level} · ${s.xp} XP · ${Math.max(0, lv.next - s.xp)} XP to next level`;

  box.innerHTML = "";
  for (const b of BADGES) {
    const [cur, target] = b.progress(s);
    const got = !!s.badges[b.id];
    const card = document.createElement("div");
    card.className = `ach-card cat-${b.cat}${got ? " got" : ""}`;
    const pct = Math.min(100, Math.round((cur / target) * 100));
    card.innerHTML = `
      <div class="ach-icon">${b.glyph}</div>
      <div class="ach-text">
        <strong></strong>
        <span class="ach-desc"></span>
        ${got ? "" : `<div class="ach-track"><div style="width:${pct}%"></div></div><span class="ach-num">${Math.min(cur, target)} / ${target}</span>`}
      </div>`;
    card.querySelector("strong").textContent = b.name;
    card.querySelector(".ach-desc").textContent = b.desc;
    box.appendChild(card);
  }
}

export function initProgress() {
  renderAchievements();
  window.addEventListener("storage", renderAchievements);
}
