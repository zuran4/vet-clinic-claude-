// vet-api/controllers/registry/getWorkerState.js

import { getRegistryWorkerState } from "../../services/registryWorkerProcess.js";

/**
 * GET /api/registry/worker/state
 * Enterprise ops endpoint: safe process state only
 */
export function getWorkerState(req, res) {
  const requestId = req.requestId || req.headers["x-request-id"] || null;

  const state = getRegistryWorkerState(req.clinicId);

  // Safe-only fields (no process object)
  const safe = {
    pid: state.pid,
    startedAt: state.startedAt,
    exitedAt: state.exitedAt,
    exitCode: state.exitCode,
    signal: state.signal,
    lastError: state.lastError,
  };

  const running =
    Boolean(state.pid) &&
    state.exitedAt == null &&
    state.exitCode == null &&
    state.signal == null;

  return res.json({
    ok: true,
    requestId,
    worker: safe,
    running,
  });
}
