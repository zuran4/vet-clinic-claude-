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

  try {
    const result = await startRegistryWorkerProcess({ requestId });

    if (result.alreadyRunning) {
      return res.status(200).json({ ok: true, alreadyRunning: true, pid: result.pid, requestId });
    }

    return res.status(201).json({
      ok: true,
      started: true,
      pid: result.pid,
      registryWorkerHeadless: result.registryWorkerHeadless,
      requestId,
    });
  } catch (err) {
    logger.error({
      msg: "Unexpected error while starting registry worker process",
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
