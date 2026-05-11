// NoteAssemble Service Worker — enables PWA installability
const CACHE_NAME = "noteassemble-v1";
const STATIC_ASSETS = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first strategy for API calls, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) {
    // Always go network for API
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((r) => r ?? new Response("Offline", { status: 503 }))
    )
  );
});
