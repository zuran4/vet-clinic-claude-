// vet-api/services/registryWorkerProcess.js

let registryWorkerProcess = null;

// Enterprise-safe state snapshot (safe to expose via /api/registry/worker/state)
const state = {
  pid: null,
  startedAt: null,
  exitedAt: null,
  exitCode: null,
  signal: null,
  lastError: null,
};

export function getRegistryWorkerProcess() {
  return registryWorkerProcess;
}

export function setRegistryWorkerProcess(proc) {
  registryWorkerProcess = proc;

  state.pid = proc?.pid ?? null;
  state.startedAt = new Date().toISOString();
  state.exitedAt = null;
  state.exitCode = null;
  state.signal = null;
  state.lastError = null;
}

export function clearRegistryWorkerProcess() {
  registryWorkerProcess = null;
}

export function isRegistryWorkerRunning() {
  return !!registryWorkerProcess && !registryWorkerProcess.killed;
}

// ✅ Used by ops endpoint controller
export function getRegistryWorkerState() {
  return { ...state };
}

// ✅ Used by controllers on process error events
export function setRegistryWorkerLastError(message) {
  state.lastError = message ? String(message) : null;
}

// ✅ Used by controllers on process exit events
export function markRegistryWorkerExited(code, signal) {
  state.exitedAt = new Date().toISOString();
  state.exitCode = code ?? null;
  state.signal = signal ?? null;
  state.pid = registryWorkerProcess?.pid ?? state.pid ?? null;
}
