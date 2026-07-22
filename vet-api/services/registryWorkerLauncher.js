// vet-api/services/registryWorkerLauncher.js
// Κοινή λογική εκκίνησης του registry worker process — χρησιμοποιείται τόσο
// από το POST /api/registry/worker/start όσο και αυτόματα στο boot του server.

import { spawn } from "node:child_process";

import config from "../config/index.js";
import logger from "../utils/logger.js";
import {
  getRegistryWorkerProcess,
  setRegistryWorkerProcess,
  clearRegistryWorkerProcess,
  isRegistryWorkerRunning,
  setRegistryWorkerLastError,
  markRegistryWorkerExited,
} from "./registryWorkerProcess.js";

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

export async function startRegistryWorkerProcess({ requestId = null } = {}) {
  if (isRegistryWorkerRunning()) {
    return { ok: true, alreadyRunning: true, pid: getRegistryWorkerProcess()?.pid };
  }

  // Default headless = true
  let headlessFromSettings = true;

  const apiBaseUrl = String(
    process.env.API_BASE_URL || `http://localhost:${config.port}`
  ).replace(/\/+$/, "");

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
      msg: "Could not load settings before starting registry worker (using default headless=true)",
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

  setRegistryWorkerProcess(child);

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

  return { ok: true, started: true, pid: child.pid, registryWorkerHeadless: headlessFromSettings };
}
