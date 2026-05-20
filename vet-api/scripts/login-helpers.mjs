// scripts/login-helpers.mjs
import "dotenv/config";
import { computeSessionStatus } from "./registry-worker/session-status.mjs";

const PET_USERNAME = process.env.PET_USERNAME || null;
const PET_PASSWORD = process.env.PET_PASSWORD || null;

// Optional debug logs (default false)
const LOGIN_DEBUG = (process.env.LOGIN_DEBUG ?? "false").toLowerCase() === "true";

function logDebug(...args) {
  if (LOGIN_DEBUG) console.log(...args);
}

/**
 * Βοηθητικό: δοκιμάζει να γεμίσει πεδίο με selectors.
 */
async function tryFillField(page, selectors, value, labelForLog) {
  for (const sel of selectors) {
    try {
      const locator = page.locator(sel).first();
      const count = await locator.count().catch(() => 0);
      if (count > 0) {
        await locator.fill(value, { timeout: 8000 }).catch(() => {});
        logDebug(`   ➜ Filled ${labelForLog} with selector: ${sel}`);
        return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
}

/**
 * Βοηθητικό: δοκιμάζει να πατήσει submit.
 */
async function tryClickSubmit(page, selectors) {
  for (const sel of selectors) {
    try {
      const locator = page.locator(sel).first();
      const count = await locator.count().catch(() => 0);
      if (count > 0) {
        await locator.click({ timeout: 8000 }).catch(() => {});
        logDebug(`   ➜ Click submit with selector: ${sel}`);
        return true;
      }
    } catch {
      // ignore
    }
  }

  try {
    await page.getByRole("button", { name: /Σύνδεση/i }).first().click({ timeout: 8000 });
    logDebug('   ➜ Click submit via getByRole("button", /Σύνδεση/)');
    return true;
  } catch {
    // ignore
  }

  try {
    await page.getByText("Σύνδεση").first().click({ timeout: 8000 });
    logDebug('   ➜ Click submit via getByText("Σύνδεση")');
    return true;
  } catch {
    // ignore
  }

  return false;
}

/**
 * Χειρισμός OAuth2 consent (GSIS):
 * - radio Continue
 * - btn-submit Send
 *
 * Επιστρέφει true αν το χειρίστηκε (βρήκε btn-submit), αλλιώς false.
 */
async function handleGsisConsentIfNeeded(page) {
  try {
    await page.waitForTimeout(400);

    const consentBtn = page.locator("#btn-submit").first();
    const hasBtn = (await consentBtn.count().catch(() => 0)) > 0;
    if (!hasBtn) return false;

    console.log("👣 GSIS consent: Continue + Send...");

    try {
      await page.check('input[name="scope.read"][value="true"]', { timeout: 3000 });
      logDebug('   ➜ Checked radio Continue (scope.read=true)');
    } catch {
      logDebug("   ⚠️ Radio Continue not checked (maybe already).");
    }

    try {
      await consentBtn.click({ timeout: 8000 });
      logDebug('   ➜ Clicked Send (#btn-submit)');
    } catch (e) {
      console.log("   ❌ Failed to click #btn-submit:", e?.message || String(e));
      return true; // βρήκε consent αλλά απέτυχε click
    }

    await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1200);
    return true;
  } catch (e) {
    logDebug("⚠️ handleGsisConsentIfNeeded error:", e?.message || String(e));
    return false;
  }
}

/**
 * Auto-login:
 * - Δεν κάνει spam logs όταν είσαι ήδη μέσα.
 * - Επιστρέφει object για να ξέρεις αν προσπάθησε/πέτυχε.
 *
 * Σημαντικό: Το session-status είναι πλέον single-source-of-truth από:
 * ./registry-worker/session-status.mjs
 */
export async function autoLoginIfNeeded(page) {
  const before = await computeSessionStatus(page);

  // Αν είμαστε ήδη μέσα, δεν κάνουμε τίποτα (και δεν log-άρουμε).
  if (before.status === "LOGGED_IN") {
    return {
      attempted: false,
      didLogin: false,
      success: true,
      before,
      after: before,
      reason: "Already logged in",
    };
  }

  // Αν δεν έχει creds, δεν προσπαθούμε.
  if (!PET_USERNAME || !PET_PASSWORD) {
    console.log("ℹ️ PET_USERNAME/PET_PASSWORD δεν υπάρχουν στο .env → skip auto-login.");
    return {
      attempted: false,
      didLogin: false,
      success: false,
      before,
      after: before,
      reason: "Missing credentials",
    };
  }

  // Βασικό settle
  await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);

  try {
    // Αν είμαστε σε PRE_LOGIN, πάτα την κάρτα "Ιδιώτης Κτηνίατρος" για να πας στο login flow
    if (before.status === "PRE_LOGIN") {
      try {
        await page.getByText("Ιδιώτης Κτηνίατρος", { exact: true }).first().click({ timeout: 8000 });
        await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(600);
      } catch {
        // ignore
      }
    }

    // Ξανα-έλεγχος μετά από πιθανό click
    const mid = await computeSessionStatus(page);
    if (mid.status === "LOGGED_IN") {
      return {
        attempted: true,
        didLogin: false,
        success: true,
        before,
        after: mid,
        reason: "Already logged in (after pre-login step)",
      };
    }

    // Αν δεν είμαστε σε login, μην κάνεις “φανταστικό login”
    if (mid.status !== "NEEDS_LOGIN") {
      return {
        attempted: true,
        didLogin: false,
        success: false,
        before,
        after: mid,
        reason: `Not on login page (status=${mid.status})`,
      };
    }

    // Προσπάθεια συμπλήρωσης TAXIS πεδίων
    const userOk = await tryFillField(
      page,
      ['input[name="j_username"]', "#j_username", 'input[id*="username"]'],
      PET_USERNAME,
      "username"
    );

    const passOk = await tryFillField(
      page,
      ['input[name="j_password"]', "#j_password", 'input[type="password"]'],
      PET_PASSWORD,
      "password"
    );

    if (!userOk || !passOk) {
      const after = await computeSessionStatus(page);
      return {
        attempted: true,
        didLogin: false,
        success: false,
        before,
        after,
        reason: "Could not fill login fields",
      };
    }

    // Submit
    await tryClickSubmit(page, ["#btn-login-submit", 'button[type="submit"]', 'input[type="submit"]']);

    // Περιμένουμε redirect/login
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(900);

    // GSIS consent, αν εμφανιστεί
    await handleGsisConsentIfNeeded(page);

    await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(900);

    const after = await computeSessionStatus(page);

    return {
      attempted: true,
      didLogin: true,
      success: after.status === "LOGGED_IN",
      before,
      after,
      reason: after.status === "LOGGED_IN"
        ? "Login success"
        : `Login not confirmed (status=${after.status})`,
    };
  } catch (e) {
    const after = await computeSessionStatus(page).catch(() => before);
    return {
      attempted: true,
      didLogin: false,
      success: false,
      before,
      after,
      reason: `autoLoginIfNeeded error: ${e?.message || String(e)}`,
    };
  }
}
