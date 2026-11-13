// Tahtaya ok ve daire çizme (Lichess tarzı).
//  - Bilgisayar: sağ tuşa basılı tutup bir kareden diğerine sürükle = ok, aynı kareye tıkla = daire.
//    Shift = kırmızı, Ctrl/Alt = mavi, Shift+Ctrl = sarı. Aynı oku tekrar çizersen silinir.
//  - Dokunmatik: bir parmağınla tahtaya bas ve basılı tut, öbür parmağınla çiz.
//  - Sol tık / dokunuş ya da pozisyon değişimi tüm okları temizler.
// Oklar tahtanın içindeki bir SVG katmanında çizilir; tahta yeniden çizilse de katman geri eklenir.

const SVG_NS = "http://www.w3.org/2000/svg";
const MIN_DRAG_SQUARES = 0.35;

export function initArrows(boardEl, { getOrientation, getKey }) {
  if (!boardEl) return null;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "board-arrows");
  svg.setAttribute("viewBox", "0 0 8 8");
  svg.setAttribute("aria-hidden", "true");

  const shapes = []; // { from, to, kind }
  let preview = null;
  let lastKey = getKey?.() ?? "";
  let drawing = null; // { pointerId, from, kind }
  const touchDown = new Map(); // pointerId -> { drew } (tahta üzerindeki dokunuşlar)
  let suppressClickUntil = 0;
  let syntheticCancel = false; // kendi gönderdiğimiz pointercancel'ı sayma

  const capture = (id) => {
    try {
      boardEl.setPointerCapture(id);
    } catch {}
  };
  const release = (id) => {
    try {
      boardEl.releasePointerCapture(id);
    } catch {}
  };

  const attach = () => {
    if (svg.parentNode !== boardEl) boardEl.appendChild(svg);
  };

  // ---------- geometri ----------
  const squareAt = (clientX, clientY) => {
    const rect = boardEl.getBoundingClientRect();
    const fx = (clientX - rect.left) / rect.width;
    const fy = (clientY - rect.top) / rect.height;
    if (fx < 0 || fy < 0 || fx >= 1 || fy >= 1) return null;
    const col = Math.floor(fx * 8);
    const row = Math.floor(fy * 8);
    const white = getOrientation() === "w";
    const file = white ? col : 7 - col;
    const rank = white ? 7 - row : row;
    return "abcdefgh"[file] + (rank + 1);
  };

  const center = (square) => {
    const file = "abcdefgh".indexOf(square[0]);
    const rank = Number(square[1]) - 1;
    const white = getOrientation() === "w";
    return {
      x: (white ? file : 7 - file) + 0.5,
      y: (white ? 7 - rank : rank) + 0.5,
    };
  };

  const kindFromEvent = (e) => {
    if (e.shiftKey && (e.ctrlKey || e.altKey)) return "alt3";
    if (e.shiftKey) return "alt1";
    if (e.ctrlKey || e.altKey) return "alt2";
    return "main";
  };

  // ---------- çizim ----------
  const make = (name, attrs) => {
    const el = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };

  const shapeEl = (shape, isPreview) => {
    const cls = `arrow-shape arrow-${shape.kind}${isPreview ? " arrow-preview" : ""}`;
    const a = center(shape.from);
    if (shape.from === shape.to) {
      return make("circle", {
        class: cls + " arrow-circle",
        cx: a.x,
        cy: a.y,
        r: 0.44,
      });
    }
    const b = center(shape.to);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    const head = 0.42;
    const halfBase = 0.26;
    const tipX = b.x - ux * 0.08;
    const tipY = b.y - uy * 0.08;
    const baseX = tipX - ux * head;
    const baseY = tipY - uy * head;
    const g = make("g", { class: cls });
    g.appendChild(
      make("line", {
        class: "arrow-line",
        x1: a.x + ux * 0.2,
        y1: a.y + uy * 0.2,
        x2: baseX + ux * 0.02,
        y2: baseY + uy * 0.02,
      }),
    );
    g.appendChild(
      make("polygon", {
        class: "arrow-head",
        points: `${tipX},${tipY} ${baseX - uy * halfBase},${baseY + ux * halfBase} ${baseX + uy * halfBase},${baseY - ux * halfBase}`,
      }),
    );
    return g;
  };

  const render = () => {
    attach();
    svg.replaceChildren();
    for (const s of shapes) svg.appendChild(shapeEl(s, false));
    if (preview) svg.appendChild(shapeEl(preview, true));
  };

  const clear = () => {
    if (!shapes.length && !preview) return;
    shapes.length = 0;
    preview = null;
    render();
  };

  const toggle = (shape) => {
    const i = shapes.findIndex(
      (s) => s.from === shape.from && s.to === shape.to,
    );
    if (i >= 0 && shapes[i].kind === shape.kind) shapes.splice(i, 1);
    else if (i >= 0) shapes[i] = shape;
    else shapes.push(shape);
    render();
  };

  // ---------- çizim etkileşimi ----------
  const begin = (e, kind) => {
    const from = squareAt(e.clientX, e.clientY);
    if (!from) return false;
    drawing = { pointerId: e.pointerId, from, kind, moved: false };
    preview = { from, to: from, kind };
    render();
    return true;
  };

  const finish = (e, cancelled) => {
    if (!drawing || e.pointerId !== drawing.pointerId) return;
    const to = squareAt(e.clientX, e.clientY);
    const d = drawing;
    drawing = null;
    preview = null;
    if (!cancelled && to) toggle({ from: d.from, to, kind: d.kind });
    else render();
  };

  boardEl.addEventListener("contextmenu", (e) => e.preventDefault());

  // Yakalama aşamasında dinle: ok çizen dokunuşlar oyun mantığına hiç ulaşmasın
  boardEl.addEventListener(
    "pointerdown",
    (e) => {
      const isTouch = e.pointerType === "touch";

      if (e.button === 2 && !isTouch) {
        e.preventDefault();
        e.stopPropagation();
        if (begin(e, kindFromEvent(e))) capture(e.pointerId);
        return;
      }

      if (isTouch) {
        // Başka bir parmak zaten tahtada basılıysa bu parmak ok çizer
        if (touchDown.size >= 1 && !drawing) {
          e.preventDefault();
          e.stopPropagation();
          // Birinci parmağın başlattığı taş sürüklemesini iptal et
          // (Parmak "basılı" sayılmaya devam eder: bırakılana kadar yeni oklar çizilebilir.)
          if (![...touchDown.values()].some((t) => t.drew)) {
            syntheticCancel = true;
            for (const id of touchDown.keys()) {
              window.dispatchEvent(
                new PointerEvent("pointercancel", {
                  pointerId: id,
                  pointerType: "touch",
                }),
              );
            }
            syntheticCancel = false;
          }
          for (const t of touchDown.values()) t.drew = true;
          suppressClickUntil = Date.now() + 600;
          begin(e, "main");
          capture(e.pointerId);
          touchDown.set(e.pointerId, { drew: false, drawer: true });
          return;
        }
        touchDown.set(e.pointerId, { drew: false });
      }

      // Normal sol tık / tek parmak dokunuşu: okları temizle
      if (e.button === 0 || isTouch) clear();
    },
    true,
  );

  boardEl.addEventListener("pointermove", (e) => {
    if (!drawing || e.pointerId !== drawing.pointerId) return;
    const to = squareAt(e.clientX, e.clientY) ?? drawing.from;
    if (preview.to !== to) {
      preview = { from: drawing.from, to, kind: drawing.kind };
      render();
    }
  });

  const onUp = (e) => {
    const t = touchDown.get(e.pointerId);
    touchDown.delete(e.pointerId);
    // Basılı tutan parmak oklardan sonra kalkınca oyuna tıklama gitmesin
    if (t?.drew && e.type === "pointerup")
      suppressClickUntil = Date.now() + 400;
    if (drawing && e.pointerId === drawing.pointerId) {
      release(e.pointerId);
      finish(e, e.type === "pointercancel");
    }
  };
  boardEl.addEventListener("pointerup", onUp);
  boardEl.addEventListener("pointercancel", onUp);
  window.addEventListener("pointerup", (e) => touchDown.delete(e.pointerId));
  window.addEventListener("pointercancel", (e) => {
    if (!syntheticCancel) touchDown.delete(e.pointerId);
  });

  // Oku çizen parmağın bıraktığı "click"i oyuna iletme
  boardEl.addEventListener(
    "click",
    (e) => {
      if (Date.now() < suppressClickUntil) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
    true,
  );

  // Tahta yeniden çizilince katmanı geri ekle; pozisyon değiştiyse okları sil
  new MutationObserver(() => {
    attach();
    const key = getKey?.() ?? "";
    if (key !== lastKey) {
      lastKey = key;
      clear();
    }
  }).observe(boardEl, { childList: true });

  // Yön değişince (Flip) okların yeri doğru kalsın
  let lastOrientation = getOrientation();
  new MutationObserver(() => {
    const o = getOrientation();
    if (o !== lastOrientation) {
      lastOrientation = o;
      render();
    }
  }).observe(boardEl, { childList: true });

  attach();
  return { clear, render };
}
