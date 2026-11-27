// "Give feedback" button + popup. Messages are stored in Firestore (collection "feedback").
// Reuses the Firebase app the account system already created; falls back to e-mail if needed.
import {
  getApps,
  getApp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const FALLBACK_EMAIL = ""; // optional: your address, used if Firebase is not reachable
const MAX = 1000;
const COOLDOWN_MS = 60_000;
const CATS = [
  ["bug", "Bug"],
  ["idea", "Idea"],
  ["love", "Love it"],
  ["other", "Other"],
];

const css = `
.fb-fab{position:fixed;right:18px;bottom:18px;z-index:900;padding:9px 14px;border-radius:999px;background:color-mix(in srgb,var(--panel) 88%,transparent);border:1px solid color-mix(in srgb,var(--accent-strong) 45%,var(--panel-border));color:var(--accent-strong);box-shadow:0 8px 22px rgba(0,0,0,.35);backdrop-filter:blur(10px);font-size:.9rem}
.fb-fab:hover{background:var(--control-hover);transform:translateY(-2px)}
@media (max-width:920px){.fb-fab{display:none}}
.fb-link{background:none;border:none;padding:0 2px;color:var(--accent-strong);font-size:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.fb-link:hover{background:none;color:var(--text)}
.fb-overlay{position:fixed;inset:0;z-index:10010;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.62);animation:fbFade .2s ease-out}
.fb-overlay[hidden]{display:none}
.fb-card{position:relative;width:100%;max-width:440px;padding:24px 22px 20px;background:var(--panel);color:var(--text);border:1px solid color-mix(in srgb,var(--accent-strong) 35%,var(--panel-border));border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.5);animation:fbPop .28s cubic-bezier(.2,.8,.2,1)}
.fb-card h2{margin:0 0 4px;color:var(--accent-strong);font-size:1.3rem}
.fb-sub{margin:0 0 14px;color:var(--text-muted);font-size:.9rem;line-height:1.45}
.fb-x{position:absolute;top:10px;right:10px;width:32px;height:32px;padding:0;border:none;background:none;font-size:1.4rem;line-height:1;color:var(--text-muted)}
.fb-x:hover{background:none;color:var(--text)}
.fb-cats{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.fb-cats button{padding:6px 12px;border-radius:999px;font-size:.85rem}
.fb-cats button.on{background:var(--accent-strong);color:var(--bg);border-color:var(--accent-strong);font-weight:700}
.fb-card textarea,.fb-card input[type=email]{width:100%;padding:10px 12px;border:1px solid var(--panel-border);border-radius:8px;background:var(--control);color:var(--text);font-family:var(--font-pixel);font-size:.95rem}
.fb-card textarea{min-height:120px;resize:vertical}
.fb-card textarea:focus,.fb-card input:focus{outline:none;border-color:var(--accent-strong)}
.fb-meta{display:flex;justify-content:space-between;margin:6px 2px 10px;color:var(--text-muted);font-size:.78rem}
.fb-meta .warn{color:#ff9d9d}
.fb-card input[type=email]{margin-bottom:12px}
.fb-hp{position:absolute;left:-9999px;opacity:0;height:0;width:0}
.fb-actions{display:flex;gap:8px}
.fb-actions button{flex:1;padding:11px}
.fb-send{background:var(--accent-strong);color:var(--bg);border-color:var(--accent-strong);font-weight:700}
.fb-send:hover{background:var(--accent)}
.fb-err{min-height:1.2em;margin:8px 0 0;color:#ff9d9d;font-size:.85rem}
.fb-done{text-align:center;padding:14px 0 6px}
.fb-done .tick{width:60px;height:60px;margin:0 auto 12px;border-radius:50%;display:grid;place-items:center;font-size:1.9rem;color:var(--bg);background:var(--accent-strong);animation:fbTick .45s cubic-bezier(.2,.9,.3,1.4)}
.fb-done p{margin:0 0 16px;color:var(--text-muted)}
@keyframes fbFade{from{opacity:0}to{opacity:1}}
@keyframes fbPop{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
@keyframes fbTick{from{transform:scale(.3);opacity:0}to{transform:scale(1);opacity:1}}
@media (prefers-reduced-motion:reduce){.fb-overlay,.fb-card,.fb-done .tick{animation:none}}
`;

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

function currentUser() {
  try {
    return getApps().length ? getAuth(getApp()).currentUser : null;
  } catch {
    return null;
  }
}

async function send(payload) {
  if (!getApps().length) throw new Error("no-firebase");
  const db = getFirestore(getApp());
  await addDoc(collection(db, "feedback"), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

function init() {
  if (window.__feedbackInit) return;
  window.__feedbackInit = true;

  document.head.appendChild(el(`<style>${css}</style>`));

  const overlay = el(`
    <div class="fb-overlay" hidden>
      <div class="fb-card" role="dialog" aria-modal="true" aria-labelledby="fb-title">
        <button type="button" class="fb-x" aria-label="Close">×</button>
        <div class="fb-form">
          <h2 id="fb-title">Give feedback</h2>
          <p class="fb-sub">Found a bug, missing something, or just want to say hi? I read every message.</p>
          <div class="fb-cats">${CATS.map(([v, l], i) => `<button type="button" data-cat="${v}" class="${i === 1 ? "on" : ""}">${l}</button>`).join("")}</div>
          <textarea maxlength="${MAX}" placeholder="What's on your mind?" aria-label="Your feedback"></textarea>
          <div class="fb-meta"><span>Be as specific as you like</span><span class="fb-count">0 / ${MAX}</span></div>
          <input type="email" placeholder="E-mail (optional, if you want a reply)" aria-label="E-mail (optional)" autocomplete="email" />
          <input class="fb-hp" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" />
          <div class="fb-actions">
            <button type="button" class="fb-cancel">Cancel</button>
            <button type="button" class="fb-send">Send</button>
          </div>
          <p class="fb-err" role="alert"></p>
        </div>
        <div class="fb-done" hidden>
          <div class="tick">✓</div>
          <h2>Thank you!</h2>
          <p>Your feedback helps make Chexel better.</p>
          <button type="button" class="fb-close">Close</button>
        </div>
      </div>
    </div>`);
  document.body.appendChild(overlay);

  const $ = (s) => overlay.querySelector(s);
  const ta = $("textarea");
  const emailEl = $('input[type="email"]');
  const hp = $(".fb-hp");
  const errEl = $(".fb-err");
  const sendBtn = $(".fb-send");
  const count = $(".fb-count");
  let cat = "idea";
  let lastFocus = null;

  const open = () => {
    lastFocus = document.activeElement;
    $(".fb-form").hidden = false;
    $(".fb-done").hidden = true;
    errEl.textContent = "";
    const u = currentUser();
    if (u?.email && !emailEl.value) emailEl.value = u.email;
    overlay.hidden = false;
    setTimeout(() => ta.focus(), 50);
  };
  const close = () => {
    overlay.hidden = true;
    lastFocus?.focus?.();
  };

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  $(".fb-x").addEventListener("click", close);
  $(".fb-cancel").addEventListener("click", close);
  $(".fb-close").addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });
  overlay.querySelectorAll("[data-cat]").forEach((b) =>
    b.addEventListener("click", () => {
      cat = b.dataset.cat;
      overlay
        .querySelectorAll("[data-cat]")
        .forEach((x) => x.classList.toggle("on", x === b));
    }),
  );
  ta.addEventListener("input", () => {
    count.textContent = `${ta.value.length} / ${MAX}`;
    count.classList.toggle("warn", ta.value.length > MAX - 50);
  });

  sendBtn.addEventListener("click", async () => {
    errEl.textContent = "";
    const message = ta.value.trim();
    if (message.length < 5) {
      errEl.textContent = "Please write a little more (at least 5 characters).";
      return;
    }
    if (hp.value) return close(); // bot
    let last = 0;
    try {
      last = Number(localStorage.getItem("chexel-feedback-last") || 0);
    } catch {}
    if (Date.now() - last < COOLDOWN_MS) {
      errEl.textContent =
        "You just sent one. Please wait a minute before sending another.";
      return;
    }
    const u = currentUser();
    const payload = {
      message: message.slice(0, MAX),
      category: cat,
      email: emailEl.value.trim().slice(0, 120),
      uid: u?.uid || null,
      page: location.hash || "#home",
      theme: getComputedStyle(document.documentElement)
        .getPropertyValue("--accent-strong")
        .trim(),
      screen: `${innerWidth}x${innerHeight}`,
      ua: navigator.userAgent.slice(0, 200),
    };
    sendBtn.disabled = true;
    sendBtn.textContent = "Sending…";
    try {
      await send(payload);
      try {
        localStorage.setItem("chexel-feedback-last", String(Date.now()));
      } catch {}
      ta.value = "";
      count.textContent = `0 / ${MAX}`;
      $(".fb-form").hidden = true;
      $(".fb-done").hidden = false;
    } catch (e) {
      console.warn("feedback failed", e);
      errEl.innerHTML = FALLBACK_EMAIL
        ? `Couldn't send right now. <a style="color:var(--accent-strong)" href="mailto:${FALLBACK_EMAIL}?subject=Chexel%20feedback&body=${encodeURIComponent(message)}">Send by e-mail instead</a>`
        : "Couldn't send right now. Please try again in a moment.";
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "Send";
    }
  });

  // Entry points: floating pill (desktop) + footer link
  const fab = el(
    `<button type="button" class="fb-fab" aria-label="Give feedback">💬 Feedback</button>`,
  );
  fab.addEventListener("click", open);
  document.body.appendChild(fab);

  const footer = document.querySelector(".site-footer");
  if (footer) {
    const dot = el(`<span class="dot">·</span>`);
    const link = el(
      `<button type="button" class="fb-link">Give feedback</button>`,
    );
    link.addEventListener("click", open);
    footer.append(dot, link);
  }

  window.openFeedback = open;
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", init);
else init();
