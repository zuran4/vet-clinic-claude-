import config from "../config/index.js";
import logger from "../utils/logger.js";

// Στέλνει errors/unusual events στο MASTER ADMIN APP (control-plane) ώστε να
// φαίνονται εκεί (Καταγραφή tab), χωρίς ΠΟΤΕ να μπλοκάρει ή να ρίξει την
// κανονική λειτουργία — fire-and-forget, σιωπηλά off αν δεν έχει ρυθμιστεί.
export function reportEvent({ clinicId, type, severity = "info", message, source = "backend", meta }) {
  const { apiUrl, eventsKey } = config.controlPlane;
  if (!apiUrl || !eventsKey || !clinicId) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  fetch(`${apiUrl}/internal/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": eventsKey,
    },
    body: JSON.stringify({ clinicId, type, severity, message, source, meta }),
    signal: controller.signal,
  })
    .catch((err) => {
      logger.warn("[ControlPlaneReporter] Αποτυχία αποστολής event", { clinicId, type, error: err.message });
    })
    .finally(() => clearTimeout(timeout));
}
