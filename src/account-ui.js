// Account panel (top of the Profile page). Talks to src/cloud.js.
import {
  initCloud,
  onCloudChange,
  signInGoogle,
  signInEmail,
  signUpEmail,
  resetPassword,
  logOut,
} from "./cloud.js";

// XP -> level: level n needs 100 * (n-1)^2 XP in total.
export function levelFromXp(xp) {
  const level = Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
  const base = 100 * (level - 1) ** 2;
  const next = 100 * level ** 2;
  return { level, base, next, pct: ((xp - base) / (next - base)) * 100 };
}

function readXp() {
  try {
    return Math.max(
      0,
      Number(JSON.parse(localStorage.getItem("azurite-xp"))) || 0,
    );
  } catch {
    return 0;
  }
}

export function renderLevel() {
  const xp = readXp();
  const { level, next, pct } = levelFromXp(xp);
  const set = (id, t) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t;
  };
  set("account-level", `Level ${level}`);
  set("account-xp", `${xp} / ${next} XP`);
  const fill = document.getElementById("account-level-fill");
  if (fill) fill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
}

export function initAccountUi() {
  const panel = document.getElementById("account-panel");
  const modal = document.getElementById("account-modal");
  if (!panel || !modal) return;
  const $ = (id) => document.getElementById(id);
  const out = $("account-signed-out");
  const inn = $("account-signed-in");
  const msg = $("account-message");
  const email = $("account-email");
  const pass = $("account-password");

  const open = () => (modal.hidden = false);
  const close = () => (modal.hidden = true);
  $("account-open")?.addEventListener("click", open);
  $("account-close")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });

  $("account-google")?.addEventListener("click", signInGoogle);
  $("account-signin")?.addEventListener("click", () =>
    signInEmail(email.value.trim(), pass.value),
  );
  $("account-signup")?.addEventListener("click", () =>
    signUpEmail(email.value.trim(), pass.value),
  );
  $("account-reset")?.addEventListener("click", () => {
    if (!email.value.trim()) {
      msg.textContent = "Type your e-mail first.";
      msg.dataset.state = "error";
      return;
    }
    resetPassword(email.value.trim());
  });
  $("account-signout")?.addEventListener("click", logOut);
  pass?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") signInEmail(email.value.trim(), pass.value);
  });

  onCloudChange((status, user) => {
    const signedIn = !!user;
    out.hidden = signedIn;
    inn.hidden = !signedIn;
    if (signedIn) {
      close();
      const name = user.displayName || (user.email || "Player").split("@")[0];
      $("account-name").textContent = name;
      $("account-email-label").textContent = user.email || "";
      const av = $("account-avatar");
      av.innerHTML = "";
      if (user.photoURL) {
        const img = document.createElement("img");
        img.src = user.photoURL;
        img.alt = "";
        img.referrerPolicy = "no-referrer";
        av.appendChild(img);
      } else {
        av.textContent = name.trim().charAt(0).toUpperCase() || "?";
      }
      renderLevel();
    }
    msg.textContent = status.message || "";
    msg.dataset.state = status.state;
  });

  window.addEventListener("storage", renderLevel);
  initCloud();
}
