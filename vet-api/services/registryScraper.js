// services/registryScraper.js
import "dotenv/config";
import { chromium } from "playwright";

const BASE_URL = process.env.REGISTRY_BASE_URL;

// Θα βρούμε το κουμπί από το κείμενό του
const LOGIN_BUTTON_TEXT = "Ιδιώτης Κτηνίατρος";

/**
 * Test επιλογής παρόχου login:
 * - Πηγαίνει στη σελίδα /login-taxis.zul
 * - Κάνει click στο κουμπί "Ιδιώτης Κτηνίατρος"
 * - Περιμένει τυχόν αλλαγή σελίδας
 * - Επιστρέφει το νέο URL και τον τίτλο
 */
export async function testRegistryLogin() {
  if (!BASE_URL) {
    throw new Error("Λείπει REGISTRY_BASE_URL στο .env");
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const loginUrl = `${BASE_URL}/login-taxis.zul`;
    console.log("➡️ Άνοιγμα σελίδας login:", loginUrl);

    // 1. Μετάβαση στη σελίδα login
    await page.goto(loginUrl, { waitUntil: "networkidle" });

    // 2. Click στο κουμπί "Ιδιώτης Κτηνίατρος" με βάση το κείμενο
    console.log(`🔘 Click στο κουμπί login με κείμενο: ${LOGIN_BUTTON_TEXT}`);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }).catch(() => {
        // Αν δεν αλλάξει URL, δεν πετάμε σφάλμα εδώ.
      }),
      page.getByRole("button", { name: LOGIN_BUTTON_TEXT }).click(),
    ]);

    // 3. Έλεγχος τρέχουσας σελίδας
    const currentUrl = page.url();
    const title = await page.title().catch(() => "");

    console.log("📍 Μετά το click στο κουμπί, βρισκόμαστε στο:", currentUrl);
    console.log("📄 Τίτλος σελίδας:", title);

    return {
      baseUrl: BASE_URL,
      currentUrl,
      title,
    };
  } finally {
    await browser.close();
  }
}
