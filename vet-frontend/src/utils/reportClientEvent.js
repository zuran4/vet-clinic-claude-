import request from "../api/apiClient.js";

// Στέλνει JS errors/unusual events στο backend (που τα προωθεί στο MASTER
// ADMIN APP) — ποτέ δεν πρέπει να ρίξει σφάλμα ή να μπλοκάρει το UI.
// Απλό dedupe ώστε το ίδιο σφάλμα να μη σπαμάρει (π.χ. σε render loop).
const recentlySent = new Set();

export default function reportClientEvent({ message, stack, level = "critical", type } = {}) {
  if (!message) return;

  const key = `${type || ""}:${message}`.slice(0, 300);
  if (recentlySent.has(key)) return;
  recentlySent.add(key);
  setTimeout(() => recentlySent.delete(key), 60_000);

  if (!localStorage.getItem("token")) return;

  request("/client-events", {
    method: "POST",
    body: { message: String(message).slice(0, 500), stack, level, type, url: window.location.href },
  }).catch(() => {});
}
