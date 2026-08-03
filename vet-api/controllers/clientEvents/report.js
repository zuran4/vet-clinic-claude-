import { reportEvent } from "../../services/controlPlaneReporter.js";

// Δέχεται JS errors/unusual events από το frontend (browser) του πελάτη και τα
// προωθεί στο MASTER ADMIN APP (control-plane) — απλό "fire and forget", ποτέ
// δεν πρέπει να μπλοκάρει το UI του χρήστη.
export default function reportClientEvent(req, res) {
  const { message, stack, url, level, type } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ message: 'Το πεδίο "message" είναι υποχρεωτικό.' });
  }

  reportEvent({
    clinicId: req.clinicId,
    type: type || "frontend_error",
    severity: level === "warning" ? "warning" : "critical",
    message: message.slice(0, 500),
    source: "frontend",
    meta: {
      stack: typeof stack === "string" ? stack.slice(0, 4000) : undefined,
      url: typeof url === "string" ? url.slice(0, 500) : undefined,
      userId: req.user?.userId || undefined,
      userName: req.user?.name || undefined,
    },
  });

  res.status(202).json({ ok: true });
}
