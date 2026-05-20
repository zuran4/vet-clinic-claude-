// scripts/registry-playwright-test.mjs
import { chromium } from "playwright";

async function main() {
  console.log("Ξεκινάει το test του Playwright...");

  // 1. Εκκίνηση browser (headless: true = χωρίς παράθυρο)
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 2. Μετάβαση σε μια απλή σελίδα (παράδειγμα: https://example.com)
  await page.goto("https://example.com", { waitUntil: "networkidle" });

  // 3. Πάρε τον τίτλο της σελίδας για να δούμε ότι όντως φορτώνει
  const title = await page.title();
  console.log("Τίτλος σελίδας:", title);

  // 4. Κλείσιμο browser
  await browser.close();

  console.log("Το test ολοκληρώθηκε χωρίς σφάλμα.");
}

// Τρέχουμε την main και πιάνουμε τυχόν σφάλματα
main().catch((err) => {
  console.error("Σφάλμα στο Playwright test:", err);
  process.exit(1);
});
