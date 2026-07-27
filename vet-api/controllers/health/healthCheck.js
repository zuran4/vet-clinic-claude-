import { createRequire } from "node:module";

import { getAdminConnectionState } from "../../services/adminConnection.js";

const _require = createRequire(import.meta.url);
const { version } = _require("../../package.json");

const READYSTATE = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

export async function healthCheck(_req, res) {
  // Το app δεν χρησιμοποιεί ποτέ το default mongoose.connection (μόνο
  // createConnection ανά admin/tenant DB) — ελέγχουμε την admin σύνδεση,
  // που είναι πάντα ενεργή όσο τρέχει κανονικά ο server.
  const dbState = getAdminConnectionState();
  const dbOk = dbState === 1;

  const httpStatus = dbOk ? 200 : 503;

  return res.status(httpStatus).json({
    status: dbOk ? "ok" : "degraded",
    version,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    checks: {
      db: READYSTATE[dbState] ?? `unknown (${dbState})`,
    },
  });
}
