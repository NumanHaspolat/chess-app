# CXess — Chess Application
**Construction / Build Documentation**

Project: CXess (also referenced internally as "Azurite")
Location: `C:\Users\haspo\OneDrive\Masaüstü\All Projects\chess app`
Branch: `main`
Status: Built and functional (single-page web application)
Date: 2026-11-24

---

## 1. Project Overview

CXess is a full-featured chess training and analysis web application. It lets users play against a Stockfish-powered computer opponent, import and analyse their own games (from Chess.com, Lichess, or PGN upload), solve tactics puzzles with rating and streak tracking, build and drill opening repertoires using spaced repetition, and track progress through levels, XP, and achievements.

The app is a **client-side single-page application** (vanilla JavaScript, HTML, CSS) with a Stockfish Web Worker for engine analysis, a service worker for offline use, and localStorage persistence. It can be installed as a PWA (Progressive Web App) and works offline.

---

## 2. Structure — "The Foundation"

### Entry point
| File | Role |
|------|------|
| `index.html` | Single HTML shell containing every page/section (Play, Vs Computer, Analyse, Puzzles, Openings, My Repertoire, Profile) plus modals and overlays |
| `style.css` | All styling — teal/blue theme, "Tiny5 Duo" pixel font, responsive layout, board square rendering |
| `main.js` | Application core (~8,600 lines) — board rendering, move input, engine communication, game review, puzzle/bot/repertoire controllers |
| `manifest.webmanifest` | PWA manifest (installable app, offline icon set) |
| `sw.js` | Service worker (`cxess-v4`) — caches the app shell, assets, audio, Stockfish; network-first for shell, cache-first for assets |

### Source modules (`src/`)
| Module | Purpose |
|--------|---------|
| `repertoire.js` | Repertoire graph: positions keyed by FEN (first 4 fields) so transpositions merge; edges = moves; `positionKey()` helper |
| `drill.js` | Drill logic: `judgeMove`, `pickReply`, `lineEnded`, `parseUci` |
| `pgn.js` | PGN parser/importer — handles variations `(...)`, comments `{...}`, NAGs, multi-game files |
| `openings.js` | Opening book built from Lichess opening data; position-keyed lookup and `find()` for the last named position |
| `pieces.js` | Piece element creation and preloading |
| `engine-pool.js` | Stockfish worker pool for parallel position evaluation |
| `eval-cache.js` | Cached engine reviews keyed by move list + depth |
| `library.js` | Opening/library management |
| `opening-trainer.js` | Opening training lines |
| `opening-progress.js` | Opening mastery / progress tracking |
| `bot.js` | `BotEngine` — Stockfish at configurable ELO strengths |
| `bot-book.js` | Bot opening book |
| `puzzle-openings.js` | Puzzle opening definitions |
| `profile.js` | Profile statistics, W/D/L by opening, phase accuracy, advice generation |
| `account-ui.js` | Sign-in modal (Google / email) |
| `cloud.js` | Cloud sync for repertoires, puzzles, progress |
| `toast.js` | Toast notifications |
| `progress.js` | XP, level, daily-streak tracking |
| `fx.js` | Visual effects — capture bursts, brilliant-move celebrations |
| `review.js` | Move classification: brilliant / best / great / excellent / good / inaccuracy / mistake / blunder; deep brilliant verification |
| `settings.js` | User settings — themes, board colors, sound volumes, animation, premove, engine depth |
| `srs.js` | Spaced-repetition scheduling for repertoire drills |
| `daily.js` | Daily goal and streak bookkeeping |
| `backup.js` | Backup export / restore import (JSON) |
| `arrows.js` | Arrow drawing on any board (right-click/drag PC, multi-touch mobile) |

### Assets (`assets/`)
| Folder | Contents |
|--------|----------|
| `assets/pieces/` | 12 piece PNGs (`wP`…`bK`), resized by `resize_pieces.py` onto a 147×147 transparent canvas |
| `assets/audio/` | `move.wav`, `capture.wav`, `check.wav`, `castle.wav`, `promote.wav`, `gameover.wav` |
| `assets/stockfish/` | `stockfish-19-lite-single.js` (Web Worker engine) |
| `assets/openings/` | Opening JSON files (Sicilian, Italian, French, Queen's Gambit, Indian, London, English, Ruy Lopez, Scotch, Caro-Kann) + `index.json` |
| `assets/openings.json` | Merged opening book data |
| `assets/icons/` | Favicons, touch icons, flame icon, PWA icons |
| `assets/badges/` | Move-quality badge images (brilliant, great, best, excellent, good, inaccuracy, mistake, blunder) |

### Build/helper script
| File | Purpose |
|------|---------|
| `resize_pieces.py` | Python (PIL) script that trims transparent borders from piece images, resizes each to its target size (pawns 110, knights/bishops/queens 130, rooks 125, kings 135), and centers them on a 147×147 canvas |

---

## 3. What Was Built — "The Construction"

### Phase A — Board & Play (core shell)
- 8×8 board rendered from `chess.js` positions with light/dark square coloring, coordinates, last-move highlight, check highlight, legal-move dots
- Drag-and-drop piece movement with a 4px drag threshold, piece ghost while dragging, smooth `requestAnimationFrame` slide animation on move
- Board flip, back/forward navigation (first/prev/next/last), move list with active-ply highlighting
- Move sounds matched to move type (capture, check, castle, promote, gameover, move)

### Phase B — Computer Opponent (`bot.js`, `engine-pool.js`)
- Stockfish 19 lite running in a Web Worker so the UI never freezes
- Selectable strength (ELO levels) and color (White / Black / Random)
- Opening book for the bot, hint button, takeback, resign, analysis during bot games
- Evaluation bar with score (cp or mate) and win-percentage shading

### Phase C — Game Analysis (`review.js`, `main.js`)
- PGN import from Chess.com username, Lichess username, or local PGN file upload
- Full game review at configurable engine depth (12/14/16/18)
- Every move classified: brilliant / best / great / excellent / good / inaccuracy / mistake / blunder
- Per-player accuracy %, with brilliant-move deep verification (re-evaluates sacrifices at greater depth before awarding)
- Evaluation graph (SVG) over the game, game report with per-side move-quality counts
- "YOU" badge highlighting the logged-in player's side in the report
- Cached reviews so reopening the same game doesn't re-run the engine

### Phase D — Puzzles (`puzzle-openings.js`, `daily.js`, `srs.js`)
- Tactics puzzles with difficulty tiers (Beginner 600–1000 … Expert 2200+)
- Puzzle Elo rating (Glicko-style), success rate, streaks, average time
- Daily goal (default 5/day) with streak and flame icon
- History grid of the last 10 puzzles, hint/solution/skip buttons
- Hints and mistakes tracked; streak counts only hint-free, mistake-free solves

### Phase E — Openings & Repertoire (`repertoire.js`, `opening-trainer.js`, `opening-progress.js`)
- Opening explorer: filter (all/favorites), search, sort by name / least mastered / most variations, color filter
- Opening book auto-detected from moves played (ECO + name, transposition-aware)
- Build your own repertoire as White or Black; play moves for both sides to add variations
- Repertoire editor with comments per move, delete move, save/close
- Best-move arrows from engine (1/3/5/7 lines) overlaid on the board
- Drill mode: train your repertoire with spaced repetition (SRS), correctness tracking, line-complete overlay with accuracy %

### Phase F — Profile & Account (`account-ui.js`, `cloud.js`, `profile.js`, `settings.js`)
- Sign in with Google or email/password; keeps repertoires, puzzle progress, settings synced across devices
- Profile page: Level, XP bar, puzzle rating, best Elo, streaks, achievements, opening mastery
- Settings: color themes, custom board colors (accent/light/dark), sound + background music volume, animation speed, coordinates, legal dots, last-move highlight, arrow color, premove (single/multi), default puzzle difficulty, daily goal, engine review/live depth
- Data: export/backup, import/restore, reset puzzle stats or SRS progress
- PWA install prompt ("Install Azurite as an app — works offline")

### Phase G — Polish & UX
- Home page with hero, quick-stat cards (Level, Day streak, Puzzle rating), and action cards (Vs Computer, Analyse, Puzzles, Openings, My Repertoire, Profile)
- Account modal, toast notifications, drill-complete overlays (accuracy, correct/mistake counts)
- Move-quality badges on analysed moves with image fallbacks to text symbols
- Arrow drawing on any board with modifier-key colors (Shift=red, Ctrl/Alt=blue, Shift+Ctrl=yellow)
- Responsive design with mobile board navigation and hamburger menu

---

## 4. Tech Stack — "Materials"

| Layer | Technology |
|-------|------------|
| Language | vanilla JavaScript (ES modules), HTML5, CSS3 |
| Chess logic | `chess.js@1.0.0` (via CDN) |
| Engine | Stockfish 19 lite (Web Worker) |
| Build/bundler | none (raw ES modules served over HTTP / file) |
| Styling | CSS custom properties (themes), `Tiny5 Duo` font from Google Fonts |
| Storage | `localStorage` (puzzle rating, history, settings, favorites, SRS, backup) |
| Offline/PWA | Service Worker (`sw.js`, cache `cxess-v4`), Web App Manifest |
| Networking | Fetch API (Chess.com public API, Lichess NDJSON API) |
| Audio | HTML5 `Audio` for six move sounds |
| Graphics | Canvas-free DOM board; SVG for evaluation graph and best-move arrows; PNG piece images |
| Helper | Python 3 + Pillow (`resize_pieces.py`) for asset preparation |

---

## 5. Key Design Decisions

- **Position-keyed repertoire**: repertoire nodes are keyed by the first four FEN fields (pieces, side to move, castling, en passant), not by move list. Transpositions (different move orders reaching the same position) automatically merge into one node.
- **Engine in a Worker**: Stockfish runs in a dedicated Web Worker (`stockfish-19-lite-single.js`) via `engine-pool.js`, keeping the main thread free for rendering and input.
- **No build step**: The app is raw ES modules; it opens directly in a browser or via any static server, and the service worker makes it installable and offline-capable.
- **Client-first persistence**: Everything (settings, progress, repertoires, puzzle stats) lives in `localStorage` by default; account/cloud sync is optional layered on top.
- **Brilliant-move verification**: shallow engine review never awards "brilliant" directly — candidate sacrifices are re-evaluated at greater depth (`review depth + 5`, capped at 19) before the badge is granted.

---

## 6. How to Run

Open `index.html` in a browser, or serve the folder with any static server, e.g.:

```bash
# Python 3
python -m http.server 8000

# Node (if you have http-server)
npx http-server .

# Then visit http://localhost:8000
```

For full engine analysis, the browser must allow Web Workers and same-origin fetching of `assets/stockfish/stockfish-19-lite-single.js` (serving over HTTP rather than `file://` is recommended).

---

## 7. Current State

- Branch: `main`
- Recent commits are tagged with `#` and `@` markers (see `git log`)
- The `.claude/` directory contains Claude Code settings (`settings.local.json` with a local Anthropic-compatible endpoint)
- No `package.json`, no npm dependencies — zero-install frontend project

---

*Document generated as a construction record of the CXess chess application. This file lives alongside the source in the project root.*