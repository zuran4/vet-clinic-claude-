// vet-api/scripts/registry-worker/startup.mjs

import { computeSessionStatus } from "./session-status.mjs";

export async function runStartupSequence({
  page,
  PET_BOOKLET_BASE_URL,
  HEADLESS,
  autoLoginIfNeeded,
}) {
  console.log("➡️ Μετάβαση στην αρχική σελίδα / backoffice:");
  console.log("   ", PET_BOOKLET_BASE_URL);

  const gotoWithRetries = async (url, attempts = 3) => {
    let lastErr = null;

    for (let i = 1; i <= attempts; i++) {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("domcontentloaded").catch(() => {});
        await page.waitForTimeout(700);
        return true;
      } catch (e) {
        lastErr = e;
        console.log(`⚠️ goto failed (attempt ${i}/${attempts}):`, e?.message || String(e));
        await page.waitForTimeout(800 * i);
      }
    }

    console.log("❌ Αποτυχία navigation μετά από retries:", lastErr?.message || String(lastErr));
    return false;
  };

  const clickVetCardIfPresent = async () => {
    try {
      const vetCard = page.getByText("Ιδιώτης Κτηνίατρος", { exact: true }).first();
      if (await vetCard.isVisible().catch(() => false)) {
        await vetCard.click({ timeout: 8000 });
        console.log("✅ Πάτησα την κάρτα 'Ιδιώτης Κτηνίατρος'.");
        await page.waitForLoadState("domcontentloaded").catch(() => {});
        await page.waitForTimeout(900);
        return true;
      }
    } catch {
      // ignore
    }

    console.log("ℹ️ Δεν βρήκα κάρτα 'Ιδιώτης Κτηνίατρος' (ίσως είσαι ήδη μέσα).");
    return false;
  };

  const clickReconnectIfExpired = async () => {
    try {
      const reconnectButton = page.getByRole("button", { name: "Σύνδεση" }).first();
      if (await reconnectButton.isVisible().catch(() => false)) {
        await reconnectButton.click({ timeout: 8000 });
        console.log("✅ Πάτησα το κουμπί 'Σύνδεση' (reconnect).");
        await page.waitForLoadState("domcontentloaded").catch(() => {});
        await page.waitForTimeout(900);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  };

  // 1) Open base URL with retries
  const opened = await gotoWithRetries(PET_BOOKLET_BASE_URL, 3);
  console.log("📍 Αρχικό URL:", page.url());

  if (!opened) {
    // Δεν σταματάμε τον worker, αλλά το startup δεν μπορεί να προχωρήσει σωστά.
    return { ok: false, status: "UNKNOWN", url: page.url() };
  }

  // 2) Best-effort click on “Ιδιώτης Κτηνίατρος”
  await clickVetCardIfPresent();

  // 3) Deterministic startup loop (max cycles)
  // Στόχος: ή να φτάσουμε LOGGED_IN ή να καταλήξουμε σε σαφές status.
  const MAX_CYCLES = 4;

  for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
    const s = await computeSessionStatus(page);

    if (s.status === "LOGGED_IN") {
      console.log("✅ Startup: LOGGED_IN");
      return s;
    }

    if (s.status === "SESSION_EXPIRED") {
      console.log("⚠️ Startup: SESSION_EXPIRED, προσπαθώ reconnect...");
      const clicked = await clickReconnectIfExpired();
      if (!clicked) {
        // fallback: reload base
        await gotoWithRetries(PET_BOOKLET_BASE_URL, 2);
      }
      continue;
    }

    if (s.status === "PRE_LOGIN") {
      console.log("ℹ️ Startup: PRE_LOGIN, πατάω κάρτα αν υπάρχει...");
      await clickVetCardIfPresent();
      continue;
    }

    if (s.status === "NEEDS_LOGIN") {
      console.log("ℹ️ Startup: NEEDS_LOGIN, προσπαθώ autoLoginIfNeeded...");
      await autoLoginIfNeeded(page);
      await page.waitForTimeout(800);
      continue;
    }

    // UNKNOWN: μια ελεγχόμενη προσπάθεια “re-anchor” στο base URL
    console.log(`ℹ️ Startup: status=${s.status}, cycle ${cycle}/${MAX_CYCLES}, κάνω re-anchor...`);
    await gotoWithRetries(PET_BOOKLET_BASE_URL, 2);
  }

  const final = await computeSessionStatus(page);
  console.log("📍 URL μετά τα αρχικά βήματα:", final.url);
  console.log("ℹ️ Startup finished with status:", final.status);

  if (!HEADLESS) {
    console.log(
      "👉 Αν το αυτόματο login δεν είναι αρκετό, μπορείς να ολοκληρώσεις χειροκίνητα το login στο παράθυρο του browser."
    );
    console.log("   Ο worker δεν θα κλείσει μόνος του. Σταμάτα τον με Ctrl+C όταν τελειώσεις.");
  } else {
    console.log(
      "👉 Headless mode: αν χρειαστεί χειροκίνητο login, απενεργοποίησε προσωρινά το headless από Ρυθμίσεις > Admin και ξαναξεκίνα τον worker."
    );
  }

  return final;
}
