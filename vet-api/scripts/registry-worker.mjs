// scripts/registry-worker.mjs
import "dotenv/config";
import { chromium } from "playwright";
import http from "http";
import { BOOKLET_WIDGET_IDS, extractBookletData } from "./zk-helpers.mjs";
import { autoLoginIfNeeded } from "./login-helpers.mjs";
import { runMicrochipLookupFlow } from "./microchip-flow-helpers.mjs";
import {
  logSessionOncePerChange,
  logStatusOncePerChange,
} from "./registry-worker/logging.mjs";
import { computeSessionStatus } from "./registry-worker/session-status.mjs";
import {
  PET_BOOKLET_BASE_URL,
  USER_DATA_DIR,
  HEADLESS,
} from "./registry-worker/config.mjs";
import { startHttpServer } from "./registry-worker/http-server.mjs";
import { createRegistryContext } from "./registry-worker/browser.mjs";
import { installGracefulShutdown } from "./registry-worker/lifecycle.mjs";
import { runStartupSequence } from "./registry-worker/startup.mjs";

const runtime = {
  sharedPage: null,
  ready: false,
  startedAt: new Date().toISOString(),
  lastError: null,
};

let serverRef = null;
let contextRef = null;

process.on("unhandledRejection", (reason) => {
  console.error("[Registry worker] ❌ unhandledRejection:", reason);
  runtime.lastError = String(reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Registry worker] ❌ uncaughtException:", err);
  runtime.lastError = err?.stack || String(err);
  process.exit(1);
});

console.log(
  "[Registry worker] HEADLESS mode:",
  HEADLESS,
  "(env REGISTRY_WORKER_HEADLESS =",
  process.env.REGISTRY_WORKER_HEADLESS,
  ")"
);

async function main() {
  if (!PET_BOOKLET_BASE_URL) {
    throw new Error("Λείπει PET_BOOKLET_BASE_URL στο .env");
  }

  console.log("[Registry worker] Starting with persistent profile:", USER_DATA_DIR);

  // Ξεκινάμε HTTP server νωρίς. Αν το http-server χειρίζεται sharedPage = null,
  // το API θα μπορεί να βλέπει “starting” κατάσταση αντί για 503 λόγω μη-εκκίνησης worker.
  serverRef = startHttpServer({
    http,
    getSharedPage: () => runtime.sharedPage,
    computeSessionStatus,
    logSessionOncePerChange,
    logStatusOncePerChange,
    PET_BOOKLET_BASE_URL,
    autoLoginIfNeeded,
    runMicrochipLookupFlow,
    BOOKLET_WIDGET_IDS,
    extractBookletData,
  });

  // Persistent context: ο worker είναι ένας "μόνιμος" browser
  const { context, page } = await createRegistryContext({
    chromium,
    userDataDir: USER_DATA_DIR,
    headless: HEADLESS,
  });

  contextRef = context;
  runtime.sharedPage = page;

  // Αν ο browser/page κλείσει απροσδόκητα (crash, π.χ. "Network service crashed"),
  // ο worker έμενε ζωντανός αλλά κολλημένος σε NO_PAGE για πάντα. Κάνουμε exit
  // ώστε το PM2 (autorestart: true) να τον ξανασηκώσει με φρέσκο browser —
  // το startup sequence ήδη κάνει login αυτόματα.
  const exitForRestart = (reason) => {
    console.error(`[Registry worker] ⚠️ ${reason} — τερματισμός για αυτόματο restart από PM2.`);
    process.exit(1);
  };
  page.once("close", () => exitForRestart("Η σελίδα έκλεισε απροσδόκητα"));
  context.once("close", () => exitForRestart("Το browser context έκλεισε απροσδόκητα"));

  installGracefulShutdown({ context: contextRef, server: serverRef });

  await runStartupSequence({
    page,
    PET_BOOKLET_BASE_URL,
    HEADLESS,
    autoLoginIfNeeded,
  });

  runtime.ready = true;
  console.log("[Registry worker] Ready.");

  // Περιμένουμε μέχρι να κλείσει ο server (graceful shutdown).
  await new Promise((resolve) => serverRef.on("close", resolve));
}

main().catch((err) => {
  console.error("❌ Σφάλμα στο registry-worker.mjs:", err);
  runtime.lastError = err?.stack || String(err);
  process.exit(1);
});
