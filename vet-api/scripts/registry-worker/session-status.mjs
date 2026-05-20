// vet-api/scripts/registry-worker/session-status.mjs

/**
 * Lightweight session classifier.
 * Σημαντικό: ΜΗΝ διαβάζουμε συνεχώς body text σε κάθε /session (είναι βαρύ και κάνει lag).
 *
 * Contract:
 * - ok=true ΜΟΝΟ όταν είμαστε σίγουροι ότι είμαστε authenticated μέσα στο backoffice.
 * - αλλιώς ok=false και status από τα παρακάτω.
 */
export async function computeSessionStatus(page) {
  if (!page) {
    return { ok: false, status: "NO_PAGE", url: null };
  }

  // Αν έχει κλείσει το page, φεύγουμε άμεσα.
  try {
    if (typeof page.isClosed === "function" && page.isClosed()) {
      return { ok: false, status: "NO_PAGE", url: null };
    }
  } catch {
    // ignore
  }

  let url = null;
  try {
    url = page.url();
  } catch {
    url = null;
  }

  // Edge cases
  if (!url || url === "about:blank") {
    return { ok: false, status: "UNKNOWN", url };
  }

  const isBackoffice = url.includes("pet.gov.gr/emzs-backoffice");
  const isGsisOauth = url.includes("oauth2.gsis.gr/oauth2server/login.jsp");

  // 1) Ληγμένη συνεδρία / timeout
  if (url.includes("timeout.zul") || url.includes("timeout")) {
    return { ok: false, status: "SESSION_EXPIRED", url };
  }

  // 2) Σελίδα login TAXIS / oauth2
  if (url.includes("login-taxis.zul") || isGsisOauth) {
    return { ok: false, status: "NEEDS_LOGIN", url };
  }

  // Αν δεν είμαστε καν στο backoffice domain, δεν υποθέτουμε τίποτα
  if (!isBackoffice) {
    return { ok: false, status: "UNKNOWN", url };
  }

  // 3) PRE_LOGIN heuristic: κάρτα "Ιδιώτης Κτηνίατρος"
  // (πολύ πιο ελαφρύ από body text)
  try {
    const cardCount = await page
      .getByText("Ιδιώτης Κτηνίατρος", { exact: true })
      .count()
      .catch(() => 0);

    if (cardCount > 0) {
      return { ok: false, status: "PRE_LOGIN", url };
    }
  } catch {
    // ignore
  }

  // 4) LOGGED_IN heuristics: σήματα ότι είμαστε μέσα στην εφαρμογή
  // Επιλογή Α: search input (συνήθως υπάρχει στην αναζήτηση ζώου)
  try {
    const searchInputCount = await page
      .locator('input[placeholder*="Αναζητήστε με microchip"]')
      .count()
      .catch(() => 0);

    if (searchInputCount > 0) {
      return { ok: true, status: "LOGGED_IN", url };
    }
  } catch {
    // ignore
  }

  // Επιλογή Β: logout/exit κουμπί (αν υπάρχει σε header/menu)
  try {
    const logoutCount =
      (await page.getByRole("button", { name: /Αποσύνδεση|Έξοδος/i }).count().catch(() => 0)) +
      (await page.getByRole("link", { name: /Αποσύνδεση|Έξοδος/i }).count().catch(() => 0));

    if (logoutCount > 0) {
      return { ok: true, status: "LOGGED_IN", url };
    }
  } catch {
    // ignore
  }

  // 5) Αν είμαστε στο backoffice αλλά δεν είμαστε σίγουροι ότι είμαστε logged in,
  // δεν επιστρέφουμε LOGGED_IN. Είναι safer για production.
  return { ok: false, status: "UNKNOWN", url };
}
