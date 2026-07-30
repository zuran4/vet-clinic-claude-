// vet-api/controllers/registry/stopWorker.js

import logger from "../../utils/logger.js";
import ApiError from "../../utils/apiError.js";
import {
  getRegistryWorkerProcess,
  clearRegistryWorkerProcess,
  isRegistryWorkerRunning,
  setRegistryWorkerLastError,
  markRegistryWorkerExited,
} from "../../services/registryWorkerProcess.js";

function getRequestId(req) {
  return (
    req.requestId ||
    (req.headers["x-request-id"] || "").toString().trim() ||
    (req.headers["x-correlation-id"] || "").toString().trim() ||
    null
  );
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * POST /api/registry/worker/stop
 */
export async function stopWorker(req, res, next) {
  const requestId = getRequestId(req);
  const clinicId = req.clinicId;

  try {
    if (!isRegistryWorkerRunning(clinicId)) {
      // Ensure state is clean
      clearRegistryWorkerProcess(clinicId);
      setRegistryWorkerLastError(clinicId, null);

      return res.status(200).json({
        ok: true,
        stopped: false,
        alreadyStopped: true,
        message: "Registry worker is not running",
        clinicId,
        requestId,
      });
    }

    const proc = getRegistryWorkerProcess(clinicId);
    const previousPid = proc?.pid ?? null;

    logger.info({
      msg: "Stopping registry worker process on request",
      clinicId,
      requestId,
      pid: previousPid,
    });

    // Clear last error on explicit stop
    setRegistryWorkerLastError(clinicId, null);

    // Graceful first
    try {
      proc.kill("SIGTERM");
    } catch (killError) {
      logger.warn({
        msg: "Error while sending SIGTERM to registry worker",
        requestId,
        pid: previousPid,
        error: killError?.message,
      });
    }

    // Wait a bit for graceful shutdown
    await sleep(800);

    // Force kill if still running
    try {
      if (isRegistryWorkerRunning(clinicId)) {
        const p2 = getRegistryWorkerProcess(clinicId);
        p2?.kill("SIGKILL");
      }
    } catch (killError) {
      logger.warn({
        msg: "Error while sending SIGKILL to registry worker",
        requestId,
        pid: previousPid,
        error: killError?.message,
      });
    }

    // Wait again to see if it actually died
    await sleep(500);

    if (isRegistryWorkerRunning(clinicId)) {
      // Still alive: do not lie to caller
      return next(
        new ApiError(500, "Registry worker did not stop", {
          code: "WORKER_STOP_TIMEOUT",
          expose: false,
          details: { pid: previousPid },
        })
      );
    }

    // Mark state as exited (best-effort)
    markRegistryWorkerExited(clinicId, null, "STOPPED_BY_API");
    clearRegistryWorkerProcess(clinicId);

    return res.status(200).json({
      ok: true,
      stopped: true,
      previousPid,
      requestId,
    });
  } catch (err) {
    logger.error({
      msg: "Unexpected error while stopping registry worker process",
      requestId,
      error: err?.message,
      stack: err?.stack,
    });

    return next(
      err instanceof ApiError
        ? err
        : new ApiError(500, "Failed to stop registry worker", {
            code: "WORKER_STOP_FAILED",
            expose: false,
          })
    );
  }
}
