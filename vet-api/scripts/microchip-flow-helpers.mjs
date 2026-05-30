// scripts/microchip-flow-helpers.mjs

import {
  BOOKLET_WIDGET_IDS,
  extractBookletData,
  extractOwnerData,
  extractSterilizationData,
  extractVaccinationFromBooklet,
  waitSterilizationWidgets,
} from "./zk-helpers.mjs";

/**
 * Πλήρης ροή lookup microchip:
 * 1) Πηγαίνει σε search page
 * 2) Αναζήτηση + άνοιγμα booklet
 * 3) Extract booklet
 * 4) Άνοιγμα owner + extract owner
 * 5) Επιστροφή στο booklet (robust)
 * 6) Άνοιγμα sterilization + extract sterilization
 * 7) Επιστροφή σε search page
 *
 * Commercial contract:
 * - ΠΑΝΤΑ επιστρέφει:
 *   { ok, found, reason, microchip, pet, owner, sterilization }
 * - ok=false μόνο σε “σφάλμα worker” (exception/flow error).
 * - found=false όταν το lookup ολοκληρώθηκε αλλά δεν βρέθηκε αποτέλεσμα ή δεν άνοιξε booklet.
 */
export async function runMicrochipLookupFlow(page, microchip) {
  const trimmed = (microchip || "").trim();
  console.log("🔍 runMicrochipLookupFlow (DOM+ZK) για microchip:", trimmed);

  const keys = (obj) =>
    obj && typeof obj === "object" ? Object.keys(obj) : null;

  const result = (overrides) => ({
    ok: true,
    found: false,
    reason: "UNKNOWN",
    microchip: trimmed,
    pet: null,
    owner: null,
    sterilization: null,
    vaccination: null,
    ...overrides,
  });

  try {
    // 0) Sanity
    if (!trimmed) {
      return result({ ok: true, found: false, reason: "MISSING_MICROCHIP" });
    }

    // 1) Go to search page
    const inSearch = await goToAnimalSearchPage(page);
    if (!inSearch) {
      return result({ ok: false, found: false, reason: "SEARCH_PAGE_NOT_REACHED" });
    }

    // 2) Search -> Open booklet
    const opened = await searchAndOpenBooklet(page, trimmed);
    if (!opened) {
      console.log("⚠️ [runMicrochipLookupFlow] Δεν άνοιξε booklet. Πιθανό NO RESULTS.");
      return result({
        ok: true,
        found: false,
        reason: "NO_RESULTS_OR_OPEN_FAILED",
      });
    }

    // 3) Extract pet (booklet) + vaccination (ενώ είμαστε στη σελίδα του booklet)
    const pet = await extractBookletData(page);
    console.log("ℹ️ [runMicrochipLookupFlow] pet keys:", keys(pet));

    const vaccination = await extractVaccinationFromBooklet(page);
    console.log("ℹ️ [runMicrochipLookupFlow] vaccination:", vaccination);

    // Αν δεν έχουμε managedBy, σταματάμε εδώ (booklet άνοιξε, απλώς δεν έχουμε owner flow)
    if (!pet?.managedBy) {
      console.log("⚠️ Δεν υπάρχει managedBy. Παρακάμπτω owner/στείρωση.");
      await goToAnimalSearchPage(page);

      return result({
        ok: true,
        found: true,
        reason: "BOOKLET_OPENED_NO_MANAGEDBY",
        pet,
        owner: null,
        sterilization: null,
        vaccination,
      });
    }

    // 4) Owner
    await openOwnerDetailsFromBooklet(page);

    const ownerReady = await waitOwnerReady(page);
    if (!ownerReady) {
      console.log("⚠️ [runMicrochipLookupFlow] Δεν επιβεβαίωσα owner view εγκαίρως.");
      // Δεν αποτυγχάνουμε εδώ. Προσπαθούμε extract.
    }

    const owner = await extractOwnerData(page);
    console.log("ℹ️ [runMicrochipLookupFlow] owner keys:", keys(owner));

    // 5) Return to booklet (robust)
    const backToBooklet = await returnFromOwnerToBooklet(page);
    if (!backToBooklet) {
      console.log(
        "⚠️ [runMicrochipLookupFlow] Δεν γύρισα αξιόπιστα στο booklet. Κάνω 1 re-open από search."
      );

      await goToAnimalSearchPage(page);
      const reopened = await searchAndOpenBooklet(page, trimmed);

      if (!reopened) {
        console.log("⚠️ [runMicrochipLookupFlow] Re-open απέτυχε. Παρακάμπτω στείρωση.");
        await goToAnimalSearchPage(page);

        return result({
          ok: true,
          found: true,
          reason: "OWNER_OK_STERILIZATION_SKIPPED_REOPEN_FAILED",
          pet,
          owner,
          sterilization: null,
        });
      }
    }

    // 6) Sterilization
    let sterilization = null;

    const sterilizationOpened = await openSterilizationFromBooklet(page);
    if (!sterilizationOpened) {
      console.log("⚠️ [runMicrochipLookupFlow] Δεν άνοιξε η στείρωση. Επιστρέφω.");
      await goToAnimalSearchPage(page);

      return result({
        ok: true,
        found: true,
        reason: "OWNER_OK_STERILIZATION_OPEN_FAILED",
        pet,
        owner,
        sterilization: null,
      });
    }

    const sterReady = await waitSterilizationWidgets(page, 8000);
    if (!sterReady) {
      console.log("⚠️ [runMicrochipLookupFlow] Δεν επιβεβαίωσα ZK widgets στείρωσης εγκαίρως.");
      // Προσπαθούμε extract όπως και να έχει
    }

    sterilization = await extractSterilizationData(page);
    console.log("ℹ️ [runMicrochipLookupFlow] sterilization keys:", keys(sterilization));

    // 7) Back to search page
    await goToAnimalSearchPage(page);

    return result({
      ok: true,
      found: true,
      reason: "OK",
      pet,
      owner,
      sterilization,
      vaccination,
    });
  } catch (err) {
    console.error("❌ [runMicrochipLookupFlow] Fatal error:", err);
    // Προσπαθούμε να επιστρέψουμε σε “safe” state
    try {
      await goToAnimalSearchPage(page);
    } catch {}

    return {
      ok: false,
      found: false,
      reason: "EXCEPTION",
      microchip: trimmed,
      pet: null,
      owner: null,
      sterilization: null,
      details: err?.message, // προσοχή: κράτα το μόνο για server-side logs αν θες
    };
  }
}

/* ==============================
   Helpers
================================ */

/**
 * Πηγαίνει σε σελίδα αναζήτησης ζώου.
 * Στόχος: να δω ορατό input αναζήτησης.
 */
async function goToAnimalSearchPage(page) {
  console.log("➡️ [goToAnimalSearchPage] Πηγαίνω σε σελίδα αναζήτησης ζώου…");
  console.log("   ℹ️ URL τώρα:", page.url());

  const input = page.locator('input[placeholder*="Αναζητήστε με microchip"]').first();

  // αν το βλέπω ήδη, τέλος
  if (await input.isVisible().catch(() => false)) {
    console.log("✅ [goToAnimalSearchPage] Βλέπω ορατό search input. Είμαι στη σωστή σελίδα.");
    return true;
  }

  // πήγαινε “home”
  try {
    await page.goto("https://pet.gov.gr/emzs-backoffice/", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(600);
  } catch {}

  // ξαναέλεγχος
  if (await input.isVisible().catch(() => false)) {
    console.log("✅ [goToAnimalSearchPage] Βρήκα search input μετά από goto.");
    return true;
  }

  // προσπάθειες με “ασφαλή” menu text
  const candidates = [
    /Καταγραφές\s*ζώων/i,
    /Αναζήτηση\s*ζώου/i,
    /Αναζήτηση/i,
    /Ζώα/i,
    /Μητρώο/i,
  ];

  for (const re of candidates) {
    // links
    try {
      const a = page.getByRole("link", { name: re }).first();
      if ((await a.count().catch(() => 0)) > 0) {
        await a.click({ timeout: 8000 });
        await page.waitForTimeout(700);
      }
    } catch {}

    // buttons
    try {
      const b = page.getByRole("button", { name: re }).first();
      if ((await b.count().catch(() => 0)) > 0) {
        await b.click({ timeout: 8000 });
        await page.waitForTimeout(700);
      }
    } catch {}

    if (await input.isVisible().catch(() => false)) {
      console.log("✅ [goToAnimalSearchPage] Έφτασα στη σελίδα αναζήτησης.");
      return true;
    }
  }

  console.log("⚠️ [goToAnimalSearchPage] Δεν κατάφερα να εμφανίσω το search input.");
  return false;
}

/**
 * Κάνει αναζήτηση και ανοίγει booklet.
 */
async function searchAndOpenBooklet(page, microchip) {
  if (!microchip) return false;

  console.log("➡️ [searchAndOpenBooklet] microchip:", microchip);

  const input = page.locator('input[placeholder*="Αναζητήστε με microchip"]').first();
  const inputVisible = await input.isVisible().catch(() => false);
  if (!inputVisible) {
    console.log("⚠️ [searchAndOpenBooklet] Δεν βλέπω search input.");
    return false;
  }

  await input.click({ timeout: 5000 }).catch(() => {});
  await input.fill(microchip).catch(() => {});
  console.log("   ➜ Έγραψα το microchip στο input.");

  // Αναζήτηση
  const searchBtn = page.getByRole("button", { name: /Αναζήτηση/ }).first();
  if (await searchBtn.isVisible().catch(() => false)) {
    await searchBtn.click({ timeout: 8000 }).catch(() => {});
    console.log('   ➜ Πάτησα "Αναζήτηση".');
  } else {
    console.log('⚠️ [searchAndOpenBooklet] Δεν βρήκα κουμπί "Αναζήτηση".');
    return false;
  }

  await page.waitForTimeout(900);

  // “Εμφάνιση αποτελεσμάτων” μόνο αν υπάρχει
  const showBtn = page
    .getByRole("button", { name: /Εμφάνιση των αποτελεσμάτων/ })
    .first();

  if (await showBtn.isVisible().catch(() => false)) {
    await showBtn.click({ timeout: 8000 }).catch(() => {});
    console.log('   ➜ Πάτησα "Εμφάνιση των αποτελεσμάτων".');
    await page.waitForTimeout(900);
  } else {
    console.log('   ℹ️ Δεν εμφανίστηκε "Εμφάνιση των αποτελεσμάτων".');
  }

  // Click result row
  const clicked = await clickResultRowForMicrochip(page, microchip);
  if (!clicked) return false;

  // Wait booklet ZK widget
  return await waitBookletReady(page);
}

async function clickResultRowForMicrochip(page, microchip) {
  console.log("➡️ [clickResultRowForMicrochip] microchip:", microchip);

  // 1) Row by role/name
  try {
    const row = page.getByRole("row", { name: new RegExp(microchip) }).first();
    if (await row.isVisible().catch(() => false)) {
      await row.click({ timeout: 8000 });
      console.log("   ➜ Click σε row (getByRole row).");
      await page.waitForTimeout(900);
      return true;
    }
  } catch {}

  // 2) Any text match
  try {
    const el = page.getByText(microchip, { exact: false }).first();
    if (await el.isVisible().catch(() => false)) {
      await el.click({ timeout: 8000 });
      console.log("   ➜ Click σε στοιχείο που περιέχει το microchip (getByText).");
      await page.waitForTimeout(900);
      return true;
    }
  } catch {}

  console.log("   ⚠️ Δεν βρέθηκε αποτέλεσμα που να περιέχει το microchip.");
  return false;
}

async function waitBookletReady(page, timeout = 8000) {
  const ok = await page
    .waitForFunction(
      (widgetIds) => {
        try {
          return (
            window.zk &&
            window.zk.Widget &&
            typeof window.zk.Widget.$ === "function" &&
            window.zk.Widget.$("$" + widgetIds.microchip)
          );
        } catch {
          return false;
        }
      },
      BOOKLET_WIDGET_IDS,
      { timeout }
    )
    .then(() => true)
    .catch(() => false);

  if (ok) console.log("✅ [waitBookletReady] Βλέπω microchipCode (είμαι στο βιβλιάριο).");
  else console.log("⚠️ [waitBookletReady] Δεν επιβεβαίωσα microchipCode εγκαίρως.");

  return ok;
}

async function waitOwnerReady(page, timeout = 8000) {
  const ok = await page
    .waitForFunction(
      () => {
        try {
          return (
            window.zk &&
            window.zk.Widget &&
            typeof window.zk.Widget.$ === "function" &&
            window.zk.Widget.$("$firstname")
          );
        } catch {
          return false;
        }
      },
      undefined,
      { timeout }
    )
    .then(() => true)
    .catch(() => false);

  if (ok) console.log("✅ [waitOwnerReady] Βλέπω owner widgets (firstname).");
  else console.log("⚠️ [waitOwnerReady] Δεν επιβεβαίωσα owner widgets εγκαίρως.");

  return ok;
}

async function openOwnerDetailsFromBooklet(page) {
  console.log("➡️ [openOwnerDetailsFromBooklet] Ανοίγω καρτέλα ιδιοκτήτη από το βιβλιάριο.");

  try {
    await page.evaluate((widgetId) => {
      if (!window.zk || !zk.Widget || !window.zAu) return;

      const w = zk.Widget.$("$" + widgetId);
      if (!w) return;

      try {
        window.zAu.send(new zk.Event(w, "onDoubleClick"));
      } catch {
        try {
          window.zAu.send(new zk.Event(w, "onClick"));
          window.zAu.send(new zk.Event(w, "onClick"));
        } catch {}
      }
    }, BOOKLET_WIDGET_IDS.managedBy);

    await page.waitForTimeout(700);
    console.log("   ➜ Έστειλα ZK event στο managedBy widget.");
  } catch (err) {
    console.error("   ⚠️ Αποτυχία ZK event στο managedBy:", err);
  }
}

/**
 * Επιστροφή από owner -> booklet.
 */
async function returnFromOwnerToBooklet(page) {
  console.log("➡️ [returnFromOwnerToBooklet] Επιστροφή από ιδιοκτήτη στο βιβλιάριο.");
  console.log("   ℹ️ URL:", page.url());

  // 0) Αν ήδη είμαι booklet, τέλος
  if (await waitBookletReady(page, 1200)) return true;

  const labels = [/Επιστροφή/i, /Πίσω/i, /Κλείσιμο/i, /Άκυρο/i];

  // 1) UI click (button/link by name)
  for (const re of labels) {
    try {
      const btn = page.getByRole("button", { name: re }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click({ timeout: 8000 });
        await page.waitForTimeout(700);
        if (await waitBookletReady(page, 2500)) return true;
      }
    } catch {}

    try {
      const link = page.getByRole("link", { name: re }).first();
      if (await link.isVisible().catch(() => false)) {
        await link.click({ timeout: 8000 });
        await page.waitForTimeout(700);
        if (await waitBookletReady(page, 2500)) return true;
      }
    } catch {}
  }

  // 2) ESC
  try {
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(500);
    if (await waitBookletReady(page, 2500)) return true;
  } catch {}

  // 3) Browser back
  try {
    await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(700);
    if (await waitBookletReady(page, 3500)) return true;
  } catch {}

  console.log("⚠️ [returnFromOwnerToBooklet] Δεν κατάφερα να επιστρέψω στο booklet.");
  return false;
}

/**
 * Ανοίγει στείρωση από booklet.
 */
async function openSterilizationFromBooklet(page) {
  console.log("➡️ [openSterilizationFromBooklet] Ανοίγω στείρωση (btnNeuter).");

  const inBooklet = await waitBookletReady(page, 2500);
  if (!inBooklet) {
    console.log("⚠️ [openSterilizationFromBooklet] Δεν είμαι σίγουρα στο booklet.");
    return false;
  }

  // 1) UI click by role/name (αν υπάρχει κείμενο)
  try {
    const byName = page.getByRole("button", { name: /Στείρωση|Neuter/i }).first();
    if (await byName.isVisible().catch(() => false)) {
      await byName.click({ timeout: 8000 });
      await page.waitForTimeout(700);
      return true;
    }
  } catch {}

  // 2) DOM id (αν υπάρχει πραγματικό id)
  try {
    const dom = page.locator("#btnNeuter").first();
    if (await dom.isVisible().catch(() => false)) {
      await dom.click({ force: true, timeout: 8000 });
      await page.waitForTimeout(700);
      return true;
    }
  } catch {}

  // 3) ZK event στο $btnNeuter
  const ok = await page
    .evaluate(() => {
      try {
        if (!window.zk || !zk.Widget || !window.zAu) return false;
        const w = zk.Widget.$("$btnNeuter");
        if (!w) return false;
        window.zAu.send(new zk.Event(w, "onClick"));
        return true;
      } catch {
        return false;
      }
    })
    .catch(() => false);

  if (ok) {
    console.log('   ➜ Έστειλα ZK onClick στο "$btnNeuter".');
    await page.waitForTimeout(700);
    return true;
  }

  console.log('   ⚠️ Δεν βρέθηκε/δεν έστειλε ZK event για "$btnNeuter".');
  return false;
}
