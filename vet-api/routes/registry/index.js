// vet-api/routes/registry/index.js

import crypto from "crypto";

import express from "express";

import ApiError from "../../utils/apiError.js";
import requireRole from "../../middlewares/auth/requireRole.js";
import { getSession } from "../../controllers/registry/getSession.js";
import { startWorker } from "../../controllers/registry/startWorker.js";
import { stopWorker } from "../../controllers/registry/stopWorker.js";
import { lookupMicrochipHandler } from "../../controllers/registry/lookupMicrochip.js";
import { getWorkerState } from "../../controllers/registry/getWorkerState.js";
import { getRegistryHistory, addRegistryHistoryEntry } from "../../controllers/registry/searchHistory.js";

const router = express.Router();

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const asyncHandler =
  (fn) =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// ✅ RequestId: prefer global middleware from server.js, fallback only if missing
// ✅ Always set headers (x-request-id + X-Request-Id)
router.use((req, res, next) => {
  if (!req.requestId) {
    const requestId =
      (req.headers["x-request-id"] || "").toString().trim() ||
      (req.headers["x-correlation-id"] || "").toString().trim() ||
      crypto.randomUUID();

    req.requestId = requestId;
  }

  // Always emit both header variants (helps proxies/tools)
  res.setHeader("x-request-id", req.requestId);
  res.setHeader("X-Request-Id", req.requestId);

  next();
});

function validateMicrochipQuery(req, _res, next) {
  const microchip = String(req.query.microchip || "").trim();

  if (!microchip) {
    return next(
      new ApiError(400, "Missing required query param: microchip", {
        code: "VALIDATION_ERROR",
        details: { field: "microchip" },
        expose: true,
      })
    );
  }

  // Microchips are typically numeric; keep the validation strict to avoid garbage input.
  // Adjust range if your registry accepts different formats.
  const isValid = /^\d{10,20}$/.test(microchip);
  if (!isValid) {
    return next(
      new ApiError(400, "Invalid microchip format", {
        code: "VALIDATION_ERROR",
        details: { field: "microchip", expected: "10-20 digits" },
        expose: true,
      })
    );
  }

  next();
}

/**
 * POST /api/registry/worker/start
 */
router.post("/worker/start", requireRole("admin"), asyncHandler(startWorker));

/**
 * POST /api/registry/worker/stop
 */
router.post("/worker/stop", requireRole("admin"), asyncHandler(stopWorker));

/**
 * GET /api/registry/worker/state
 */
router.get("/worker/state", asyncHandler(getWorkerState));

/**
 * GET /api/registry/session
 */
router.get("/session", asyncHandler(getSession));

/**
 * GET /api/registry/lookup?microchip=...
 */
router.get("/lookup", validateMicrochipQuery, asyncHandler(lookupMicrochipHandler));

/**
 * GET /api/registry/history
 */
router.get("/history", asyncHandler(getRegistryHistory));

/**
 * POST /api/registry/history
 */
router.post("/history", asyncHandler(addRegistryHistoryEntry));

export default router;
