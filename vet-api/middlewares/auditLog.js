import { recordAudit } from "../services/audit/recordAudit.js";

const ACTION_BY_METHOD = {
  POST: "CREATE",
  PUT: "UPDATE",
  PATCH: "UPDATE",
  DELETE: "DELETE",
};

// "/api/customers/64f.../purchases" -> "customers"
function deriveResource(req) {
  const segments = (req.baseUrl || req.originalUrl || "").split("/").filter(Boolean);
  return segments[1] || null;
}

/**
 * Καταγράφει αυτόματα κάθε επιτυχημένη CREATE/UPDATE/DELETE ενέργεια σε /api/*
 * (εκτός /api/auth — η σύνδεση καταγράφεται ξεχωριστά, με τη δική της σημασιολογία).
 * Τρέχει ΜΕΤΑ το requireAuth, άρα το req.user είναι διαθέσιμο.
 */
export default function auditLog(req, res, next) {
  const action = ACTION_BY_METHOD[req.method];

  if (action) {
    res.on("finish", () => {
      if (res.statusCode >= 400) return; // καταγράφουμε μόνο επιτυχημένες μεταβολές

      recordAudit({
        action,
        resource: deriveResource(req),
        resourceId: req.params?.id || null,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        userId: req.user?.userId || null,
        userName: req.user?.name || null,
        userRole: req.user?.role || null,
        requestId: req.requestId || null,
        ip: req.ip,
      });
    });
  }

  next();
}
