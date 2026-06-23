import logger from "../../utils/logger.js";

export function recordAudit(entry, AuditLog) {
  if (!AuditLog) return;
  AuditLog.create(entry).catch((err) => {
    logger.error("⚠️ Αποτυχία καταγραφής audit log", {
      stack: err?.stack,
      action: entry?.action,
      resource: entry?.resource,
    });
  });
}
