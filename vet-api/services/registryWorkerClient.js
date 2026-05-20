// vet-api/services/registryWorkerClient.js

import logger from "../utils/logger.js";
import ApiError from "../utils/apiError.js";

// Base URL (env first, fallback localhost)
const REGISTRY_WORKER_BASE_URL = String(
  process.env.REGISTRY_WORKER_URL || "http://localhost:5051"
).replace(/\/+$/, "");

// Timeouts (env-configurable)
function toPositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const WORKER_SESSION_TIMEOUT_MS = toPositiveInt(
  process.env.REGISTRY_WORKER_SESSION_TIMEOUT_MS,
  2500
);

const WORKER_LOOKUP_TIMEOUT_MS = toPositiveInt(
  process.env.REGISTRY_WORKER_LOOKUP_TIMEOUT_MS,
  120000
);

// Logging guard for repeated offline spam (session polling)
let hasLoggedSessionOfflineError = false;

// Startup grace period: μη γράφεις WARN στα πρώτα N ms (ο worker ξεκινάει)
const WORKER_STARTUP_GRACE_MS = toPositiveInt(
  process.env.REGISTRY_WORKER_STARTUP_GRACE_MS,
  12000
);
const bootTs = Date.now();

function buildHeaders(requestId) {
  const headers = { accept: "application/json" };
  if (requestId) headers["x-request-id"] = String(requestId);
  return headers;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new ApiError(504, "Registry worker request timed out", {
        code: "WORKER_TIMEOUT",
        details: { url, timeoutMs, baseUrl: REGISTRY_WORKER_BASE_URL },
        expose: false,
      });
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}

// ------------------------------------------------------------
// /session implementation (soft-fail: returns status OFFLINE/TIMEOUT/etc)
// ------------------------------------------------------------
async function getRegistrySessionImpl(options = {}) {
  const requestId = options?.requestId;
  const url = `${REGISTRY_WORKER_BASE_URL}/session`;

  try {
    const res = await fetchWithTimeout(
      url,
      { headers: buildHeaders(requestId) },
      WORKER_SESSION_TIMEOUT_MS
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");

      logger.warn("[RegistryWorkerClient] /session non-OK response", {
        requestId,
        url,
        baseUrl: REGISTRY_WORKER_BASE_URL,
        status: res.status,
        bodyPreview: text.slice(0, 300),
      });

      return {
        ok: false,
        status: `WORKER_HTTP_${res.status}`,
        url: null,
        raw: {
          error: "Non-OK response from registry worker",
          statusCode: res.status,
          body: text,
        },
      };
    }

    const json = await res.json().catch((err) => {
      logger.warn("[RegistryWorkerClient] Invalid JSON from worker (/session)", {
        requestId,
        url,
        baseUrl: REGISTRY_WORKER_BASE_URL,
        error: err?.message,
      });
      return null;
    });

    if (!json || typeof json !== "object") {
      return {
        ok: false,
        status: "INVALID_JSON",
        url: null,
        raw: { error: "Invalid JSON from registry worker" },
      };
    }

    hasLoggedSessionOfflineError = false;

    return {
      ok: Boolean(json.ok),
      status: json.status || "UNKNOWN",
      url: json.url || null,
      raw: json,
    };
  } catch (err) {
  const inStartupGrace = Date.now() - bootTs < WORKER_STARTUP_GRACE_MS;

  // Στα πρώτα δευτερόλεπτα μη γράφεις WARN (ο worker μπορεί να μην έχει σηκωθεί ακόμη)
  if (!inStartupGrace && !hasLoggedSessionOfflineError) {
    logger.warn(
      "[RegistryWorkerClient] /session unreachable (next identical errors suppressed)",
      {
        requestId,
        url,
        baseUrl: REGISTRY_WORKER_BASE_URL,
        name: err?.name,
        message: err?.message,
        code: err?.code,
        statusCode: err?.statusCode,
      }
    );
    hasLoggedSessionOfflineError = true;
  }

  return {
    ok: false,
    status:
      err instanceof ApiError && err.code === "WORKER_TIMEOUT"
        ? "TIMEOUT"
        : "OFFLINE",
    url: null,
    raw: {
      error: "Cannot reach registry worker",
      name: err?.name,
      message: err?.message,
      code: err?.code,
    },
  };
}

}

/**
 * GET /session (worker)
 * ✅ Αυτό είναι το export που περιμένουν τα controllers:
 * import { getRegistrySession } from "../../services/registryWorkerClient.js"
 */
export async function getRegistrySession(options = {}) {
  return getRegistrySessionImpl(options);
}

/**
 * GET /lookup?microchip=...
 * Hard-fail with ApiError on connectivity/HTTP issues.
 */
export async function lookupMicrochip(microchip, options = {}) {
  const requestId = options?.requestId;
  const url = `${REGISTRY_WORKER_BASE_URL}/lookup?microchip=${encodeURIComponent(
    microchip
  )}`;

  try {
    const res = await fetchWithTimeout(
      url,
      { headers: buildHeaders(requestId) },
      WORKER_LOOKUP_TIMEOUT_MS
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");

      throw new ApiError(502, "Registry worker lookup returned non-OK status", {
        code: "WORKER_HTTP_ERROR",
        details: {
          status: res.status,
          url,
          baseUrl: REGISTRY_WORKER_BASE_URL,
          bodyPreview: text.slice(0, 500),
        },
        expose: false,
      });
    }

    const json = await res.json().catch((err) => {
      throw new ApiError(502, "Invalid JSON from registry worker (lookup)", {
        code: "WORKER_INVALID_JSON",
        details: {
          url,
          baseUrl: REGISTRY_WORKER_BASE_URL,
          message: err?.message,
        },
        expose: false,
      });
    });

    return {
      ok: Boolean(json.ok),
      microchip: json.microchip || microchip,
      url: json.url || null,
      textSnippet: json.textSnippet || null,
      htmlSnippet: json.htmlSnippet || null,
      bookletData: json.bookletData || json.pet || null,
      owner: json.owner || json.ownerData || null,
      raw: json,
    };
  } catch (err) {
    // Preserve ApiError as-is (includes WORKER_TIMEOUT)
    if (err instanceof ApiError) throw err;

    throw new ApiError(502, "Cannot reach registry worker (lookup)", {
      code: "WORKER_OFFLINE",
      details: {
        url,
        baseUrl: REGISTRY_WORKER_BASE_URL,
        name: err?.name,
        message: err?.message,
      },
      expose: false,
    });
  }
}
