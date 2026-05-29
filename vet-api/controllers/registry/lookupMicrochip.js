// vet-api/controllers/registry/lookupMicrochip.js

import { randomUUID } from "node:crypto";
import logger from "../../utils/logger.js";
import ApiError from "../../utils/apiError.js";
import {
  getRegistrySession,
  lookupMicrochip,
} from "../../services/registryWorkerClient.js";

// ✅ In-flight dedupe ανά microchip (single-flight)
const inflightLookups = new Map(); // microchip -> { startedAt, promise }
const INFLIGHT_TTL_MS = 60_000;

function getRequestId(req) {
  return (
    req.requestId ||
    (req.headers["x-request-id"] || "").toString().trim() ||
    (req.headers["x-correlation-id"] || "").toString().trim() ||
    randomUUID()
  );
}

function toBoolQuery(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

/**
 * GET /api/registry/lookup?microchip=...
 * Optional:
 *  - includeSnippets=1  -> include textSnippet/htmlSnippet
 *  - includeBooklet=1   -> include bookletData
 *  - includeRaw=1       -> include raw (slim)
 */
export async function lookupMicrochipHandler(req, res, next) {
  const requestId = getRequestId(req);
  const microchip = String(req.query.microchip || "").trim();

  const includeSnippets = toBoolQuery(req.query.includeSnippets);
  const includeBooklet = toBoolQuery(req.query.includeBooklet);
  const includeRaw = toBoolQuery(req.query.includeRaw);

  // Defensive (υπάρχει ήδη validation στο routes/registry/index.js)
  if (!microchip) {
    return next(
      new ApiError(400, "Missing required query param: microchip", {
        code: "VALIDATION_ERROR",
        details: { field: "microchip" },
      })
    );
  }

  try {
    const existing = inflightLookups.get(microchip);
    if (
      existing &&
      Date.now() - existing.startedAt < INFLIGHT_TTL_MS &&
      existing.promise
    ) {
      logger.info({
        msg: "Registry lookup deduped (in-flight)",
        microchip,
        requestId,
      });

      const result = await existing.promise;
      return res.status(200).json({ requestId, ...result });
    }

    const promise = (async () => {
      logger.info({
        msg: "Registry lookup started",
        microchip,
        requestId,
      });

      const session = await getRegistrySession({ requestId });

      if (!session || session.status !== "LOGGED_IN") {
        throw new ApiError(409, "Registry worker is not logged in", {
          code: "WORKER_NOT_LOGGED_IN",
          details: { sessionStatus: session?.status ?? "UNKNOWN" },
        });
      }

      const lookupResult = await lookupMicrochip(microchip, { requestId });

      // rawSlim: αφαιρούμε βαριά πεδία (και δεν το στέλνουμε αν δεν ζητηθεί)
      let rawSlim = lookupResult.raw ?? null;
      if (rawSlim && typeof rawSlim === "object") {
        const {
          bookletData: _bd,
          textSnippet: _ts,
          htmlSnippet: _hs,
          ...rest
        } = rawSlim;
        rawSlim = rest;
      }

      const sterilizationData = lookupResult?.raw?.sterilization ?? null;
      const isSterilized = sterilizationData?.isSterilized ?? null;

      const body = {
        ok: Boolean(lookupResult.ok),
        microchip: lookupResult.microchip || microchip,
        sessionStatus: session.status,
        url: lookupResult.url,

        owner: lookupResult.owner || null,

        sterilizationData,
        isSterilized,
        timeline: lookupResult.timeline || [],
      };

      if (includeSnippets) {
        body.textSnippet = lookupResult.textSnippet || null;
        body.htmlSnippet = lookupResult.htmlSnippet || null;
      }

      if (includeBooklet) {
        body.bookletData = lookupResult.bookletData || null;
      }

      if (includeRaw) {
        body.raw = rawSlim;
      }

      return body;
    })().finally(() => {
      const current = inflightLookups.get(microchip);
      if (current && current.promise === promise) {
        inflightLookups.delete(microchip);
      }
    });

    inflightLookups.set(microchip, { startedAt: Date.now(), promise });

    const result = await promise;
    return res.status(200).json({ requestId, ...result });
  } catch (err) {
    logger.error({
      msg: "Failed to perform registry lookup",
      microchip,
      requestId,
      error: err?.message,
      stack: err?.stack,
    });

    if (!(err instanceof ApiError)) {
      return next(
        new ApiError(503, "Registry lookup failed", {
          code: "REGISTRY_LOOKUP_FAILED",
        })
      );
    }

    return next(err);
  }
}
