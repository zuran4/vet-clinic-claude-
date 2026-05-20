// scripts/registry-capture-auth.mjs
import "dotenv/config";
import { chromium } from "playwright";

const BASE_URL = process.env.REGISTRY_BASE_URL;

// Το κουμπί "Ιδιώτης Κτηνίατρος" στη σελίδα login-taxis.zul
const LOGIN_BUTTON_TEXT = "Ιδιώτης Κτηνίατρος";

async function main() {
  if (!BASE_URL) {
    throw new Error("Λείπει REGISTRY_BASE_URL στο .env");
  }

  console.log("🚀 Εκκίνηση browser για χειροκίνητο login...");

  // headless: false για να βλέπεις το παράθυρο
  const browser = await chromium.launch({
    headless: false,
    slowMo: 150, // λίγο πιο αργά για να βλέπεις τι κάνει
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const loginUrl = `${BASE_URL}/login-taxis.zul`;
    console.log("➡️ Άνοιγμα σελίδας login:", loginUrl);

    await page.goto(loginUrl, { waitUntil: "networkidle" });

    console.log(`🔘 Click στο κουμπί: ${LOGIN_BUTTON_TEXT}`);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load" }).catch(() => {}),
      page.getByRole("button", { name: LOGIN_BUTTON_TEXT }).click(),
    ]);

    console.log("");
    console.log("🔑 ΤΩΡΑ:");
    console.log("1) Στο παράθυρο του browser που άνοιξε, κάνε κανονικά login με Taxis.");
    console.log("2) Περίμενε μέχρι να φορτώσει πλήρως η εφαρμογή pet.gov.gr (να δεις το περιβάλλον σου).");
    console.log("3) ΌΤΑΝ ΟΛΟΚΛΗΡΩΣΕΙΣ, γύρνα στο τερματικό και πάτα Enter για να αποθηκευτεί το session.");
    console.log("");

    // Περιμένουμε Enter από το χρήστη
    await new Promise((resolve) => {
      process.stdin.resume();
      process.stdin.once("data", () => resolve());
    });

    console.log("💾 Αποθήκευση session σε playwright-auth-state.json ...");
    await context.storageState({ path: "playwright-auth-state.json" });

    console.log("✅ Το session αποθηκεύτηκε επιτυχώς στο playwright-auth-state.json");
  } finally {
    await browser.close();
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("❌ Σφάλμα στο registry-capture-auth.mjs:", err);
  process.exit(1);
});
