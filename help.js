// In-app guide: one (i) button in the navbar opens a popup that explains every page and
// feature, starting on the topic of the page you are on. All content lives in TOPICS below.
const TOPICS = [
  {
    id: "home",
    title: "Welcome to Chexel",
    lead: "Chexel is a chess training site: solve puzzles, analyse your own games with Stockfish, learn opening lines and drill them until they are automatic.",
    items: [
      [
        "Home",
        "Your level and XP, day streak, daily goal and puzzle rating at a glance, plus today's review, a tip and your achievements.",
      ],
      [
        "Level & XP",
        "Almost everything you do (puzzles, drills, lines, games) earns XP. Levels and achievements are shown on Home and in your Profile.",
      ],
      [
        "Daily goal",
        "A small target of puzzles per day. Reaching it keeps your day streak alive. Change it in Profile → Settings.",
      ],
      [
        "Today's review",
        "Chexel tells you which opening lines are due for repetition today and which moves you keep getting wrong. See the Review topic.",
      ],
      [
        "Account",
        "Everything works without an account and is stored on this device. Sign in (top of the Profile page) to sync progress between devices.",
      ],
      [
        "Feedback",
        "Found a bug or have an idea? Use the Give feedback button. It goes straight to the developer.",
      ],
    ],
  },
  {
    id: "board",
    title: "Using the board",
    lead: "The same board controls work on Play, Vs Computer, Puzzles, Learn/Train and My Repertoire.",
    items: [
      [
        "Move a piece",
        "Drag it, or tap the piece and then the target square. Small dots show the legal moves (you can turn them off in Settings).",
      ],
      [
        "Arrows & circles on a computer",
        "Hold the RIGHT mouse button and drag from one square to another to draw an arrow. Right-click a single square to draw a circle. Add Shift for red, Ctrl or Alt for blue, Shift+Ctrl for yellow. Draw the same arrow again to remove it.",
      ],
      [
        "Arrows & circles on a phone",
        "Press and hold the board with one finger, then draw the arrow or circle with a second finger. Lift both fingers to finish.",
      ],
      [
        "Clear your drawings",
        "A normal click or tap on the board, or any move, clears them.",
      ],
      [
        "Swipe through moves (phone)",
        "Swipe left on the board to go to the next move and swipe right to go back. Start the swipe on an empty square, not on a piece, so it is not mistaken for a move.",
      ],
      [
        "Move buttons & keyboard",
        "« ‹ › » under the board jump to the start, back, forward and the end. On a computer the arrow keys do the same: ← → step, ↑ or Home go to the start, ↓ or End to the end.",
      ],
      [
        "Premoves",
        "While it is the opponent's turn you can already make your next move. It plays automatically the moment it is your turn. Works in Vs Computer, Train, drills and puzzles. Turn it on in Settings, and optionally allow several premoves in a row.",
      ],
      [
        "Promotion",
        "A pawn promotes to a queen by default. Turn on Choose promotion piece in Settings to pick the piece yourself.",
      ],
      [
        "Flip & Reset",
        "Flip turns the board around. Reset puts the pieces back at the start.",
      ],
    ],
  },
  {
    id: "play",
    title: "Play (free board)",
    lead: "A free board where you can set up and explore positions with live engine help.",
    items: [
      ["Both sides", "Move pieces for White and Black to explore any idea."],
      [
        "Analysis panel",
        "Stockfish evaluates the position and lists its best lines. Choose how many lines to show as arrows (1, 3, 5 or 7) or switch arrows off.",
      ],
      [
        "Opening name",
        "The opening you are in is named automatically as you play it.",
      ],
      [
        "Move list",
        "Click any move to jump to that position. Back takes a move back, Reset starts again.",
      ],
    ],
  },
  {
    id: "bot",
    title: "Vs Computer",
    lead: "Play a full game against Stockfish at the strength you choose.",
    items: [
      [
        "Set up",
        "Pick the strength, your colour (White, Black or Random) and optionally an opening for Stockfish to play. Press Start game.",
      ],
      ["Hint", "Shows a good move when you are stuck."],
      ["Takeback", "Undo your last move if you slipped."],
      ["Resign", "End the game. A result card appears when the game is over."],
      [
        "Premoves",
        "Queue your next move during the engine's turn (enable in Settings).",
      ],
      [
        "After the game",
        "Send the game to Analyse to see where it was decided.",
      ],
    ],
  },
  {
    id: "analyse",
    title: "Analyse your games",
    lead: "Import your real games and let Stockfish show what happened.",
    items: [
      [
        "Import",
        "Choose Chess.com or Lichess, type your username and press Fetch games, or upload a PGN file.",
      ],
      [
        "How many games",
        "Choose Stats only (fast) or run the engine on your last 10, 20 or 30 games.",
      ],
      [
        "Game report",
        "Each game gets an accuracy score for both sides and every move is classified (for example best, good, inaccuracy, mistake, blunder, brilliant).",
      ],
      [
        "Step through",
        "Use the move list or « ‹ › » to walk through the game with the evaluation bar and engine lines.",
      ],
      [
        "Profile report",
        "After analysing several games, Profile report summarises your habits and recurring weak spots.",
      ],
      [
        "Return to game / Copy PGN",
        "Jump back to the game you were viewing, or copy its PGN to use elsewhere.",
      ],
    ],
  },
  {
    id: "puzzles",
    title: "Puzzles",
    lead: "Real tactics from Lichess, matched to your level.",
    items: [
      [
        "Difficulty",
        "Pick Beginner to Expert. Your default level can be set in Settings.",
      ],
      [
        "Filter by opening",
        "Choose an opening and variation to get puzzles from that kind of position, or leave it on Any.",
      ],
      [
        "Rating",
        "Your puzzle rating goes up when you solve a puzzle and down when you fail one.",
      ],
      [
        "Hint, Solution, Skip",
        "Hint points you toward the right move step by step. Solution plays it out. Skip loads another puzzle.",
      ],
      [
        "Streak & goal",
        "Solving without a hint builds a streak (a hint or a mistake resets it). Puzzles count toward your daily goal.",
      ],
      [
        "Auto-next",
        "Turn on Auto-load next puzzle after solving in Settings to keep a flow going.",
      ],
      [
        "History",
        "The Profile page shows your rating history, results by difficulty and a log of every puzzle.",
      ],
    ],
  },
  {
    id: "openings",
    title: "Openings: Learn & Train",
    lead: "Learn the main lines of an opening, then prove you remember them.",
    items: [
      [
        "Browse",
        "Search by name, filter by colour or favourites, and sort by name, least mastered or number of variations. Use the star to favourite an opening.",
      ],
      [
        "Learn",
        "Steps through a variation move by move with explanations. Long lines are split into parts; finish a part and lock it in before the next one opens.",
      ],
      [
        "Train",
        "Now you play the moves from memory. A wrong move shows a hint (first the piece, then the square). Mistakes are collected and you replay those positions at the end.",
      ],
      ["Parts", "You can train a single part or everything learned so far."],
      [
        "Mastery dots",
        "Five dots show how well you know a line. Five filled dots (90%+) means mastered, and the first time you get there Chexel celebrates.",
      ],
      [
        "Roadmap",
        "Your progress through an opening's variations is drawn as a path. Tap a node to open that variation.",
      ],
    ],
  },
  {
    id: "review",
    title: "Review",
    lead: "Spaced repetition for your opening lines: practise the right thing at the right time.",
    items: [
      [
        "Due now",
        "A line comes back sooner if your last run was shaky and later if it was clean. Lines you learned but never trained are due straight away.",
      ],
      [
        "Where you slip",
        "Moves you keep getting wrong. Drill only those positions; every correct answer lowers their mistake count.",
      ],
      [
        "Start review",
        "Runs through today's queue one item at a time. The bar at the bottom lets you skip, move to the next item or stop.",
      ],
      [
        "Session size",
        "Beginners get short sessions of 3, intermediate players 5 and advanced players 8, so it always feels doable.",
      ],
      ["Next 7 days", "A forecast of how many items fall due each day."],
      [
        "Puzzle focus",
        "If one puzzle difficulty is clearly your weakest, Review points you to it.",
      ],
    ],
  },
  {
    id: "repertoire",
    title: "My Repertoire",
    lead: "Build your own opening lines, then drill them until they are automatic.",
    items: [
      [
        "Create one",
        "Press the create button, give it a name, tick As Black if it is for Black, and press Start. You are now in edit mode.",
      ],
      [
        "Add moves",
        "Just play the moves on the board. Every move you play is saved automatically.",
      ],
      [
        "Make a new branch",
        "Go back with ‹ and play a different move: a new branch opens next to the old one. Nothing is overwritten, so one position can have as many replies as you like and your repertoire grows into a tree.",
      ],
      [
        "Going forward",
        "› follows your main line, which is the first move you saved in each position.",
      ],
      [
        "Transpositions",
        "If two different move orders reach the same position, Chexel treats it as one position, so you never have to enter it twice.",
      ],
      [
        "Comments",
        "Write a short note (up to 200 characters) under a move to remember why you play it. It is shown again while you drill.",
      ],
      [
        "Delete a move",
        "Delete move removes the move you are on and the moves that only follow from it. You are asked to confirm and it cannot be undone.",
      ],
      [
        "Best moves",
        "Switch on Best moves to see Stockfish's top 1, 3, 5 or 7 candidate moves as arrows while you build.",
      ],
      [
        "Finish",
        "Press Done to save. A repertoire where you entered nothing is not kept.",
      ],
      [
        "Import",
        "Load a PGN file to fill a repertoire from existing games. Several games in one file are merged into the same tree.",
      ],
      [
        "Drill",
        "Press Drill and Chexel plays the opponent while you answer from memory. A wrong move first highlights the piece to move, then the square, and after repeated mistakes shows the correct move. Use Continue to go on or Stop Drill to leave.",
      ],
      [
        "Smart review",
        "With Smart review on (Settings), positions you miss come back more often and positions you know come back less often. The opponent's replies lean toward the branches you are weakest in. Reset it in Settings → Data.",
      ],
    ],
  },
  {
    id: "profile",
    title: "Profile & settings",
    lead: "Your progress, achievements and every setting in one place.",
    items: [
      [
        "Openings tab",
        "Mastery per opening and variation, average accuracy, and your trouble spots.",
      ],
      [
        "Puzzles tab",
        "Rating history, results by difficulty and the puzzle log.",
      ],
      ["Achievements", "Badges with several tiers, each worth XP."],
      ["Appearance", "Colour theme, board colours and custom colours."],
      [
        "Sound & gameplay",
        "Sounds, animation speed, coordinates, legal-move dots, last-move highlight, arrow colour, promotion choice, premoves.",
      ],
      [
        "Engine",
        "Depth used when reviewing games: deeper is more accurate but slower.",
      ],
    ],
  },
  {
    id: "data",
    title: "Account, backup & offline",
    lead: "Your data is yours: keep it safe and take it with you.",
    items: [
      [
        "Sync",
        "Signed in? Progress is saved to your account and follows you to other devices.",
      ],
      [
        "Backup",
        "Settings → Data can export everything to a file and restore it later. Do this before clearing browser data.",
      ],
      [
        "Install as an app",
        "Use Install in Settings → Data (or your browser's Install option) to add Chexel to your home screen. It works offline.",
      ],
      [
        "Resets",
        "You can reset spaced-repetition progress and puzzle rating/stats separately. These cannot be undone.",
      ],
    ],
  },
];

const PAGE_TOPIC = {
  home: "home",
  play: "play",
  bot: "bot",
  analyse: "analyse",
  puzzles: "puzzles",
  openings: "openings",
  repertoire: "repertoire",
  review: "review",
  profile: "profile",
};

const esc = (t) =>
  String(t).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

let overlay = null;
let currentPage = "home";
let lastFocus = null;

function topicForNow(getContext) {
  const ctx = getContext?.() || {};
  if (ctx.learning) return "openings";
  return PAGE_TOPIC[currentPage] || "home";
}

function build() {
  overlay = document.createElement("div");
  overlay.className = "hp-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `<div class="hp-card" role="dialog" aria-modal="true" aria-label="Chexel guide">
      <header class="hp-head"><h2>Guide</h2><button type="button" class="hp-x" aria-label="Close">✕</button></header>
      <div class="hp-body">
        <nav class="hp-nav" aria-label="Guide topics">${TOPICS.map(
          (t) =>
            `<button type="button" data-t="${t.id}">${esc(t.title)}</button>`,
        ).join("")}</nav>
        <article class="hp-content" tabindex="-1"></article>
      </div></div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest(".hp-x")) return close();
    const b = e.target.closest("[data-t]");
    if (b) select(b.dataset.t);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });
}

function select(id) {
  const t = TOPICS.find((x) => x.id === id) || TOPICS[0];
  overlay.querySelectorAll(".hp-nav button").forEach((b) => {
    const on = b.dataset.t === t.id;
    b.classList.toggle("on", on);
    b.setAttribute("aria-current", on ? "true" : "false");
    if (on) b.scrollIntoView({ block: "nearest", inline: "center" });
  });
  const c = overlay.querySelector(".hp-content");
  c.innerHTML = `<h3>${esc(t.title)}</h3><p class="hp-lead">${esc(t.lead)}</p>
    <dl>${t.items.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
  c.scrollTop = 0;
}

export function openHelp(topic, getContext) {
  if (!overlay) build();
  lastFocus = document.activeElement;
  select(topic || topicForNow(getContext));
  overlay.hidden = false;
  document.body.classList.add("hp-open");
  overlay.querySelector(".hp-x").focus();
}

function close() {
  overlay.hidden = true;
  document.body.classList.remove("hp-open");
  lastFocus?.focus?.();
}

export function setHelpPage(name) {
  currentPage = name;
}

// getContext() -> { learning: boolean } lets main.js say "we are inside Learn/Train"
export function initHelp(getContext) {
  const header = document.querySelector(".navbar");
  if (header && !document.getElementById("nav-help")) {
    const b = document.createElement("button");
    b.type = "button";
    b.id = "nav-help";
    b.className = "nav-help";
    b.title = "Guide: how everything works";
    b.setAttribute("aria-label", "Open guide");
    b.textContent = "i";
    const toggle = header.querySelector(".menu-toggle");
    header.insertBefore(b, toggle || null);
  }
  const guide = document.querySelector(".home-actions");
  if (guide && !guide.querySelector(".home-guide")) {
    const g = document.createElement("button");
    g.type = "button";
    g.className = "home-guide";
    g.textContent = "ⓘ How Chexel works";
    guide.appendChild(g);
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("#nav-help")) openHelp(null, getContext);
    else if (e.target.closest(".home-guide")) openHelp("home", getContext);
    else if (e.target.closest("[data-help]"))
      openHelp(e.target.closest("[data-help]").dataset.help, getContext);
  });
}
