// vet-api/controllers/registry/startWorker.js

import logger from "../../utils/logger.js";
import ApiError from "../../utils/apiError.js";
import { startRegistryWorkerProcess } from "../../services/registryWorkerLauncher.js";

function getRequestId(req) {
  return (
    req.requestId ||
    (req.headers["x-request-id"] || "").toString().trim() ||
    (req.headers["x-correlation-id"] || "").toString().trim() ||
    null
  );
}

/**
 * POST /api/registry/worker/start
 */
export async function startWorker(req, res, next) {
  const requestId = getRequestId(req);
  const clinicId = req.clinicId;

  try {
    const result = await startRegistryWorkerProcess({ clinicId, requestId });

    if (result.alreadyRunning) {
      return res.status(200).json({ ok: true, alreadyRunning: true, pid: result.pid, clinicId, requestId });
    }

    return res.status(201).json({
      ok: true,
      started: true,
      pid: result.pid,
      port: result.port,
      registryWorkerHeadless: result.registryWorkerHeadless,
      clinicId,
      requestId,
    });
  } catch (err) {
    logger.error({
      msg: "Unexpected error while starting registry worker process",
      clinicId,
      requestId,
      error: err?.message,
      stack: err?.stack,
    });

    return next(
      err instanceof ApiError
        ? err
        : new ApiError(500, "Failed to start registry worker", {
            code: "WORKER_START_FAILED",
          })
    );
  }
}
