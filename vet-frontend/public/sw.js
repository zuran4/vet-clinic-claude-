// Ελαφρύ service worker — απαιτείται από Chrome/Android ώστε η σελίδα
// να θεωρείται "installable" (PWA) και να εμφανίζεται το prompt εγκατάστασης.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
