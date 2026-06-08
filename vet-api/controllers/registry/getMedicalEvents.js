// vet-api/controllers/registry/getMedicalEvents.js

import { randomUUID } from "node:crypto";

import logger from "../../utils/logger.js";
import ApiError from "../../utils/apiError.js";
import { getRegistrySession, fetchMedicalEvents } from "../../services/registryWorkerClient.js";

/**
 * GET /api/registry/medical-events?microchip=...
 */
export async function getMedicalEventsHandler(req, res, next) {
  const requestId =
    req.requestId ||
    (req.headers["x-request-id"] || "").toString().trim() ||
    randomUUID();

  const microchip = String(req.query.microchip || "").trim();

  if (!microchip) {
    return next(new ApiError(400, "Missing required query param: microchip", {
      code: "VALIDATION_ERROR",
      details: { field: "microchip" },
    }));
  }

  if (!/^\d{15}$/.test(microchip)) {
    return next(new ApiError(400, "Invalid microchip: must be exactly 15 digits", {
      code: "VALIDATION_ERROR",
      details: { field: "microchip" },
    }));
  }

  try {
    logger.info({ msg: "Registry medical-events started", microchip, requestId });

    const session = await getRegistrySession({ requestId });
    if (!session || session.status !== "LOGGED_IN") {
      throw new ApiError(409, "Registry worker is not logged in", {
        code: "WORKER_NOT_LOGGED_IN",
        details: { sessionStatus: session?.status ?? "UNKNOWN" },
      });
    }

    const result = await fetchMedicalEvents(microchip, { requestId });

    return res.status(200).json({
      requestId,
      ok: result.ok,
      found: result.found,
      microchip: result.microchip,
      data: result.data,
    });
  } catch (err) {
    logger.error({
      msg: "Failed to fetch medical events",
      microchip,
      requestId,
      error: err?.message,
    });

    if (!(err instanceof ApiError)) {
      return next(new ApiError(503, "Medical events fetch failed", {
        code: "REGISTRY_MEDICAL_EVENTS_FAILED",
      }));
    }

    return next(err);
  }
}
