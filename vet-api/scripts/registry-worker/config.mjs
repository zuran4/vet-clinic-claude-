// vet-api/scripts/registry-worker/config.mjs

function parseBool(value, defaultValue) {
  if (value === undefined || value === null || value === "") return defaultValue;

  const v = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(v)) return true;
  if (["false", "0", "no", "n", "off"].includes(v)) return false;

  return defaultValue;
}

function parseUrl(value) {
  if (!value) return null;
  try {
    // throws if invalid
    new URL(value);
    return value;
  } catch {
    return null;
  }
}

export const PET_BOOKLET_BASE_URL = parseUrl(process.env.PET_BOOKLET_BASE_URL);

// Χρησιμοποιούμε δικό του user data dir για τον worker (configurable)
export const USER_DATA_DIR =
  process.env.REGISTRY_WORKER_USER_DATA_DIR || "playwright-registry-worker";

// Επιλογή headless από env (REGISTRY_WORKER_HEADLESS=true/false/1/0/yes/no)
// Αν ΔΕΝ υπάρχει καθόλου η μεταβλητή → default true (headless)
export const HEADLESS = parseBool(process.env.REGISTRY_WORKER_HEADLESS, true);
