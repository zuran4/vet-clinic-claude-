// vet-api/services/registryWorkerProcess.js
//
// Κάθε κλινική έχει το δικό της registry-worker process (Playwright, login
// gov.gr) — πλήρης απομόνωση session/ταυτότητας μεταξύ κλινικών. Ο παλιός
// σχεδιασμός είχε ΕΝΑ global process· εδώ κρατάμε ένα Map<clinicId, entry>.

const workers = new Map(); // clinicId -> { proc, state }

function emptyState() {
  return {
    pid: null,
    startedAt: null,
    exitedAt: null,
    exitCode: null,
    signal: null,
    lastError: null,
  };
}

function entryFor(clinicId) {
  let entry = workers.get(clinicId);
  if (!entry) {
    entry = { proc: null, state: emptyState() };
    workers.set(clinicId, entry);
  }
  return entry;
}

export function getRegistryWorkerProcess(clinicId) {
  return workers.get(clinicId)?.proc ?? null;
}

export function setRegistryWorkerProcess(clinicId, proc) {
  const entry = entryFor(clinicId);
  entry.proc = proc;
  entry.state = {
    pid: proc?.pid ?? null,
    startedAt: new Date().toISOString(),
    exitedAt: null,
    exitCode: null,
    signal: null,
    lastError: null,
  };
}

export function clearRegistryWorkerProcess(clinicId) {
  const entry = workers.get(clinicId);
  if (entry) entry.proc = null;
}

export function isRegistryWorkerRunning(clinicId) {
  const proc = workers.get(clinicId)?.proc;
  return !!proc && !proc.killed;
}

// ✅ Used by ops endpoint controller
export function getRegistryWorkerState(clinicId) {
  return { ...entryFor(clinicId).state };
}

// ✅ Used by controllers on process error events
export function setRegistryWorkerLastError(clinicId, message) {
  entryFor(clinicId).state.lastError = message ? String(message) : null;
}

// ✅ Used by controllers on process exit events
export function markRegistryWorkerExited(clinicId, code, signal) {
  const entry = entryFor(clinicId);
  entry.state.exitedAt = new Date().toISOString();
  entry.state.exitCode = code ?? null;
  entry.state.signal = signal ?? null;
  entry.state.pid = entry.proc?.pid ?? entry.state.pid ?? null;
}

// Λίστα όλων των clinicId που έχουν (ή είχαν) worker entry — χρήσιμο για ops/debug.
export function listTrackedClinicIds() {
  return [...workers.keys()];
}
