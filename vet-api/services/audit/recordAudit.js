import AuditLog from "../../models/AuditLog.js";
import logger from "../../utils/logger.js";

/**
 * Fire-and-forget καταγραφή audit event.
 * Δεν περιμένει (await) τον caller — ποτέ δεν πρέπει μια αποτυχία
 * στην καταγραφή να μπλοκάρει ή να ρίξει το κυρίως request.
 */
export function recordAudit(entry) {
  AuditLog.create(entry).catch((err) => {
    logger.error("⚠️ Αποτυχία καταγραφής audit log", {
      stack: err?.stack,
      action: entry?.action,
      resource: entry?.resource,
    });
  });
}
