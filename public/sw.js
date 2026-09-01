/* Rework service worker — offline support for this static SPA.
 *
 * Strategy (Vite hashes asset filenames at build time, so we can't precache
 * them by name — we cache at runtime instead):
 *   - Navigations: network-first, falling back to the cached app shell
 *     (index.html) so the app still opens when offline.
 *   - Same-origin assets (JS/CSS/images built by Vite): stale-while-revalidate.
 *   - Google Fonts: cache-first (they're versioned + immutable).
 *   - /api/* and the live food APIs (USDA proxy, Open Food Facts, Gemini):
 *     never cached — always go to the network so data stays fresh.
 */
const CACHE = "rework-cache-v1";
const APP_SHELL = "/index.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(["/", APP_SHELL, "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"]))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function putInCache(request, response) {
  const copy = response.clone();
  caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never intercept API traffic — keep nutrition data / AI results fresh.
  if (url.pathname.startsWith("/api/")) return;

  // App navigations: network-first, fall back to the cached shell offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          putInCache(APP_SHELL, res);
          return res;
        })
        .catch(() => caches.match(APP_SHELL).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Same-origin static assets: stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) putInCache(req, res);
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Google Fonts (cross-origin, immutable): cache-first.
  if (url.hostname.endsWith("googleapis.com") || url.hostname.endsWith("gstatic.com")) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req)
            .then((res) => {
              if (res && (res.status === 200 || res.type === "opaque")) putInCache(req, res);
              return res;
            })
            .catch(() => cached)
      )
    );
    return;
  }

  // Everything else (Open Food Facts search, etc.): straight to network.
});
