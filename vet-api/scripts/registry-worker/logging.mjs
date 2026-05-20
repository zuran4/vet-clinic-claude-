// vet-api/scripts/registry-worker/logging.mjs

function nowIso() {
  return new Date().toISOString();
}

/**
 * Απλό redaction για να αποφεύγονται PII leaks στα logs.
 * Δεν είναι τέλειο, αλλά κόβει τα συνηθισμένα.
 */
function redact(obj) {
  if (!obj || typeof obj !== "object") return obj;

  const SENSITIVE_KEYS = new Set([
    "owner",
    "ownerName",
    "firstname",
    "lastname",
    "fullName",
    "address",
    "phone",
    "mobile",
    "email",
    "afm",
    "amka",
    "idNumber",
    "taxId",
  ]);

  const out = Array.isArray(obj) ? [] : {};

  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k)) {
      out[k] = "[REDACTED]";
      continue;
    }

    // Μην κατεβαίνεις βαθιά σε nested αντικείμενα, για να μη “ξεφύγει” PII
    if (v && typeof v === "object") {
      out[k] = Array.isArray(v) ? `[Array(${v.length})]` : "[Object]";
      continue;
    }

    out[k] = v;
  }

  return out;
}

function logEvent(eventName, payload) {
  console.log(`[Registry worker] ${nowIso()} ${eventName}`, redact(payload));
}

// --- Logging guards (για να μην πνιγόμαστε σε /session polls) ---
let lastSessionLogKey = null;
export function logSessionOncePerChange(payload) {
  const key = `${payload?.status || "?"}|${payload?.url || ""}`;
  if (key !== lastSessionLogKey) {
    logEvent("/session", payload);
    lastSessionLogKey = key;
  }
}

let lastStatusLogKey = null;
export function logStatusOncePerChange(payload) {
  const key = `${payload?.hasPage ? "1" : "0"}|${payload?.url || ""}`;
  if (key !== lastStatusLogKey) {
    logEvent("/status", payload);
    lastStatusLogKey = key;
  }
}
