// vet-api/scripts/registry-worker/recovery.mjs
//
// Μία προσπάθεια ανάκτησης session πάνω σε ήδη-ζωντανό page (χωρίς restart
// browser). Καλύπτει PRE_LOGIN (κάρτα "Ιδιώτης Κτηνίατρος"), SESSION_EXPIRED
// (κουμπί reconnect "Σύνδεση") και NEEDS_LOGIN (autoLoginIfNeeded).
//
// Χρησιμοποιείται από GET /session (παθητικό self-heal στο polling του UI)
// καθώς και από /lookup, /medical-events πριν από κάθε πράξη.

import { computeSessionStatus } from "./session-status.mjs";

async function clickVetCardIfPresent(page) {
  try {
    const vetCard = page.getByText("Ιδιώτης Κτηνίατρος", { exact: true }).first();
    if (await vetCard.isVisible().catch(() => false)) {
      await vetCard.click({ timeout: 8000 });
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await page.waitForTimeout(900);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

async function clickReconnectIfExpired(page) {
  try {
    const reconnectButton = page.getByRole("button", { name: "Σύνδεση" }).first();
    if (await reconnectButton.isVisible().catch(() => false)) {
      await reconnectButton.click({ timeout: 8000 });
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await page.waitForTimeout(900);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

export async function attemptSessionRecovery(page, { autoLoginIfNeeded }) {
  let s = await computeSessionStatus(page);

  if (s.status === "PRE_LOGIN") {
    await clickVetCardIfPresent(page);
    s = await computeSessionStatus(page);
  }

  if (s.status === "SESSION_EXPIRED") {
    await clickReconnectIfExpired(page);
    s = await computeSessionStatus(page);
  }

  if (s.status === "NEEDS_LOGIN") {
    await autoLoginIfNeeded(page);
    s = await computeSessionStatus(page);
  }

  return s;
}
