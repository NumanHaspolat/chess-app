// Small pixel-style notifications that slide in at the top right.
// toast({ title, text, kind: "xp" | "badge" | "level" | "info", icon, duration })
const MAX_VISIBLE = 4;

function host() {
  let el = document.getElementById("toast-host");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast-host";
    el.className = "toast-host";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  return el;
}

export function toast({
  title = "",
  text = "",
  kind = "info",
  icon = "",
  duration = 3800,
} = {}) {
  const root = host();
  while (root.children.length >= MAX_VISIBLE) root.firstElementChild.remove();

  const el = document.createElement("div");
  el.className = `toast toast-${kind}`;
  const ic = document.createElement("div");
  ic.className = "toast-icon";
  ic.textContent = icon || { xp: "+", badge: "★", level: "▲" }[kind] || "i";
  const body = document.createElement("div");
  body.className = "toast-body";
  const t = document.createElement("strong");
  t.textContent = title;
  body.appendChild(t);
  if (text) {
    const p = document.createElement("span");
    p.textContent = text;
    body.appendChild(p);
  }
  const bar = document.createElement("div");
  bar.className = "toast-bar";
  bar.style.animationDuration = `${duration}ms`;
  el.append(ic, body, bar);
  root.appendChild(el);

  const close = () => {
    if (!el.isConnected) return;
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 220);
  };
  el.addEventListener("click", close);
  setTimeout(close, duration);
  return close;
}
