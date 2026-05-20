// vet-frontend/src/api/registryApi.js

/**
 * Calls backend:
 * GET /api/registry/lookup?microchip=...
 *
 * Optional flags:
 * - includeSnippets
 * - includeBooklet
 * - includeRaw
 *
 * Returns JSON (success):
 * { ok, microchip, sessionStatus, url, owner, sterilizationData, isSterilized, ...optional }
 *
 * On error, backend returns:
 * { ok:false, error:{ code, message, requestId }, meta:{...} }
 */

function safeJsonParse(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function pickRequestId(res, json) {
  // 1) header (αν υπάρχει)
  const headerRid =
    res?.headers?.get?.("x-request-id") ||
    res?.headers?.get?.("X-Request-Id") ||
    res?.headers?.get?.("x-requestid") ||
    null;

  // 2) body
  const bodyRid = json?.requestId || json?.error?.requestId || null;

  return headerRid || bodyRid || null;
}

function makeApiError(message, { code, requestId, httpStatus, payload, details } = {}) {
  const err = new Error(message || "Άγνωστο σφάλμα");
  if (code) err.code = code;
  if (requestId) err.requestId = requestId;
  if (httpStatus) err.httpStatus = httpStatus;
  if (payload) err.payload = payload;
  if (details) err.details = details;
  return err;
}

export async function lookupMicrochip(
  microchip,
  options = { includeSnippets: false, includeBooklet: true, includeRaw: false }
) {
  const trimmed = String(microchip || "").trim();
  if (!trimmed) {
    throw makeApiError("Λείπει ο αριθμός microchip", { code: "VALIDATION_ERROR" });
  }

  const params = new URLSearchParams({ microchip: trimmed });

  if (options?.includeSnippets) params.set("includeSnippets", "1");

  // default true όπως είχες, αλλά αν περάσεις ρητά false δεν το στέλνουμε
  if (options?.includeBooklet !== false) params.set("includeBooklet", "1");

  if (options?.includeRaw) params.set("includeRaw", "1");

  let res;
  let text = "";
  let json = null;

  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    res = await fetch(`/api/registry/lookup?${params.toString()}`, { headers });
    text = await res.text().catch(() => "");
    json = safeJsonParse(text);
  } catch (e) {
    // network / CORS / fetch failure
    throw makeApiError(e?.message || "Αποτυχία σύνδεσης με το backend", {
      code: "NETWORK_ERROR",
      details: e,
    });
  }

  const requestId = pickRequestId(res, json);

  // HTTP error
  if (!res.ok) {
    // structured backend error
    if (json?.error?.message) {
      throw makeApiError(json.error.message, {
        code: json.error.code || "BACKEND_ERROR",
        requestId: json.error.requestId || requestId || null,
        httpStatus: res.status,
        payload: json,
      });
    }

    // fallback
    throw makeApiError(`Αποτυχία κλήσης μητρώου (status ${res.status})`, {
      code: "HTTP_ERROR",
      requestId,
      httpStatus: res.status,
      details: text,
      payload: json || null,
    });
  }

  // Success must be JSON
  if (!json) {
    throw makeApiError("Μη έγκυρο JSON από το backend μητρώου", {
      code: "INVALID_JSON",
      requestId,
      httpStatus: res.status,
      details: text,
    });
  }

  // Αν το backend επιστρέψει ok:false με 200, το αφήνουμε ως return
  // γιατί το hook σου ήδη το χειρίζεται (data.ok === false).
  // Εναλλακτικά θα μπορούσαμε να throw εδώ, αλλά δεν το αλλάζω χωρίς λόγο.
  return json;
}
