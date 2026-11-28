// "Review" = what to practise today, built from the opening progress that Learn/Train
// already record. Nothing new has to be stored for the schedule itself:
//   • every variation has a history of train runs (accuracy + time)
//   • every move has ok / bad counters (troubleSpots)
// From that we derive WHEN a line is due (spaced repetition: the better your last runs, the
// longer the gap) and WHERE you struggle (weak moves). Beginners get shorter gaps and shorter
// sessions, advanced players get a longer queue and a 7-day forecast.
import {
  openingProgress,
  troubleSpots,
  getVariationProgress,
} from "./src/opening-progress.js";
import { masteryDots } from "./roadmap.js";
import { confetti } from "./src/fx.js";
import { toast } from "./src/toast.js";

const DAY = 24 * 60 * 60 * 1000;
const LOG_KEY = "azurite-review-log";
const SESSION_SIZE = { new: 3, beginner: 3, intermediate: 5, advanced: 8 };
const GAPS = [2, 4, 8, 16, 32, 60]; // days after 1, 2, 3 ... clean runs in a row

const $ = (id) => document.getElementById(id);
const esc = (t) =>
  String(t).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const startOfDay = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const dayKey = (t) => new Date(t).toLocaleDateString("en-CA");

let api = { open: () => false, go: () => {} };

// ------------------------------------------------------------ done-today log
function readLog() {
  try {
    const l = JSON.parse(localStorage.getItem(LOG_KEY));
    if (l && l.day === dayKey(Date.now()) && Array.isArray(l.done)) return l;
  } catch {}
  return { day: dayKey(Date.now()), done: [] };
}
function markDone(key) {
  const l = readLog();
  if (!l.done.includes(key)) l.done.push(key);
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(l));
  } catch {}
}

// ------------------------------------------------------------ the schedule
function intervalDays(v, progress) {
  const h = v.history || [];
  const last = h[h.length - 1];
  if (!last) return 0;
  if (last.acc < 70) return 0; // shaky: do it again
  if (last.acc < 90) return 1;
  let streak = 0;
  for (let i = h.length - 1; i >= 0 && h[i].acc >= 90; i--) streak++;
  let days = GAPS[Math.min(streak, GAPS.length) - 1];
  if (progress < 40) days = Math.min(days, 3); // early on, come back soon
  return days;
}

function userLevel(all) {
  const trained = all.filter((i) => i.trained);
  if (!all.length) return "new";
  const avg = trained.length
    ? trained.reduce((s, i) => s + i.progress, 0) / trained.length
    : 0;
  if (trained.length >= 8 && avg >= 60) return "advanced";
  if (trained.length >= 4 && avg >= 35) return "intermediate";
  return "beginner";
}

export function computeReview(now = Date.now()) {
  const todayStart = startOfDay(now);
  const endOfToday = todayStart + DAY - 1;
  const done = new Set(readLog().done);
  const all = [];

  for (const [oid, o] of Object.entries(openingProgress)) {
    for (const [vid, v] of Object.entries(o.variations || {})) {
      if (!v.studied && !v.trainCount) continue;
      const progress = getVariationProgress(v);
      const h = v.history || [];
      const lastRun = h[h.length - 1] || null;
      const key = `${oid}/${vid}`;
      const trained = !!v.trainCount && !!lastRun;
      const days = trained ? intervalDays(v, progress) : 0;
      const lastAt = lastRun?.t || now - DAY;
      const dueAt = trained ? lastAt + days * DAY : now - 1;
      const weakAll = troubleSpots(v, 8).filter(
        (s) => s.bad / (s.bad + s.ok + 1) >= 0.25,
      );
      const weakScore = weakAll.reduce(
        (s, p) => s + p.bad * (p.bad / (p.bad + p.ok + 1)),
        0,
      );
      const overdue = Math.max(0, (now - dueAt) / DAY);
      const doneToday = done.has(key) || (lastRun && lastRun.t >= todayStart);
      let reason;
      if (!trained) reason = "Learned, not trained yet";
      else if (lastRun.acc < 70)
        reason = `Last run ${lastRun.acc}%, needs another go`;
      else if (overdue >= 1)
        reason = `Overdue by ${Math.floor(overdue)} day${Math.floor(overdue) === 1 ? "" : "s"}`;
      else reason = `Due today · last run ${lastRun.acc}%`;
      all.push({
        key,
        oid,
        vid,
        openingName: o.name || oid,
        variationName: v.name || vid,
        progress,
        trained,
        lastRun,
        dueAt,
        overdue,
        doneToday,
        isDue: dueAt <= endOfToday && !doneToday,
        weak: weakAll,
        weakScore,
        reason,
        score:
          overdue +
          (100 - progress) / 40 +
          weakScore * 0.6 +
          (trained ? 0 : 1.5),
      });
    }
  }

  const level = userLevel(all);
  const due = all.filter((i) => i.isDue).sort((a, b) => b.score - a.score);

  // weak moves: variations where the same moves keep going wrong
  const weak = all
    .filter((i) => i.weak.length && i.weakScore >= 1)
    .sort((a, b) => b.weakScore - a.weakScore)
    .slice(0, 6);

  // 7-day forecast (day 0 also holds everything overdue)
  const forecast = Array.from({ length: 7 }, (_, d) => ({
    day: new Date(todayStart + d * DAY),
    n: 0,
  }));
  for (const i of all) {
    if (i.doneToday && i.dueAt <= endOfToday) continue;
    const d = Math.min(
      6,
      Math.max(0, Math.floor((i.dueAt - todayStart) / DAY)),
    );
    if (i.dueAt < todayStart + 7 * DAY) forecast[d].n++;
  }

  // session: due lines first (most urgent), then up to 2 weak-move drills for lines not already queued
  const size = SESSION_SIZE[level];
  const queue = due.slice(0, size).map((i) => ({ ...i, mode: "train" }));
  for (const w of weak) {
    if (queue.length >= size + 2) break;
    if (!queue.some((q) => q.key === w.key) && !w.doneToday)
      queue.push({
        ...w,
        mode: "drill",
        reason: `Weak moves: ${w.weak
          .slice(0, 3)
          .map((s) => s.label)
          .join(", ")}`,
      });
  }
  const minutes = Math.max(
    1,
    Math.round(queue.reduce((s, q) => s + (q.mode === "drill" ? 1 : 2), 0)),
  );

  return {
    all,
    due,
    weak,
    forecast,
    queue,
    minutes,
    level,
    doneCount: all.filter((i) => i.doneToday).length,
    puzzle: puzzleFocus(),
    nextDue:
      all
        .filter((i) => !i.isDue && i.dueAt > now)
        .sort((a, b) => a.dueAt - b.dueAt)[0] || null,
  };
}

function puzzleFocus() {
  try {
    const st = JSON.parse(localStorage.getItem("azurite-puzzle-stats"));
    const lv = Object.entries(st?.levels || {})
      .filter(([, v]) => v.played >= 5)
      .map(([k, v]) => ({
        level: k,
        played: v.played,
        rate: v.solved / v.played,
      }))
      .sort((a, b) => a.rate - b.rate)[0];
    if (lv && lv.rate < 0.6) return lv;
  } catch {}
  return null;
}

// ------------------------------------------------------------ pieces of UI
const skeleton = (n = 3) =>
  `<div class="rv-skel-list" aria-busy="true">${Array.from({ length: n }, () => '<div class="rv-skel"></div>').join("")}</div>`;

function relDay(t) {
  const d = Math.round((startOfDay(t) - startOfDay(Date.now())) / DAY);
  if (d <= 0) return "today";
  if (d === 1) return "tomorrow";
  return `in ${d} days`;
}

function weakChips(i, max = 4) {
  return i.weak
    .slice(0, max)
    .map((s) => `<span class="chip">${esc(s.label)} ×${s.bad}</span>`)
    .join("");
}

function itemCard(i, mode) {
  const meta =
    mode === "drill" ? `<div class="rv-chips">${weakChips(i)}</div>` : "";
  const reason =
    mode === "drill" && !i.isDue
      ? `Full line due ${relDay(i.dueAt)}`
      : i.reason;
  const dots = masteryDots(i.progress).outerHTML;
  const act =
    mode === "drill"
      ? `<button class="rv-btn primary" data-rv="drill" data-k="${esc(i.key)}">Drill ${i.weak.length} move${i.weak.length === 1 ? "" : "s"}</button>
         <button class="rv-btn" data-rv="train" data-k="${esc(i.key)}">Full line</button>`
      : `<button class="rv-btn primary" data-rv="train" data-k="${esc(i.key)}">${i.trained ? "Train" : "Train it"}</button>
         <button class="rv-btn" data-rv="learn" data-k="${esc(i.key)}">Learn</button>`;
  return `<article class="rv-item">
    <div class="rv-item-main">
      <div class="rv-item-title"><span class="rv-opening">${esc(i.openingName)}</span><strong>${esc(i.variationName)}</strong></div>
      <div class="rv-item-sub">${dots}<span class="rv-reason">${esc(reason)}</span></div>
      ${meta}
    </div>
    <div class="rv-item-actions">${act}</div>
  </article>`;
}

// ------------------------------------------------------------ Home card
export function renderHomeReview() {
  const box = $("home-review");
  if (!box) return;
  const r = computeReview();
  const badge = $("nav-review-badge");
  if (badge) {
    badge.textContent = r.due.length > 9 ? "9+" : String(r.due.length);
    badge.hidden = !r.due.length;
  }

  let html;
  if (!r.all.length) {
    html = `<div class="rv-home-body">
      <div><span class="rv-kicker">Review</span>
      <h3>Build your review habit</h3>
      <p>Learn and train an opening line. Chexel then tells you exactly when to repeat it and which moves keep slipping, so it actually sticks.</p></div>
      <button class="rv-btn primary" data-rv="go" data-p="openings">Pick an opening</button></div>`;
  } else if (r.queue.length) {
    const total = r.doneCount + r.due.length;
    const pct = total ? Math.round((r.doneCount / total) * 100) : 0;
    const names = r.queue
      .slice(0, 3)
      .map(
        (q) =>
          `<li><strong>${esc(q.variationName)}</strong><span>${esc(q.openingName)}</span></li>`,
      )
      .join("");
    html = `<div class="rv-home-body">
      <div class="rv-ring" style="--p:${pct}"><b>${r.due.length}</b><span>due</span></div>
      <div class="rv-home-text"><span class="rv-kicker">Today's review</span>
        <h3>${r.queue.length} item${r.queue.length === 1 ? "" : "s"} · about ${r.minutes} min</h3>
        <ul class="rv-mini">${names}</ul></div>
      <div class="rv-home-actions">
        <button class="rv-btn primary" data-rv="start">Start review</button>
        <button class="rv-btn" data-rv="go" data-p="review">See all</button></div></div>`;
  } else {
    const nxt = r.nextDue
      ? `Next review ${relDay(r.nextDue.dueAt)}: <strong>${esc(r.nextDue.variationName)}</strong>.`
      : "Nothing is waiting.";
    html = `<div class="rv-home-body">
      <div class="rv-ring done" style="--p:100"><b>✓</b><span>done</span></div>
      <div class="rv-home-text"><span class="rv-kicker">Today's review</span>
        <h3>All caught up</h3><p>${nxt}</p></div>
      <div class="rv-home-actions"><button class="rv-btn" data-rv="go" data-p="review">Open review</button></div></div>`;
  }
  box.innerHTML = html;
  box.dataset.ready = "1";
}

// ------------------------------------------------------------ Review page
export function renderStudyReview() {
  const page = $("review-body");
  if (!page) return;
  const r = computeReview();
  renderHomeReview();

  const levelText = {
    new: "Start with one opening line. Learn it, train it, and it shows up here at the right time.",
    beginner:
      "Short sessions, quick repeats. Little and often beats a long cram.",
    intermediate:
      "Your lines are spaced out by how well you played them last time.",
    advanced:
      "Full queue plus a forecast, so you can see your workload for the week.",
  }[r.level];

  const hero = r.queue.length
    ? `<div class="rv-hero"><div class="rv-hero-text"><span class="rv-kicker">Today</span>
        <h2>${r.queue.length} item${r.queue.length === 1 ? "" : "s"} · about ${r.minutes} min</h2>
        <p>${esc(levelText)}</p></div>
        <button class="rv-btn primary big" data-rv="start">Start review</button></div>`
    : r.all.length
      ? `<div class="rv-hero is-done"><div class="rv-hero-text"><span class="rv-kicker">Today</span>
        <h2>All caught up ✓</h2><p>${r.nextDue ? `Next: <strong>${esc(r.nextDue.variationName)}</strong> ${relDay(r.nextDue.dueAt)}.` : "Nothing is waiting."} ${r.doneCount ? `You reviewed ${r.doneCount} today.` : ""}</p></div></div>`
      : `<div class="rv-hero"><div class="rv-hero-text"><span class="rv-kicker">Today</span>
        <h2>Nothing to review yet</h2><p>${esc(levelText)}</p></div>
        <button class="rv-btn primary big" data-rv="go" data-p="openings">Pick an opening</button></div>`;

  const dueList = r.due.length
    ? `<h3 class="rv-h">Due now <small>${r.due.length}</small></h3><div class="rv-list">${r.due.map((i) => itemCard(i, "train")).join("")}</div>`
    : "";

  const weakList = r.weak.length
    ? `<h3 class="rv-h">Where you slip <small>${r.weak.length}</small></h3>
       <p class="rv-note">Moves you keep getting wrong. Drilling only those positions is the fastest fix; each correct answer lowers the count.</p>
       <div class="rv-list">${r.weak.map((i) => itemCard(i, "drill")).join("")}</div>`
    : r.all.some((i) => i.trained)
      ? `<h3 class="rv-h">Where you slip</h3><p class="rv-note">No repeated mistakes. Nice.</p>`
      : "";

  const max = Math.max(1, ...r.forecast.map((f) => f.n));
  const fc = r.all.length
    ? `<h3 class="rv-h">Next 7 days</h3><div class="rv-forecast">${r.forecast
        .map(
          (f, i) =>
            `<div class="rv-day${i === 0 ? " today" : ""}"><div class="rv-bar"><i style="height:${Math.round((f.n / max) * 100)}%"></i></div><b>${f.n}</b><span>${i === 0 ? "Today" : f.day.toLocaleDateString("en", { weekday: "short" })}</span></div>`,
        )
        .join("")}</div>`
    : "";

  const pz = r.puzzle
    ? `<h3 class="rv-h">Puzzle focus</h3><article class="rv-item"><div class="rv-item-main">
        <div class="rv-item-title"><strong>${esc(r.puzzle.level)} puzzles</strong></div>
        <div class="rv-item-sub"><span class="rv-reason">You solve ${Math.round(r.puzzle.rate * 100)}% of them (${r.puzzle.played} played). Try a few more.</span></div></div>
        <div class="rv-item-actions"><button class="rv-btn primary" data-rv="go" data-p="puzzles">Solve puzzles</button></div></article>`
    : "";

  page.innerHTML = hero + dueList + weakList + fc + pz;
}

// ------------------------------------------------------------ session
let session = null; // { queue, i, finished }

function bar() {
  let el = $("review-session");
  if (!el) {
    el = document.createElement("div");
    el.id = "review-session";
    el.className = "rv-session";
    el.hidden = true;
    document.body.appendChild(el);
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-s]");
      if (!b) return;
      const a = b.dataset.s;
      if (a === "next") advance();
      else if (a === "skip") advance(true);
      else if (a === "end") endSession(false);
    });
  }
  return el;
}

function drawBar() {
  const el = bar();
  if (!session) {
    el.hidden = true;
    return;
  }
  const cur = session.queue[session.i];
  const last = session.i >= session.queue.length - 1;
  const n = session.queue.length;
  el.hidden = false;
  el.classList.toggle("is-done", session.finished);
  el.innerHTML = `<div class="rv-session-info">
      <span class="rv-session-step">Review ${session.i + 1}/${n}</span>
      <strong>${esc(cur.variationName)}</strong>
      <small>${session.finished ? (last ? "Great, that was the last one!" : "Done! Ready for the next one?") : cur.mode === "drill" ? "Drilling your weak moves" : "Play the line from memory"}</small></div>
    <div class="rv-session-actions">
      ${session.finished ? "" : '<button data-s="skip" class="rv-btn">Skip</button>'}
      <button data-s="next" class="rv-btn primary${session.finished ? " pulse" : ""}">${last ? "Finish" : "Next"}</button>
      <button data-s="end" class="rv-btn ghost" aria-label="End review">✕</button></div>`;
}

function openCurrent() {
  const cur = session.queue[session.i];
  const ok = api.open(cur, cur.mode);
  if (!ok) return advance(true); // line no longer exists in the library
  session.finished = false;
  drawBar();
}

function startSession(queue) {
  if (!queue?.length) return;
  session = { queue, i: 0, finished: false };
  openCurrent();
}

function advance() {
  if (!session) return;
  if (session.i >= session.queue.length - 1) return endSession(true);
  session.i++;
  openCurrent();
}

function endSession(completed) {
  const n = session?.doneN || 0;
  session = null;
  drawBar();
  if (completed && n) {
    try {
      confetti({ count: 70 });
    } catch {}
    toast({
      title: "Review complete",
      text: `${n} item${n === 1 ? "" : "s"} locked in. See you tomorrow!`,
      kind: "badge",
      icon: "✓",
    });
  }
  api.go("review");
  renderStudyReview();
}

// main.js fires this when a Train run (or a weak-move drill) is finished
window.addEventListener("cxess:train-finished", (e) => {
  const d = e.detail || {};
  const key = `${d.oid}/${d.vid}`;
  markDone(key);
  if (session && session.queue[session.i]?.key === key && !session.finished) {
    session.finished = true;
    session.doneN = (session.doneN || 0) + 1;
    drawBar();
  }
  renderHomeReview();
  const pg = $("review");
  if (pg && !pg.hidden) renderStudyReview();
});

// ------------------------------------------------------------ wiring
function onClick(e) {
  const b = e.target.closest("[data-rv]");
  if (!b) return;
  const a = b.dataset.rv;
  if (a === "go") return api.go(b.dataset.p);
  if (a === "start") return startSession(computeReview().queue);
  const item = computeReview().all.find((i) => i.key === b.dataset.k);
  if (!item) return;
  if (a === "train" || a === "learn") {
    session = null;
    drawBar();
    api.open(item, a);
  } else if (a === "drill") {
    session = null;
    drawBar();
    api.open({ ...item }, "drill");
  }
}

export function initStudyReview(callbacks) {
  api = { ...api, ...callbacks };
  document.addEventListener("click", onClick);
  window.addEventListener("cxess:progress", () => renderHomeReview());
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) renderHomeReview();
  });
  renderHomeReview();
}
