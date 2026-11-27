// Feel-good extras: Home page widgets, the Profile hero card and the Easter eggs.
// main.js calls initExtras({ daily, rating }) once and renderHomeExtras() /
// renderProfileHero() when those pages open. Both also refresh by themselves after
// any progress change ("cxess:progress" event).
import { snapshot, track } from "./progress.js";
import { sparkleAt, confetti } from "./fx.js";
import { initDelight } from "./delight.js";

let provider = {
  daily: () => ({ streak: 0, today: 0, goal: 5 }),
  rating: () => 1500,
};

const $ = (id) => document.getElementById(id);
const esc = (t) =>
  String(t).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

function signedIn() {
  const el = $("account-signed-in");
  return !!el && !el.hidden;
}

function playerName(full = false) {
  const n = $("account-name")?.textContent?.trim();
  if (signedIn() && n) return full ? n : n.split(" ")[0];
  return "";
}

// ---------------------------------------------------------------- home
const TIPS = [
  "Control the center with pawns and pieces early. Most strong openings start from that idea.",
  "Before every move ask: what does my opponent threaten now?",
  "Knights on the rim are dim. A knight in the center sees up to eight squares.",
  "Rooks belong on open files. Look for the file with no pawns on it.",
  "Don't move the same piece twice in the opening without a good reason.",
  "In endgames the king becomes a fighting piece. Bring it to the center.",
  "A pinned piece is a weak piece. Look for pins before you look for forks.",
  "The bishop pair is worth about half a pawn extra in open positions.",
  "Castle early. A king in the center is a target.",
  "When you are ahead in material, trade pieces. When behind, keep them.",
  "Passed pawns must be pushed, so stop them early or support them.",
  "Every puzzle you solve trains pattern recognition. Ten a day beats a hundred on Sunday.",
  "A good move is often the one that improves your worst-placed piece.",
  "Take your time on the move after a trade; that is where blunders hide.",
  "Writing down why you lost is worth more than playing another game right away.",
  "The first chess computer program was written in 1951, long before most of us existed.",
  "A chess game can last at most 5,898 moves under the modern rules. We hope you won't need them.",
  "The longest possible chess game has more possibilities than atoms in the observable universe. Almost.",
  "Mistakes are not failures. Every master has played thousands of them.",
];

const QUOTES = [
  ["Every chess master was once a beginner.", "Irving Chernev"],
  [
    "Tactics is knowing what to do when there is something to do. Strategy is knowing what to do when there is nothing to do.",
    "Savielly Tartakower",
  ],
  ["The pawns are the soul of chess.", "François-André Philidor"],
  ["When you see a good move, look for a better one.", "Emanuel Lasker"],
  [
    "Chess is a sea in which a gnat may drink and an elephant may bathe.",
    "Indian proverb",
  ],
  [
    "Play the opening like a book, the middle game like a magician, and the endgame like a machine.",
    "Rudolf Spielmann",
  ],
  ["Chess is everything: art, science and sport.", "Anatoly Karpov"],
  ["Help your pieces so they can help you.", "Paul Morphy"],
  ["It is enough to play better than your opponent.", "Siegbert Tarrasch"],
  ["The hardest game to win is a won game.", "Emanuel Lasker"],
  [
    "Only the player with the initiative has the right to attack.",
    "Wilhelm Steinitz",
  ],
  ["Strategy requires thought, tactics require observation.", "Max Euwe"],
  [
    "The winner of the game is the player who makes the next-to-last mistake.",
    "Savielly Tartakower",
  ],
  [
    "The blunders are all there on the board, waiting to be made.",
    "Savielly Tartakower",
  ],
  ["I don't believe in psychology. I believe in good moves.", "Bobby Fischer"],
  [
    "Chess teaches you to think objectively when you are in trouble.",
    "Stanley Kubrick",
  ],
  ["A bad plan is better than none at all.", "Frank Marshall"],
  ["Chess is the gymnasium of the mind.", "Blaise Pascal"],
  [
    "The beauty of a move lies not in its appearance but in the thought behind it.",
    "Aaron Nimzowitsch",
  ],
  [
    "Losing can persuade you to change what doesn't need to be changed.",
    "Garry Kasparov",
  ],
];

function greeting() {
  const now = new Date();
  const h = now.getHours();
  const dow = now.getDay(); // 0 = Sunday
  const seed = now.getFullYear() * 400 + now.getMonth() * 32 + now.getDate();
  const pickBy = (arr) => arr[seed % arr.length];
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  if (h < 5)
    return pickBy(["Still up?", "Night owl mode", "Burning the midnight oil?"]);
  if (h < 8) return pickBy(["Early bird!", "Good morning", "Rise and shine"]);
  if (h < 12) {
    if (dow === 1) return "Good morning, fresh week";
    return pickBy(["Good morning", "Morning", `Happy ${days[dow]}`]);
  }
  if (h < 14) return pickBy(["Good afternoon", "Lunch break game?", "Hello"]);
  if (h < 18) {
    if (dow === 5) return "Happy Friday";
    if (dow === 0 || dow === 6) return `Happy ${days[dow]}`;
    return pickBy(["Good afternoon", "Afternoon", "Hey there"]);
  }
  if (h < 22) return pickBy(["Good evening", "Evening", "Welcome back"]);
  return pickBy(["Late session?", "Good night soon?", "Quiet hours"]);
}

// A time-of-day note that can replace the usual message (or null)
function timeNote() {
  const h = new Date().getHours();
  if (h < 5) return "Sleep sharpens tactics too. One more puzzle, then rest.";
  if (h >= 23) return "Wind down with one calm puzzle before bed.";
  if (h < 8) return "A quiet morning is perfect for deep calculation.";
  return null;
}

function dayOfYear() {
  const d = new Date();
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
}

function ring(pct, label, sub) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, pct));
  return `<svg viewBox="0 0 80 80" class="ring" role="img" aria-label="${esc(label)}">
    <circle cx="40" cy="40" r="${r}" class="ring-bg"/>
    <circle cx="40" cy="40" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${off}"/>
    <text x="40" y="46" text-anchor="middle" class="ring-t">${esc(sub)}</text></svg>`;
}

export function renderHomeExtras() {
  const box = $("home-extra");
  const greet = $("home-greeting");
  if (!box && !greet) return;
  const sn = snapshot();
  const d = provider.daily();
  const name = playerName();

  if (greet) {
    let msg;
    if (!sn.counts.solved && !sn.counts.reviews && !sn.counts.botGames)
      msg = "Welcome! Start with a puzzle. It only takes a minute.";
    else if (d.today >= d.goal) msg = "Daily goal done. That's how it's done!";
    else if (d.streak > 0)
      msg = `Keep your ${d.streak}-day streak alive. ${Math.max(0, d.goal - d.today)} puzzle${d.goal - d.today === 1 ? "" : "s"} to go.`;
    else msg = "A fresh start today. One puzzle is enough to begin a streak.";
    const tn = timeNote();
    if (tn && sn.counts.solved) msg = tn;
    greet.innerHTML = `<strong>${esc(greeting())}${name ? `, ${esc(name)}` : ""}!</strong> <span>${esc(msg)}</span>`;
  }
  if (!box) return;

  const pct = d.goal ? d.today / d.goal : 0;
  const tip = TIPS[dayOfYear() % TIPS.length];
  const recent = sn.earned.slice(0, 5);
  const badges = recent.length
    ? recent
        .map(
          (b) =>
            `<li title="${esc(b.name)}: ${esc(b.desc)}"><span class="hb-g">${esc(b.glyph)}</span><span>${esc(b.name)}</span></li>`,
        )
        .join("")
    : `<li class="empty">Your first achievement is one puzzle away.</li>`;

  const [quote, author] = QUOTES[(dayOfYear() * 3 + 1) % QUOTES.length];
  const cards = [
    `<div class="hx-card hx-goal">
      ${ring(pct, "Daily goal", `${Math.min(d.today, d.goal)}/${d.goal}`)}
      <div>
        <h3>Daily goal</h3>
        <p>${d.today >= d.goal ? "Complete. Enjoy the rest of your day." : `${d.goal - d.today} more to reach today's goal.`}</p>
        <p class="hx-flame">${d.streak > 0 ? `<b>${d.streak}</b> day streak` : "No streak yet. Today is a good day."}</p>
      </div>
    </div>`,
    `<div class="hx-card hx-ach">
      <h3>Achievements <small>${sn.earned.length} / ${sn.total}${sn.secrets ? ` · ${sn.secrets} secret${sn.secrets > 1 ? "s" : ""}` : ""}</small></h3>
      <ul class="hx-badges">${badges}</ul>
      <button type="button" class="hx-link" data-go="profile" data-tab="achievements">See all</button>
    </div>`,
    `<div class="hx-card hx-tip">
      <h3>Tip of the day</h3>
      <p>${esc(tip)}</p>
      <blockquote class="hx-quote">
        <p>“${esc(quote)}”</p>
        <cite>${esc(author)}</cite>
      </blockquote>
    </div>`,
  ];

  // First render builds the cards. Later renders (progress events, cloud sync)
  // only swap the cards whose content really changed, and without replaying
  // the entrance animation, so nothing "pops in again" after the page loaded.
  const prev = box._cards;
  if (!prev || box.children.length !== cards.length) {
    const wasSkel = box.classList.contains("is-skel");
    box.innerHTML = cards.join("");
    if (wasSkel) {
      // skeleton was already on screen: swap in place, no second entrance
      box.classList.remove("is-skel");
      box.removeAttribute("aria-busy");
      [...box.children].forEach((c) => c.classList.add("hx-noanim"));
    }
    box._cards = cards;
    return;
  }
  cards.forEach((html, i) => {
    if (html === prev[i]) return;
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    const el = t.content.firstChild;
    el.classList.add("hx-noanim");
    box.replaceChild(el, box.children[i]);
  });
  box._cards = cards;
}

// ------------------------------------------------------------- profile
export function renderProfileHero() {
  const box = $("profile-hero");
  if (!box) return;
  const sn = snapshot();
  const c = sn.counts;
  const name = playerName(true) || "Player";
  const email = signedIn() ? $("account-email-label")?.textContent?.trim() : "";
  const chips = [
    [c.solved || 0, "Puzzles solved"],
    [provider.daily().streak || 0, "Day streak"],
    [provider.rating(), "Puzzle rating"],
    [c.brilliant || 0, "Brilliants"],
    [c.botWins || 0, "Wins vs computer"],
    [c.reviews || 0, "Games reviewed"],
  ];
  const showcase = sn.earned
    .slice(0, 8)
    .map(
      (b) => `<li title="${esc(b.name)}: ${esc(b.desc)}">${esc(b.glyph)}</li>`,
    )
    .join("");
  box.innerHTML = `
    ${signedIn() ? `<button type="button" class="ph-signout">Sign out</button>` : ""}
    <div class="ph-top">
      <div class="ph-avatar" style="--p:${sn.pct.toFixed(1)}%"><span>${esc(sn.title.glyph)}</span><em>${sn.level}</em></div>
      <div class="ph-main">
        <h2>${esc(name)}</h2>
        ${email ? `<div class="ph-email">${esc(email)}</div>` : ""}
        <div class="ph-title">${esc(sn.title.name)} · Level ${sn.level}</div>
        <div class="ph-xp"><div style="width:${sn.pct.toFixed(1)}%"></div></div>
        <small>${sn.xp} / ${sn.next} XP</small>
      </div>
    </div>
    <ul class="ph-chips">${chips.map(([v, l]) => `<li><strong>${esc(v)}</strong><span>${esc(l)}</span></li>`).join("")}</ul>
    ${showcase ? `<div class="ph-show"><span>Latest achievements</span><ul>${showcase}</ul></div>` : ""}`;
}

// ---------------------------------------------------------------- eggs
const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
const WORDS = { magnus: "magnus", checkmate: "mate", mate: "mate" };

function initEggs() {
  let kpos = 0;
  let typed = "";
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (
      t &&
      (t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT" ||
        t.isContentEditable)
    )
      return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kpos = k === KONAMI[kpos] ? kpos + 1 : k === KONAMI[0] ? 1 : 0;
    if (kpos === KONAMI.length) {
      kpos = 0;
      confetti({ count: 80 });
      track("egg", { id: "konami" });
    }
    if (e.key.length === 1) {
      typed = (typed + k).slice(-12);
      for (const [w, id] of Object.entries(WORDS))
        if (typed.endsWith(w)) track("egg", { id });
    }
  });

  // logo: 7 quick clicks
  let clicks = [];
  document.querySelector(".nav-brand")?.addEventListener("click", () => {
    const now = Date.now();
    clicks = clicks.filter((t) => now - t < 3000).concat(now);
    if (clicks.length >= 7) {
      clicks = [];
      track("egg", { id: "brand" });
    }
  });

  // home pieces
  let pokes = 0;
  document.querySelectorAll(".home-piece").forEach((el) => {
    el.addEventListener("click", (e) => {
      const r = el.getBoundingClientRect();
      sparkleAt(r.left + r.width / 2, r.top + r.height / 2, 12);
      el.animate(
        [
          { transform: "translateY(0) scale(1)" },
          { transform: "translateY(-22px) scale(1.18) rotate(-6deg)" },
          { transform: "translateY(0) scale(1)" },
        ],
        { duration: 380, easing: "cubic-bezier(.2,.9,.3,1.3)" },
      );
      if (++pokes >= 10) {
        pokes = -9999;
        track("egg", { id: "pieces" });
      }
      e.stopPropagation();
    });
  });

  // style / backup / sign-in
  for (const id of ["theme-swatches", "board-swatches"])
    $(id)?.addEventListener("click", (e) => {
      if (e.target.closest("button")) track("egg", { id: "style" });
    });
  $("setting-accent")?.addEventListener("input", () =>
    track("egg", { id: "style" }),
  );
  $("btn-export-backup")?.addEventListener("click", () =>
    track("egg", { id: "safe" }),
  );
  const si = $("account-signed-in");
  if (si) {
    const check = () => {
      if (!si.hidden) track("egg", { id: "cloud" });
      renderProfileHero();
      renderHomeExtras();
    };
    new MutationObserver(check).observe(si, {
      attributes: true,
      attributeFilter: ["hidden"],
    });
    for (const id of ["account-name", "account-email-label"]) {
      const el = $(id);
      if (el)
        new MutationObserver(() => {
          renderProfileHero();
          renderHomeExtras();
        }).observe(el, { childList: true, characterData: true, subtree: true });
    }
    check();
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest?.(".ph-signout")) $("account-signout")?.click();
  });

  // data-go buttons created by renderHomeExtras (event delegation)
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.(".hx-link[data-go]");
    if (!b) return;
    document.querySelector(`.nav-link[href="#${b.dataset.go}"]`)?.click();
    if (b.dataset.tab)
      setTimeout(
        () =>
          document
            .querySelector(`.profile-tab[data-tab="${b.dataset.tab}"]`)
            ?.click(),
        30,
      );
  });
}

export function initExtras(p = {}) {
  provider = { ...provider, ...p };
  initEggs();
  window.addEventListener("cxess:progress", () => {
    renderHomeExtras();
    renderProfileHero();
  });
  initDelight({ daily: () => provider.daily() });
  track("visit");
  renderHomeExtras();
  renderProfileHero();
}
