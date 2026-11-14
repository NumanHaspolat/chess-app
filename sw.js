// Azurite service worker: çevrimdışı çalışma.
// Strateji:
//  - Uygulama kabuğu (html/js/css/json): önce ağ, olmazsa önbellek  -> güncellemeler gelir
//  - Ses, görsel, taş, Stockfish dosyaları: önce önbellek            -> hızlı ve çevrimdışı
//  - CDN (chess.js, yazı tipi): önbellekten ver, arkada yenile
// Sürüm numarasını değiştirmek eski önbelleği siler.
const VERSION = "cxess-v4";
const CORE = [
  "./",
  "./index.html",
  "./style.css",
  "./main.js",
  "./manifest.webmanifest",
  "./src/backup.js",
  "./src/daily.js",
  "./src/drill.js",
  "./src/engine-pool.js",
  "./src/eval-cache.js",
  "./src/library.js",
  "./src/opening-trainer.js",
  "./src/opening-progress.js",
  "./src/bot.js",
  "./src/bot-book.js",
  "./src/openings.js",
  "./src/pgn.js",
  "./src/pieces.js",
  "./src/repertoire.js",
  "./src/review.js",
  "./src/settings.js",
  "./src/srs.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/stockfish/stockfish-19-lite-single.js",
  "./assets/audio/move.wav",
  "./assets/audio/capture.wav",
  "./assets/audio/check.wav",
  "./assets/audio/castle.wav",
  "./assets/audio/gameover.wav",
  "./assets/audio/promote.wav",
  "https://cdn.jsdelivr.net/npm/chess.js@1.0.0/+esm",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) =>
        // Bir dosya bulunamazsa kurulum yarım kalmasın
        Promise.allSettled(CORE.map((url) => cache.add(url))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

const isShell = (url) =>
  /\.(html|js|css|json|webmanifest)$/.test(url.pathname) ||
  url.pathname.endsWith("/");

async function putIfOk(request, response) {
  // Range (206) yanıtları ve hatalar önbelleğe alınmaz
  if (response && response.ok && response.status === 200) {
    const cache = await caches.open(VERSION);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.headers.has("range")) return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin && isShell(url)) {
    // Önce ağ, olmazsa önbellek
    event.respondWith(
      fetch(request)
        .then((res) => putIfOk(request, res))
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit || caches.match("./index.html")),
        ),
    );
    return;
  }

  if (sameOrigin) {
    // Önce önbellek
    event.respondWith(
      caches
        .match(request)
        .then(
          (hit) => hit || fetch(request).then((res) => putIfOk(request, res)),
        ),
    );
    return;
  }

  // CDN / yazı tipleri: önbellekten ver, arkada yenile
  if (
    /cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(
      url.hostname,
    )
  ) {
    event.respondWith(
      caches.match(request).then((hit) => {
        const network = fetch(request)
          .then((res) => putIfOk(request, res))
          .catch(() => hit);
        return hit || network;
      }),
    );
  }
});
