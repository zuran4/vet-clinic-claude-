// vet-api/controllers/registry/startWorker.js

import { spawn } from "node:child_process";
import config from "../../config/index.js";
import logger from "../../utils/logger.js";
import ApiError from "../../utils/apiError.js";
import {
  getRegistryWorkerProcess,
  setRegistryWorkerProcess,
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

async function fetchJsonWithTimeout(url, timeoutMs = 2500, headers = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    const json = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, json };
  } catch (err) {
    if (err?.name === "AbortError") {
      return { ok: false, status: 504, json: null, timeout: true };
    }
    return { ok: false, status: 500, json: null, error: err?.message };
  } finally {
    clearTimeout(t);
  }
}

/**
 * POST /api/registry/worker/start
 */
export async function startWorker(req, res, next) {
  const requestId = getRequestId(req);

  try {
    if (isRegistryWorkerRunning()) {
      const pid = getRegistryWorkerProcess()?.pid;
      return res.status(200).json({
        ok: true,
        alreadyRunning: true,
        pid,
        requestId,
      });
    }

    // Default headless = true
    let headlessFromSettings = true;

    // Self-call base URL (env first)
    const apiBaseUrl = String(
      process.env.API_BASE_URL || `http://localhost:${config.port}`
    ).replace(/\/+$/, "");

    // Load settings with timeout (avoid hanging start)
    const settingsUrl = `${apiBaseUrl}/api/settings`;

    const settingsRes = await fetchJsonWithTimeout(settingsUrl, 2500, {
      ...(requestId ? { "x-request-id": String(requestId) } : {}),
    });

    if (settingsRes.ok && settingsRes.json) {
      const raw = settingsRes.json.registryWorkerHeadless;
      if (typeof raw === "boolean") headlessFromSettings = raw;

      logger.info({
        msg: "Loaded registryWorkerHeadless from settings",
        requestId,
        registryWorkerHeadless: headlessFromSettings,
        rawType: typeof raw,
        rawValue: raw,
      });
    } else {
      logger.warn({
        msg: "Could not load settings before starting worker (using default headless=true)",
        requestId,
        status: settingsRes.status,
        timeout: Boolean(settingsRes.timeout),
        error: settingsRes.error,
      });
    }

    const childEnv = {
      ...process.env,
      REGISTRY_WORKER_HEADLESS: headlessFromSettings ? "true" : "false",
    };

    const child = spawn("node", ["scripts/registry-worker.mjs"], {
      cwd: process.cwd(),
      stdio: "inherit",
      env: childEnv,
    });

    // Save process + initialize state snapshot
    setRegistryWorkerProcess(child);

    // Keep state accurate for /api/registry/worker/state
    child.on("exit", (code, signal) => {
      markRegistryWorkerExited(code, signal);
      clearRegistryWorkerProcess();

      logger.warn({
        msg: "Registry worker process exited",
        requestId,
        pid: child.pid,
        code,
        signal,
      });
    });

    child.on("error", (err) => {
      setRegistryWorkerLastError(err?.message);

      logger.error({
        msg: "Registry worker process error event",
        requestId,
        pid: child.pid,
        error: err?.message,
        stack: err?.stack,
      });
    });

    return res.status(201).json({
      ok: true,
      started: true,
      pid: child.pid,
      registryWorkerHeadless: headlessFromSettings,
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
