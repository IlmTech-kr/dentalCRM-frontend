// Minimal service worker: exists only to satisfy browser installability
// criteria (Chrome/Edge "Install app"). It intentionally does not cache
// anything — this is a CRM, and serving stale patient/clinic data from a
// cache would be worse than no offline support at all.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
