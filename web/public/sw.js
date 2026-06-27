// Minimal service worker for installability + a cached app-shell fallback.
// ponytail: network-first, cache only successful navigations; no offline write
// queue (spec lists offline-sync as Phase 4).
const CACHE = "ajerly-v1";

self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/app")))
    );
  }
});
