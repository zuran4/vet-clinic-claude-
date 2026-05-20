// vet-api/scripts/registry-worker/browser.mjs

export async function createRegistryContext({ chromium, userDataDir, headless }) {
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: !!headless,
    slowMo: headless ? 0 : 150,
    viewport: { width: 1365, height: 768 },
    locale: "el-GR",
    timezoneId: "Europe/Athens",

    // Production hardening (ιδιαίτερα σε Linux containers/Render)
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  // Timeouts για να μην “κρεμάνε” requests
  context.setDefaultTimeout(15000);
  context.setDefaultNavigationTimeout(30000);

  // Κόβουμε βαριά resources για πιο γρήγορα loads.
  // Προσοχή: fonts κάποιες φορές επηρεάζουν layout/click targets, οπότε δεν τα κόβουμε.
  await context.route("**/*", (route) => {
    const type = route.request().resourceType();
    if (["image", "media"].includes(type)) return route.abort();
    return route.continue();
  });

  // Κρατάμε μόνο 1 tab/page για deterministic state
  const pages = context.pages();

  // Αν υπάρχουν πολλά pages (π.χ. popups), κλείσε τα extras
  if (pages.length > 1) {
    for (let i = 1; i < pages.length; i++) {
      try {
        await pages[i].close();
      } catch {
        // ignore
      }
    }
  }

  const page = context.pages()[0] || (await context.newPage());

  // Ελάχιστη hardening ρύθμιση για σταθερό execution
  try {
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(30000);
  } catch {
    // ignore
  }

  return { context, page };
}
