// vet-api/services/registryWorkerLauncher.js
// Κοινή λογική εκκίνησης του registry worker process — ανά κλινική. Κάθε
// κλινική τρέχει το δικό της process, σε δικό της port, με δικό του browser
// profile (playwright-registry-worker-<clinicId>) και δικά του credentials
// gov.gr — πλήρης απομόνωση, καμία κλινική δεν βλέπει session άλλης.

import { spawn } from "node:child_process";

import logger from "../utils/logger.js";
import { decrypt } from "../utils/crypto.js";
import { getTenantModel } from "./adminConnection.js";
import { getTenantModels } from "./tenantConnectionManager.js";
import { nextRegistryWorkerPort } from "./tenants/provisionTenant.js";
import {
  getRegistryWorkerProcess,
  setRegistryWorkerProcess,
  clearRegistryWorkerProcess,
  isRegistryWorkerRunning,
  setRegistryWorkerLastError,
  markRegistryWorkerExited,
} from "./registryWorkerProcess.js";

// Εξασφαλίζει ότι η κλινική έχει ανατεθειμένο port — self-heal για tenants
// που δημιουργήθηκαν πριν προστεθεί το πεδίο registryWorkerPort.
async function ensureWorkerPort(clinicId) {
  const Tenant = getTenantModel();
  let tenant = await Tenant.findOne({ clinicId });
  if (!tenant) throw new Error(`Άγνωστη κλινική: ${clinicId}`);

  if (!tenant.registryWorkerPort) {
    tenant.registryWorkerPort = await nextRegistryWorkerPort(Tenant);
    await tenant.save();
    logger.info({
      msg: "Ανατέθηκε νέο registryWorkerPort (self-heal)",
      clinicId,
      registryWorkerPort: tenant.registryWorkerPort,
    });
  }

  return tenant.registryWorkerPort;
}

export async function startRegistryWorkerProcess({ clinicId, requestId = null } = {}) {
  if (!clinicId) throw new Error("startRegistryWorkerProcess: clinicId is required");

  if (isRegistryWorkerRunning(clinicId)) {
    return { ok: true, alreadyRunning: true, pid: getRegistryWorkerProcess(clinicId)?.pid, clinicId };
  }

  const port = await ensureWorkerPort(clinicId);

  // Ρυθμίσεις + credentials gov.gr της συγκεκριμένης κλινικής — απευθείας
  // από τη βάση της (όχι HTTP loopback στο ίδιο API, πιο απλό & αξιόπιστο).
  let headless = true;
  let govUsername = "";
  let govPassword = "";
  try {
    const { Settings } = getTenantModels(clinicId);
    const settings = await Settings.findOne().lean();
    if (settings) {
      if (typeof settings.registryWorkerHeadless === "boolean") {
        headless = settings.registryWorkerHeadless;
      }
      govUsername = settings.registryGov?.username || "";
      govPassword = settings.registryGov?.password ? decrypt(settings.registryGov.password) : "";
    }
  } catch (err) {
    logger.warn({
      msg: "Could not load clinic settings before starting registry worker (using defaults)",
      clinicId,
      requestId,
      error: err?.message,
    });
  }

  const childEnv = {
    ...process.env,
    CLINIC_ID: clinicId,
    REGISTRY_WORKER_PORT: String(port),
    REGISTRY_WORKER_USER_DATA_DIR: `playwright-registry-worker-${clinicId}`,
    REGISTRY_WORKER_HEADLESS: headless ? "true" : "false",
    // ΡΗΤΗ αντικατάσταση (όχι μόνο conditional override) — το ...process.env
    // παραπάνω κληρονομεί το global PET_USERNAME/PET_PASSWORD του .env, που
    // ανήκουν σε ΑΛΛΗ κλινική. Καμία κλινική δεν πρέπει ποτέ να "δανείζεται"
    // σιωπηλά την ταυτότητα άλλης — αν δεν έχει δικά της credentials, μένει
    // χωρίς αυτόματο login (ασφαλές no-op, βλ. login-helpers.mjs).
    PET_USERNAME: govUsername || "",
    PET_PASSWORD: govPassword || "",
  };

  const child = spawn("node", ["scripts/registry-worker.mjs"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: childEnv,
  });

  setRegistryWorkerProcess(clinicId, child);

  child.on("exit", (code, signal) => {
    markRegistryWorkerExited(clinicId, code, signal);
    clearRegistryWorkerProcess(clinicId);

    logger.warn({
      msg: "Registry worker process exited",
      clinicId,
      requestId,
      pid: child.pid,
      code,
      signal,
    });
  });

  child.on("error", (err) => {
    setRegistryWorkerLastError(clinicId, err?.message);

    logger.error({
      msg: "Registry worker process error event",
      clinicId,
      requestId,
      pid: child.pid,
      error: err?.message,
      stack: err?.stack,
    });
  });

  return { ok: true, started: true, pid: child.pid, port, clinicId, registryWorkerHeadless: headless };
}
