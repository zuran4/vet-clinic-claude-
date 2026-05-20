// scripts/registry-test-session.mjs
import "dotenv/config";
import { chromium } from "playwright";

const PET_BOOKLET_BASE_URL = process.env.PET_BOOKLET_BASE_URL;
// 📁 Μόνιμο profile: εδώ θα κρατήσει όλα τα cookies / localStorage
const USER_DATA_DIR = "playwright-profile";

async function main() {
  if (!PET_BOOKLET_BASE_URL) {
    throw new Error("Λείπει PET_BOOKLET_BASE_URL στο .env");
  }

  console.log("🚀 Άνοιγμα browser με μόνιμο profile (playwright-profile)...");

  // Persistent context: κάθε run μοιάζει με τον ίδιο browser
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    slowMo: 150,
    viewport: { width: 1365, height: 768 },
    locale: "el-GR",
    timezoneId: "Europe/Athens",
  });

  // Αν υπάρχει ήδη tab, το χρησιμοποιούμε, αλλιώς ανοίγουμε καινούριο
  const page = context.pages()[0] || (await context.newPage());

  console.log("➡️ Μετάβαση στην αρχική του pet medical booklet:");
  console.log("   ", PET_BOOKLET_BASE_URL);

  // 1) Άνοιγμα αρχικής σελίδας
  await page.goto(PET_BOOKLET_BASE_URL, { waitUntil: "networkidle" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  const title = await page.title().catch(() => "");

  console.log("📍 Τρέχουσα σελίδα:", currentUrl);
  console.log("📄 Τίτλος:", title);

  // 2) Πίεση κάρτας "Ιδιώτης Κτηνίατρος"
  try {
    const vetCard = page.getByText("Ιδιώτης Κτηνίατρος", { exact: true });
    await vetCard.click();
    console.log("✅ Πάτησα την κάρτα 'Ιδιώτης Κτηνίατρος'.");
  } catch (error) {
    console.error(
      "⚠️ Δεν βρήκα ή δεν μπόρεσα να πατήσω 'Ιδιώτης Κτηνίατρος':",
      error
    );
  }

  // 3) Αναμονή να φορτώσει η επόμενη σελίδα
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2000);

  // 4) Έλεγχος για σελίδα timeout
  const afterClickUrl = page.url();
  const pageText = await page.textContent("body").catch(() => "");

  if (
    afterClickUrl.includes("/timeout.zul") ||
    (pageText && pageText.includes("Η συνεδρία σας έχει λήξει"))
  ) {
    console.log(
      "⚠️ Η συνεδρία στο μητρώο έχει λήξει. Προσπαθώ να πατήσω 'Σύνδεση'."
    );

    try {
      const reconnectButton = page.getByRole("button", { name: "Σύνδεση" });
      await reconnectButton.click();
      console.log("✅ Πάτησα το κουμπί 'Σύνδεση'.");

      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(2000);
    } catch (error) {
      console.error("❌ Αποτυχία στο click του κουμπιού 'Σύνδεση':", error);
    }
  }

  console.log("📍 URL μετά τα clicks:", page.url());

  // 5) ΦΑΣΗ SETUP: δίνουμε χρόνο για χειροκίνητο login
  console.log("👉 ΤΩΡΑ κάνε login με gov.gr / TAXIS στο παράθυρο που άνοιξε.");
  console.log(
    "   Αφού ολοκληρώσεις το login και δεις το backoffice, τα cookies θα μείνουν στο profile."
  );

  console.log("⏳ Περιμένω 60 δευτερόλεπτα πριν κλείσω τον browser...");
  try {
    await page.waitForTimeout(60 * 1000); // 1 λεπτό
  } catch {
    console.log("⚠️ Η σελίδα έκλεισε πριν το timeout, αγνοώ το σφάλμα.");
  }

  await context.close();
  console.log("✅ Τέλος δοκιμής session (profile ενημερώθηκε).");
}

main().catch((err) => {
  console.error("❌ Σφάλμα στο registry-test-session.mjs:", err);
  process.exit(1);
});
