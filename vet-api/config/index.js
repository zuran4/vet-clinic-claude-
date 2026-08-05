// ===============================================
// 📄 config/index.js (ESM)
// Στόχος: αξιόπιστη φόρτωση .env + καθαρή επικύρωση (enterprise-safe)
// ===============================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";

// -----------------------------------------------
// ESM __dirname / __filename
// -----------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------
// Load .env (optional)
// 1) process.cwd() (npm start από vet-api)
// 2) fallback: parent of config/
// -----------------------------------------------
const candidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "..", ".env"),
];

let loadedFrom = null;
for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    loadedFrom = p;
    break;
  }
}

// -----------------------------------------------
// Helpers
// -----------------------------------------------
function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === "") {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
  return v;
}

function optionalEnv(key, fallback = "") {
  const v = process.env[key];
  return v == null || String(v).trim() === "" ? fallback : v;
}

function toInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(value, fallback = false) {
  if (value == null) return fallback;
  const s = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(s)) return true;
  if (["0", "false", "no", "off"].includes(s)) return false;
  return fallback;
}

function toList(value) {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Mask URIs ώστε να μη γράφουμε μυστικά στα logs
function maskMongoUri(uri) {
  if (!uri) return uri;
  return uri.replace(/(mongodb(\+srv)?:\/\/)([^:/\s]+):([^@]+)@/i, "$1$3:***@");
}

// -----------------------------------------------
// Environment flags
// -----------------------------------------------
const env = (process.env.NODE_ENV || "development").toLowerCase();
const isProd = env === "production";
const isDev = !isProd;

// -----------------------------------------------
// Required vars (fail-fast)
// -----------------------------------------------
const mongoUri      = requireEnv("MONGO_URI");
const jwtSecret     = requireEnv("JWT_SECRET");
const encryptionKey = requireEnv("ENCRYPTION_KEY");

// CORS: σε production θέλουμε explicit allowlist
const corsOrigins = toList(process.env.CORS_ORIGINS);
if (isProd && corsOrigins.length === 0) {
  console.error("❌ Missing CORS_ORIGINS in production.");
  process.exit(1);
}

// -----------------------------------------------
// Optional / defaults
// -----------------------------------------------
const port = toInt(process.env.PORT, 5000);
const logLevel = optionalEnv("LOG_LEVEL", "info");

const jwtExpiresIn = optionalEnv("JWT_EXPIRES_IN", "15m");

// Service-to-service auth για /api/internal/* (π.χ. το control plane) —
// κενό default σκόπιμα: αν δεν έχει οριστεί, το requireServiceKey μπλοκάρει τα πάντα.
const internalApiKey = optionalEnv("INTERNAL_API_KEY", "");

const redisUrl = optionalEnv("REDIS_URL", "");

// Δημόσια διεύθυνση αυτού του backend — χρειάζεται για απόλυτα URLs μέσα σε
// emails (π.χ. λογότυπο), αφού οι παραλήπτες τα ανοίγουν εκτός της εφαρμογής
// και δεν υπάρχει "τρέχον origin" να συμπληρώσει σχετικά paths.
const publicBaseUrl = optionalEnv("PUBLIC_BASE_URL", "").replace(/\/+$/, "");

// MASTER ADMIN APP (control-plane) event reporting — κενό = σιωπηλά off.
const controlPlaneApiUrl = optionalEnv("CONTROL_PLANE_API_URL", "");
const controlPlaneEventsKey = optionalEnv("CONTROL_PLANE_EVENTS_KEY", "");

// Registry worker
const registryWorkerUrl = optionalEnv("REGISTRY_WORKER_URL", "http://localhost:5051");
const registryWorkerHeadless = toBool(process.env.REGISTRY_WORKER_HEADLESS, true);

// Pet.gov.gr base + credentials (optional αλλά συνήθως required όταν δουλεύει ο worker)
const petBookletBaseUrl = optionalEnv(
  "PET_BOOKLET_BASE_URL",
  "https://pet.gov.gr/emzs-backoffice/"
);
const petUsername = optionalEnv("PET_USERNAME", "");
const petPassword = optionalEnv("PET_PASSWORD", "");

// -----------------------------------------------
// Export unified config (do not expose secrets in debug)
// -----------------------------------------------
const config = Object.freeze({
  env,
  isProd,
  isDev,

  port,
  logLevel,

  mongoUri,
  jwtSecret,
  jwtExpiresIn,
  encryptionKey,
  internalApiKey,

  redisUrl,
  publicBaseUrl,

  controlPlane: {
    apiUrl: controlPlaneApiUrl,
    eventsKey: controlPlaneEventsKey,
  },

  corsOrigins,

  registryWorker: {
    url: registryWorkerUrl,
    headless: registryWorkerHeadless,
  },

  petGov: {
    baseUrl: petBookletBaseUrl,
    username: petUsername,
    password: petPassword,
  },

  debug: {
    envLoadedFrom: loadedFrom,
    maskedMongoUri: maskMongoUri(mongoUri),
    corsOriginsCount: corsOrigins.length,
    registryWorkerUrl: registryWorkerUrl,
    petBookletBaseUrl: petBookletBaseUrl,
  },
});

export default config;
