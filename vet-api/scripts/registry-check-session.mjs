// scripts/registry-check-session.mjs
import "dotenv/config";
import { chromium } from "playwright";

const PET_BOOKLET_BASE_URL = process.env.PET_BOOKLET_BASE_URL;
// ίδιο profile με το άλλο script
const USER_DATA_DIR = "playwright-profile";

async function main() {
  if (!PET_BOOKLET_BASE_URL) {
    throw new Error("Λείπει PET_BOOKLET_BASE_URL στο .env");
  }

  // Χρησιμοποιούμε το ΙΔΙΟ persistent profile
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: true,
    viewport: { width: 1365, height: 768 },
    locale: "el-GR",
    timezoneId: "Europe/Athens",
  });

  const page = context.pages()[0] || (await context.newPage());

  // 1) Πάμε στην αρχική
  await page.goto(PET_BOOKLET_BASE_URL, { waitUntil: "networkidle" });
  await page.waitForLoadState("networkidle").catch(() => {});

  // 2) Προσπαθούμε να πατήσουμε "Ιδιώτης Κτηνίατρος"
  try {
    const vetCard = page.getByText("Ιδιώτης Κτηνίατρος", { exact: true });
    await vetCard.click();
  } catch (error) {
    // αν δεν τη βρούμε, συνεχίζουμε όπως είναι
  }

  // 3) Περιμένουμε να φορτώσει η επόμενη σελίδα
  await page.waitForLoadState("networkidle").catch(() => {});
  const urlAfterCard = page.url();
  const bodyTextAfterCard =
    (await page.textContent("body").catch(() => "")) || "";

  // 4) Αν βγάλει timeout, προσπαθούμε "Σύνδεση"
  if (
    urlAfterCard.includes("timeout.zul") ||
    bodyTextAfterCard.includes("Η συνεδρία σας έχει λήξει")
  ) {
    try {
      const reconnectButton = page.getByRole("button", { name: "Σύνδεση" });
      await reconnectButton.click();
      await page.waitForLoadState("networkidle").catch(() => {});
    } catch (error) {
      // αν δεν βρούμε κουμπί, το αφήνουμε ως έχει
    }
  }

  // 5) Τελική εικόνα
  const finalUrl = page.url();
  const finalBody = (await page.textContent("body").catch(() => "")) || "";

  let status = "UNKNOWN";

  // Θεωρούμε logged in αν είμαστε σε κάποια app σελίδα που δεν είναι login/timeout
  if (
    finalUrl.includes("/emzs-backoffice/app/") &&
    !finalUrl.includes("login-taxis.zul") &&
    !finalUrl.includes("timeout.zul")
  ) {
    status = "LOGGED_IN";
  } else if (finalUrl.includes("login-taxis.zul")) {
    // login TAXIS
    status = "NEEDS_LOGIN";
  } else if (finalBody.includes("Η συνεδρία σας έχει λήξει")) {
    status = "SESSION_EXPIRED";
  } else if (finalUrl.includes("oauth2.gsis.gr/oauth2server/login.jsp")) {
    // κατευθείαν στη φόρμα TAXIS
    status = "NEEDS_LOGIN";
  }

  const result = {
    ok: status === "LOGGED_IN",
    status,
    url: finalUrl,
  };

  console.log(JSON.stringify(result, null, 2));

  await context.close();
}

main().catch((err) => {
  console.error("❌ Σφάλμα στο registry-check-session.mjs:", err);
  process.exit(1);
});
