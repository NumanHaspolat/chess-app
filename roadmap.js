// Opening roadmap (connected nodes) + mastery dots, built from variation progress (0-100).
const MASTERED = 90;

export function masteryLevel(p) {
  if (p >= MASTERED) return 5;
  return Math.max(0, Math.min(4, Math.floor(p / 22)));
}

export function masteryDots(p) {
  const lvl = masteryLevel(p);
  const wrap = document.createElement("span");
  wrap.className = "mastery-dots" + (lvl === 5 ? " full" : "");
  wrap.title = lvl === 5 ? "Mastered" : `Mastery ${lvl}/5`;
  wrap.setAttribute("aria-label", wrap.title);
  for (let i = 0; i < 5; i++) {
    const d = document.createElement("i");
    if (i < lvl) d.className = "on";
    wrap.appendChild(d);
  }
  return wrap;
}

// variations: [{ name, progress }]; getP(variation) -> 0..100
export function buildRoadmap(variations, getP, onSelect) {
  const list = variations.map((v) => ({ name: v.name, p: getP(v) }));
  const currentIdx = list.findIndex((v) => v.p < MASTERED);
  const road = document.createElement("div");
  road.className = "roadmap";
  road.setAttribute("role", "list");

  list.forEach((v, i) => {
    const state =
      v.p >= MASTERED
        ? "done"
        : i === currentIdx
          ? "current"
          : v.p > 0
            ? "started"
            : "todo";
    const node = document.createElement(onSelect ? "button" : "div");
    if (onSelect) {
      node.type = "button";
      node.addEventListener("click", () => onSelect(i, variations[i]));
    }
    const prevDone = i > 0 && list[i - 1].p >= MASTERED;
    node.className = `rm-node ${state}${prevDone ? " linked" : ""}`;
    node.setAttribute("role", "listitem");
    node.title = `${v.name} · ${v.p}%${onSelect ? " · click to learn" : ""}`;
    node.style.setProperty("--p", `${Math.min(100, v.p)}%`);
    const dot = document.createElement("span");
    dot.className = "rm-dot";
    dot.textContent = state === "done" ? "✓" : String(i + 1);
    const label = document.createElement("small");
    label.textContent = v.name;
    node.append(dot, label);
    if (state === "current") {
      const tag = document.createElement("em");
      tag.textContent = "Next";
      node.appendChild(tag);
    }
    road.appendChild(node);
  });

  // Center the current node using the container's own scroll (not scrollIntoView)
  requestAnimationFrame(() => {
    const cur = road.querySelector(".rm-node.current");
    if (cur && road.scrollWidth > road.clientWidth) {
      road.scrollLeft =
        cur.offsetLeft - road.clientWidth / 2 + cur.offsetWidth / 2;
    }
  });
  return road;
}
