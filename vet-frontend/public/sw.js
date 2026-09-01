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

// 🔹 Push notification (νέο μήνυμα email/WhatsApp) — εμφανίζεται σαν
// ειδοποίηση συστήματος ακόμα κι όταν το Vetty δεν είναι ανοιχτό.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Vetty", body: event.data?.text() || "Νέα ειδοποίηση" };
  }

  const title = data.title || "Vetty";
  const options = {
    body: data.body || "",
    icon: "/logo192.png",
    badge: "/logo192.png",
    tag: data.tag || "vetty",
    renotify: true,
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 🔹 Κλικ πάνω στην ειδοποίηση — ανοίγει (ή επαναφέρνει σε πρώτο πλάνο) το Vetty.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});
