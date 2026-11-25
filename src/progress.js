// XP, levels and achievements. main.js reports what happened with
// track("puzzle" | "drill" | "learn" | "train" | "review" | "daily" | "profile", data)
// and this file decides what it is worth. State lives in localStorage
// ("azurite-progress" + the plain number "azurite-xp") so it syncs with the account.
import { toast } from "./toast.js";
import { confetti } from "./fx.js";
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
      botGames: 0,
      botWins: 0,
      botWinElo: 0,
      botMates: 0,
      hardSolved: 0,
      nightSolved: 0,
      noHintSolved: 0,
      bestAccuracy: 0,
      cleanGames: 0,
      brilliantGame: 0,
      accurateGames: 0,
      visitDays: 0,
      earlySolved: 0,
      weekendGoals: 0,
      botBlackWins: 0,
      botFast: 0,
      botDraws: 0,
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
// A "series" is ONE achievement with several tiers (1 -> 5 -> 10 ...). Each tier
// is still stored as its own badge (own toast + XP), but the pane shows one card
// per series with a tier bar and the progress to the NEXT tier.
// cat: puzzle | drill | learn | review | brilliant | streak | level | bot
const BADGES = [];
function ladder(cat, glyph, field, steps, names, unit, title, valueOf) {
  steps.forEach((n, i) =>
    BADGES.push({
      id: `${field}-${n}`,
      series: title,
      tier: i,
      cat,
      glyph,
      name: names[i],
      desc: unit(n),
      progress: valueOf ? (s) => [valueOf(s), n] : (s) => [s.c[field], n],
    }),
  );
}
const one = (n, single, many) => (n === 1 ? single : many(n));

// ---- Puzzles
ladder(
  "puzzle",
  "♞",
  "solved",
  [1, 10, 50, 100, 250, 500, 1000],
  [
    "First Win",
    "Puzzle Apprentice",
    "Puzzle Solver",
    "Puzzle Master",
    "Tactics Addict",
    "Puzzle Legend",
    "Puzzle God",
  ],
  (n) => one(n, "Solve your first puzzle", (k) => `Solve ${k} puzzles`),
  "Puzzle Solver",
);
ladder(
  "puzzle",
  "♞",
  "bestRun",
  [5, 10, 25, 50],
  ["Sharp Eye", "On a Roll", "Untouchable", "Flawless"],
  (n) => `Solve ${n} puzzles in a row without hints or mistakes`,
  "Clean Streak",
);
ladder(
  "puzzle",
  "♞",
  "rating",
  [1600, 1800, 2000, 2200],
  ["Rising Star", "Sharp Mind", "Expert Eye", "Tactical Monster"],
  (n) => `Reach a puzzle rating of ${n}`,
  "Puzzle Rating",
);
ladder(
  "puzzle",
  "♞",
  "hardSolved",
  [1, 10, 50],
  ["Challenge Accepted", "Hard Hitter", "Hardcore"],
  (n) =>
    one(
      n,
      "Solve a Hard or Expert puzzle",
      (k) => `Solve ${k} Hard or Expert puzzles`,
    ),
  "Hard Puzzles",
);
ladder(
  "puzzle",
  "♞",
  "noHintSolved",
  [25, 100, 300],
  ["On My Own", "Independent", "Self-Taught"],
  (n) => `Solve ${n} puzzles without using a hint`,
  "No Hints",
);
ladder(
  "puzzle",
  "☾",
  "nightSolved",
  [1, 10],
  ["Night Owl", "Insomniac"],
  (n) =>
    one(
      n,
      "Solve a puzzle between midnight and 5 am",
      (k) => `Solve ${k} puzzles between midnight and 5 am`,
    ),
  "Night Owl",
);

// ---- Streaks
ladder(
  "streak",
  "♨",
  "dayStreak",
  [3, 7, 14, 30, 60, 100],
  [
    "3-Day Streak",
    "Week Warrior",
    "Fortnight Fighter",
    "Monthly Grinder",
    "Two-Month Titan",
    "Centurion",
  ],
  (n) => `Reach a ${n}-day streak`,
  "Daily Streak",
);
ladder(
  "streak",
  "♨",
  "dailyGoals",
  [1, 7, 30, 100],
  ["Goal Getter", "Goal Crusher", "Goal Machine", "Goal Legend"],
  (n) =>
    one(
      n,
      "Complete your daily goal",
      (k) => `Complete your daily goal ${k} times`,
    ),
  "Daily Goals",
);

// ---- Repertoire / openings
ladder(
  "drill",
  "♜",
  "drills",
  [1, 10, 50, 150],
  ["First Drill", "Drill Sergeant", "Repertoire Machine", "Theory Monster"],
  (n) =>
    one(n, "Finish a repertoire drill", (k) => `Finish ${k} repertoire drills`),
  "Repertoire Drills",
);
ladder(
  "drill",
  "♜",
  "perfectDrills",
  [1, 10, 50],
  ["Flawless Drill", "Memory Palace", "Photographic"],
  (n) =>
    one(
      n,
      "Finish a drill without a single mistake",
      (k) => `Finish ${k} drills without a mistake`,
    ),
  "Perfect Drills",
);
ladder(
  "learn",
  "♝",
  "learns",
  [1, 10, 25, 60],
  ["Student", "Scholar", "Professor", "Opening Encyclopedia"],
  (n) => one(n, "Complete a Learn line", (k) => `Complete ${k} Learn lines`),
  "Learn Lines",
);
ladder(
  "learn",
  "♝",
  "trains",
  [1, 5, 25, 60],
  ["Warm-Up", "Practice Makes Perfect", "Training Camp", "Iron Memory"],
  (n) => one(n, "Complete a Train line", (k) => `Complete ${k} Train lines`),
  "Train Lines",
);

// ---- Game review
ladder(
  "review",
  "♛",
  "reviews",
  [1, 10, 50, 150],
  ["Game Reviewer", "Analyst", "Deep Analyst", "Grandmaster Mind"],
  (n) => one(n, "Review your first game", (k) => `Review ${k} games`),
  "Game Reviews",
);
ladder(
  "review",
  "♛",
  "bestAccuracy",
  [80, 90, 95],
  ["Solid Game", "Precision", "Near Perfect"],
  (n) => `Reach ${n}% accuracy in a reviewed game`,
  "Accuracy",
);
ladder(
  "review",
  "♛",
  "cleanGames",
  [1, 5],
  ["Clean Sheet", "Safe Hands"],
  (n) =>
    one(
      n,
      "Play a reviewed game with no mistakes or blunders",
      (k) => `Play ${k} reviewed games with no mistakes or blunders`,
    ),
  "Clean Games",
);
BADGES.push({
  id: "profile-1",
  series: "Know Thyself",
  tier: 0,
  cat: "review",
  glyph: "♛",
  name: "Know Thyself",
  desc: "Generate a profile report",
  progress: (s) => [s.c.profiles, 1],
});

// ---- Brilliant moves
ladder(
  "brilliant",
  "!!",
  "brilliant",
  [1, 5, 25, 100],
  ["First Brilliant", "Brilliant Mind", "Brilliancy Hunter", "Tal Reborn"],
  (n) => one(n, "Play a brilliant move", (k) => `Play ${k} brilliant moves`),
  "Brilliant Moves",
);
ladder(
  "brilliant",
  "!!",
  "brilliantGame",
  [2, 3],
  ["Double Brilliant", "Triple Brilliant"],
  (n) => `Play ${n} brilliant moves in one game`,
  "Brilliant Game",
);

// ---- Versus computer
ladder(
  "bot",
  "♚",
  "botGames",
  [1, 10, 50, 150],
  ["First Game", "Regular", "Veteran", "Club Player"],
  (n) =>
    one(
      n,
      "Finish a game against the computer",
      (k) => `Finish ${k} games against the computer`,
    ),
  "Games vs Computer",
);
ladder(
  "bot",
  "♚",
  "botWins",
  [1, 5, 25, 100],
  ["First Blood", "Giant Slayer", "Machine Breaker", "Bot Crusher"],
  (n) => one(n, "Beat the computer", (k) => `Beat the computer ${k} times`),
  "Wins vs Computer",
);
ladder(
  "bot",
  "♚",
  "botWinElo",
  [1500, 2000, 2500],
  ["Beat 1500", "Beat 2000", "Beat 2500"],
  (n) => `Beat the computer at ${n} strength or higher`,
  "Strong Opponent",
);
ladder(
  "bot",
  "♚",
  "botMates",
  [1, 10],
  ["Checkmate!", "Mating Net"],
  (n) =>
    one(
      n,
      "Checkmate the computer",
      (k) => `Checkmate the computer ${k} times`,
    ),
  "Checkmates",
);

// ---- Levels
[5, 10, 20, 30, 50].forEach((n, i, arr) =>
  BADGES.push({
    id: `level-${n}`,
    series: "Level",
    tier: i,
    cat: "level",
    glyph: "▲",
    name: `Level ${n}`,
    desc: `Reach level ${n}`,
    progress: (s) => [levelFromXp(s.xp).level, n],
  }),
);

// ---- More: visits, style, bot extras, meta
ladder(
  "streak",
  "☀",
  "visitDays",
  [3, 7, 30, 100],
  ["Familiar Face", "Regular Visitor", "Part of the Furniture", "Resident"],
  (n) => `Visit Chexel on ${n} different days`,
  "Days Visited",
);
ladder(
  "puzzle",
  "☼",
  "earlySolved",
  [1, 10],
  ["Early Bird", "Dawn Patrol"],
  (n) =>
    one(
      n,
      "Solve a puzzle between 5 and 7 am",
      (k) => `Solve ${k} puzzles between 5 and 7 am`,
    ),
  "Early Bird",
);
ladder(
  "streak",
  "☀",
  "weekendGoals",
  [1, 8],
  ["Weekend Warrior", "Weekend Regular"],
  (n) =>
    one(
      n,
      "Complete your daily goal on a weekend",
      (k) => `Complete your daily goal on ${k} weekend days`,
    ),
  "Weekend Warrior",
);
ladder(
  "bot",
  "♚",
  "botBlackWins",
  [1, 10],
  ["Dark Side", "Black Belt"],
  (n) =>
    one(
      n,
      "Beat the computer with Black",
      (k) => `Beat the computer with Black ${k} times`,
    ),
  "Wins as Black",
);
ladder(
  "bot",
  "♚",
  "botFast",
  [1, 5],
  ["Blitzkrieg", "Lightning Strike"],
  (n) =>
    one(
      n,
      "Checkmate the computer in 30 half-moves or fewer",
      (k) => `Checkmate the computer quickly ${k} times`,
    ),
  "Quick Mates",
);
ladder(
  "bot",
  "♚",
  "botDraws",
  [1, 10],
  ["Peace Treaty", "Diplomat"],
  (n) =>
    one(
      n,
      "Draw against the computer",
      (k) => `Draw against the computer ${k} times`,
    ),
  "Draws",
);
ladder(
  "level",
  "★",
  "xpTotal",
  [1000, 5000, 15000],
  ["XP Collector", "XP Hoarder", "XP Dragon"],
  (n) => `Earn ${n} XP`,
  "XP",
  (s) => s.xp,
);
ladder(
  "level",
  "❖",
  "collector",
  [10, 25, 50, 75],
  ["Collector", "Trophy Case", "Hall of Fame", "Completionist"],
  (n) => `Unlock ${n} achievements`,
  "Collector",
  (s) => Object.keys(s.badges).length,
);

function egg(id, glyph, name, desc, hidden = true) {
  BADGES.push({
    id: `egg-${id}`,
    series: name,
    tier: 0,
    cat: hidden ? "secret" : "level",
    glyph,
    name,
    desc,
    hidden,
    progress: (s) => [s.c[`e_${id}`] || 0, 1],
  });
}
// open ones (small nice-to-have actions)
egg(
  "style",
  "✿",
  "Fashionista",
  "Change the color theme or the board colors",
  false,
);
egg("cloud", "☁", "Cloud Nine", "Sign in to sync your progress", false);
egg("safe", "⛨", "Better Safe", "Export a backup of your data", false);
// secrets
egg("heart", "♥", "Spread the Love", "Click the heart in the footer", false);
egg("konami", "↑", "Old School", "Enter a famous cheat code");
egg("brand", "♔", "Knock Knock", "Be really, really fond of the logo");
egg(
  "pieces",
  "♟",
  "Piece Whisperer",
  "Make friends with the pieces on the home page",
);
egg(
  "magnus",
  "♕",
  "Say His Name",
  "Type the name of the World Champion who retired the crown",
);
egg("mate", "✓", "Say It Out Loud", "Announce the end of the game");
egg("blackcat", "☾", "Black Cat", "Open Chexel on Friday the 13th");
egg(
  "chessday",
  "♞",
  "Happy Chess Day!",
  "Visit on International Chess Day (July 20)",
);
egg("holiday", "❄", "Holiday Gambit", "Visit Chexel during the holidays");
egg("witch", "☽", "Witching Hour", "Be here at 3 am");
egg(
  "perfect",
  "⚙",
  "Are You an Engine?",
  "Reach 100% accuracy in a reviewed game",
);
egg(
  "marathon",
  "∞",
  "Marathon",
  "Finish a game of 150 half-moves or more against the computer",
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
        if (["hard", "expert", "master"].includes(d.level)) s.c.hardSolved++;
        const hr = new Date().getHours();
        if (hr < 5) s.c.nightSolved++;
        else if (hr >= 5 && hr < 7) s.c.earlySolved++;
        if (d.hint) {
          s.c.run = 0;
          gains.push([3, "Puzzle solved (hint used)"]);
        } else {
          s.c.run++;
          s.c.bestRun = Math.max(s.c.bestRun, s.c.run);
          s.c.noHintSolved++;
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
      s.c.brilliantGame = Math.max(s.c.brilliantGame, b);
      if (d.accuracy)
        s.c.bestAccuracy = Math.max(s.c.bestAccuracy, Math.floor(d.accuracy));
      if (d.accuracy && Math.floor(d.accuracy) >= 100) s.c.e_perfect = 1;
      if (d.accuracy && !d.mistakes && !d.blunders) s.c.cleanGames++;
      gains.push([
        20 + b * 15,
        b ? `Game reviewed · ${b} brilliant` : "Game reviewed",
      ]);
      break;
    }
    case "bot": {
      s.c.botGames++;
      if (d.outcome === "w") {
        s.c.botWins++;
        s.c.botWinElo = Math.max(s.c.botWinElo, d.elo || 0);
        if (d.mate) s.c.botMates++;
        if (d.color === "b") s.c.botBlackWins++;
        if (d.mate && d.plies && d.plies <= 30) s.c.botFast++;
        gains.push([
          20 + Math.round(Math.max(0, (d.elo || 1500) - 1000) / 100) * 2,
          "Beat the computer",
        ]);
      } else {
        if (d.outcome === "d") s.c.botDraws++;
        gains.push([d.outcome === "d" ? 10 : 5, "Game finished"]);
      }
      if (d.plies >= 150) s.c.e_marathon = 1;
      break;
    }
    case "daily":
      if (dayInfo.daily) break;
      dayInfo.daily = true;
      s.c.dailyGoals++;
      if (d.streak) s.c.dayStreak = Math.max(s.c.dayStreak, d.streak);
      if ([0, 6].includes(new Date().getDay())) s.c.weekendGoals++;
      gains.push([30, "Daily goal complete"]);
      break;
    case "profile":
      s.c.profiles++;
      if (!dayInfo.profile) {
        dayInfo.profile = true;
        gains.push([10, "Profile report"]);
      }
      break;
    case "visit": {
      if (dayInfo.visit) return;
      dayInfo.visit = true;
      s.c.visitDays++;
      const now = new Date();
      if (now.getDay() === 5 && now.getDate() === 13) s.c.e_blackcat = 1;
      if (now.getMonth() === 6 && now.getDate() === 20) s.c.e_chessday = 1;
      if (
        (now.getMonth() === 11 && [24, 25, 26].includes(now.getDate())) ||
        (now.getMonth() === 0 && now.getDate() === 1)
      )
        s.c.e_holiday = 1;
      if (now.getHours() === 3) s.c.e_witch = 1;
      if (s.visitedBefore) gains.push([5, "Welcome back"]);
      s.visitedBefore = true;
      break;
    }
    case "egg":
      if (!d.id || s.c[`e_${d.id}`]) return;
      s.c[`e_${d.id}`] = 1;
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
  window.dispatchEvent(new Event("cxess:progress"));
  window.dispatchEvent(
    new CustomEvent("cxess:event", {
      detail: {
        event,
        d,
        run: s.c.run,
        levelUp:
          after > before && !quiet
            ? { level: after, title: titleFor(after) }
            : null,
      },
    }),
  );

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
  if (newBadges.length && !quiet) {
    const secret = newBadges.some((b) => b.hidden);
    setTimeout(() => confetti({ count: secret ? 90 : 50 }), 200);
  }
  newBadges.forEach((b, i) =>
    setTimeout(
      () =>
        toast({
          kind: "badge",
          icon: b.glyph,
          title: b.hidden
            ? `Secret found: ${b.name}`
            : `Achievement: ${b.name}`,
          text: `${b.desc} (+${BADGE_XP} XP)`,
          duration: 5200,
        }),
      250 + i * 350,
    ),
  );
  if (after > before) {
    setTimeout(() => confetti({ count: 110 }), 350 + newBadges.length * 350);
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

  // group tiers into one card per series
  const groups = new Map();
  for (const b of BADGES) {
    if (!groups.has(b.series)) groups.set(b.series, []);
    groups.get(b.series).push(b);
  }

  box.innerHTML = "";
  const isHidden = (tiers) => !!tiers[0].hidden;
  const entries = [...groups].sort((a, b) => isHidden(a[1]) - isHidden(b[1]));
  let secretHead = false;
  for (const [title, tiers] of entries) {
    if (isHidden(tiers) && !secretHead) {
      secretHead = true;
      const h = document.createElement("div");
      h.className = "ach-sub";
      const found = entries.filter(
        ([, t]) => isHidden(t) && s.badges[t[0].id],
      ).length;
      const all = entries.filter(([, t]) => isHidden(t)).length;
      h.textContent = `Secrets · ${found} / ${all} found`;
      box.appendChild(h);
    }
    tiers.sort((x, y) => x.tier - y.tier);
    const got = tiers.filter((t) => s.badges[t.id]);
    const next = tiers.find((t) => !s.badges[t.id]);
    const last = got[got.length - 1];
    const complete = !next;
    const card = document.createElement("div");
    card.className = `ach-card cat-${tiers[0].cat}${got.length ? " got" : ""}${complete ? " complete" : ""}`;

    let body = "";
    if (next) {
      const [cur, target] = next.progress(s);
      const pct = Math.min(100, Math.round((cur / target) * 100));
      body = `<span class="ach-desc"></span><div class="ach-track"><div style="width:${pct}%"></div></div><span class="ach-num">${Math.min(cur, target)} / ${target}</span>`;
    } else {
      body = `<span class="ach-desc"></span><span class="ach-num">Completed</span>`;
    }
    const pips =
      tiers.length > 1
        ? `<div class="ach-tiers" title="${got.length} / ${tiers.length} tiers">${tiers
            .map((t) => `<i class="${s.badges[t.id] ? "on" : ""}"></i>`)
            .join("")}</div>`
        : "";
    card.innerHTML = `
      <div class="ach-icon">${tiers[0].glyph}</div>
      <div class="ach-text">
        <strong></strong>
        <span class="ach-tier"></span>
        ${pips}
        ${body}
      </div>`;
    if (tiers[0].hidden && !got.length) {
      card.classList.add("secret");
      card.querySelector(".ach-icon").textContent = "?";
      card.querySelector("strong").textContent = "???";
      card.querySelector(".ach-tier").textContent = "Secret achievement";
      card.querySelector(".ach-desc").textContent =
        "Keep exploring. Something nice is hidden here.";
      const tr = card.querySelector(".ach-track");
      const nm = card.querySelector(".ach-num");
      if (tr) tr.remove();
      if (nm) nm.remove();
      box.appendChild(card);
      continue;
    }
    card.querySelector("strong").textContent = title;
    card.querySelector(".ach-tier").textContent = last
      ? `${last.name}${tiers.length > 1 ? ` · tier ${got.length}/${tiers.length}` : ""}`
      : tiers.length > 1
        ? `Locked · ${tiers.length} tiers`
        : "Locked";
    card.querySelector(".ach-desc").textContent = next ? next.desc : last.desc;
    box.appendChild(card);
  }
}

export function initProgress() {
  renderAchievements();
  window.addEventListener("storage", renderAchievements);
}

// ---------------------------------------------------------- snapshot
const TITLES = [
  [1, "Pawn", "♟"],
  [3, "Squire", "♙"],
  [5, "Knight", "♞"],
  [8, "Bishop", "♝"],
  [12, "Rook", "♜"],
  [18, "Queen", "♛"],
  [25, "King", "♚"],
  [35, "Grandmaster", "♔"],
];
export function titleFor(level) {
  let t = TITLES[0];
  for (const row of TITLES) if (level >= row[0]) t = row;
  return { name: t[1], glyph: t[2] };
}

// Read-only summary for the Home / Profile pages.
export function snapshot() {
  const s = load();
  const lv = levelFromXp(s.xp);
  const earned = BADGES.filter((b) => s.badges[b.id]).sort(
    (a, b) => s.badges[b.id] - s.badges[a.id],
  );
  return {
    xp: s.xp,
    level: lv.level,
    pct: Math.max(0, Math.min(100, lv.pct)),
    next: lv.next,
    title: titleFor(lv.level),
    counts: s.c,
    earned,
    total: BADGES.length,
    secrets: BADGES.filter((b) => b.hidden && s.badges[b.id]).length,
  };
}
