// scripts/medical-events-flow-helpers.mjs
//
// Scraping του tab "Γεγονότα Ιατρικού Φακέλου" από pet.gov.gr/emzs-backoffice/
// Χρησιμοποιεί DOM-based extraction (όχι ZK widget IDs) γιατί τα δεδομένα
// είναι σε πίνακες, όχι σε individual form fields.

import { BOOKLET_WIDGET_IDS } from "./zk-helpers.mjs";

const SECTIONS = [
  { key: "vaccinations",    label: "Εμβολιασμοί" },
  { key: "diagnostics",     label: "Διαγνωστικές εξετάσεις" },
  { key: "diseases",        label: "Νοσήματα υποχρεωτικής δήλωσης" },
  { key: "hereditary",      label: "Κληρονομικές παθήσεις" },
  { key: "sterilization",   label: "Στείρωση" },
  { key: "genetic",         label: "Γενετικό Υλικό" },
  { key: "antiparasitic",   label: "Αντιπαρασιτικές αγωγές" },
  { key: "clinical",        label: "Κλινική Εξέταση" },
  { key: "treatments",      label: "Θεραπείες/αγωγές" },
  { key: "surgeries",       label: "Επεμβάσεις" },
  { key: "hospitalization", label: "Νοσηλεία/παρακολούθηση" },
];

/**
 * Κύρια ροή: αναζητά microchip, ανοίγει booklet, πηγαίνει στο tab
 * "Γεγονότα Ιατρικού Φακέλου" και εξάγει δεδομένα από κάθε ενότητα.
 */
export async function runMedicalEventsFlow(page, microchip) {
  const trimmed = (microchip || "").trim();
  console.log("🏥 runMedicalEventsFlow για microchip:", trimmed);

  const empty = () =>
    Object.fromEntries(SECTIONS.map((s) => [s.key, []]));

  try {
    if (!trimmed) {
      return { ok: false, found: false, reason: "MISSING_MICROCHIP", data: empty() };
    }

    // 1) Search page
    const inSearch = await goToSearchPage(page);
    if (!inSearch) {
      return { ok: false, found: false, reason: "SEARCH_PAGE_NOT_REACHED", data: empty() };
    }

    // 2) Search + open booklet
    const opened = await searchAndOpenBooklet(page, trimmed);
    if (!opened) {
      return { ok: true, found: false, reason: "NO_RESULTS_OR_OPEN_FAILED", data: empty() };
    }

    // 3) Click tab "Γεγονότα Ιατρικού Φακέλου"
    const tabOpened = await clickMedicalEventsTab(page);
    if (!tabOpened) {
      await goToSearchPage(page);
      return { ok: true, found: true, reason: "MEDICAL_TAB_NOT_FOUND", data: empty() };
    }

    // 4) Εξαγωγή δεδομένων από κάθε ενότητα
    const data = {};
    for (const section of SECTIONS) {
      console.log(`   📋 Εξάγω: ${section.label}`);
      data[section.key] = await extractSection(page, section.label);
    }

    // 5) Επιστροφή σε search page
    await goToSearchPage(page);

    return { ok: true, found: true, reason: "OK", data };
  } catch (err) {
    console.error("❌ [runMedicalEventsFlow] Fatal error:", err);
    try { await goToSearchPage(page); } catch {}
    return {
      ok: false, found: false, reason: "EXCEPTION",
      details: err?.message, data: empty(),
    };
  }
}

/* ============================================================
   Helpers
============================================================ */

async function goToSearchPage(page) {
  const input = page.locator('input[placeholder*="Αναζητήστε με microchip"]').first();
  if (await input.isVisible().catch(() => false)) return true;

  try {
    await page.goto("https://pet.gov.gr/emzs-backoffice/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
  } catch {}

  return await input.isVisible().catch(() => false);
}

async function searchAndOpenBooklet(page, microchip) {
  const input = page.locator('input[placeholder*="Αναζητήστε με microchip"]').first();
  if (!await input.isVisible().catch(() => false)) return false;

  await input.click({ timeout: 5000 }).catch(() => {});
  await input.fill(microchip).catch(() => {});

  const searchBtn = page.getByRole("button", { name: /Αναζήτηση/ }).first();
  if (!await searchBtn.isVisible().catch(() => false)) return false;

  await searchBtn.click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(900);

  const showBtn = page.getByRole("button", { name: /Εμφάνιση των αποτελεσμάτων/ }).first();
  if (await showBtn.isVisible().catch(() => false)) {
    await showBtn.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(900);
  }

  // Click αποτέλεσμα
  try {
    const row = page.getByRole("row", { name: new RegExp(microchip) }).first();
    if (await row.isVisible().catch(() => false)) {
      await row.click({ timeout: 8000 });
      await page.waitForTimeout(900);
    } else {
      const el = page.getByText(microchip, { exact: false }).first();
      if (await el.isVisible().catch(() => false)) {
        await el.click({ timeout: 8000 });
        await page.waitForTimeout(900);
      } else {
        return false;
      }
    }
  } catch { return false; }

  // Verify booklet loaded
  return await page.waitForFunction(
    (ids) => {
      try {
        return window.zk && window.zk.Widget &&
          typeof window.zk.Widget.$ === "function" &&
          window.zk.Widget.$("$" + ids.microchip);
      } catch { return false; }
    },
    BOOKLET_WIDGET_IDS,
    { timeout: 8000 }
  ).then(() => true).catch(() => false);
}

async function clickMedicalEventsTab(page) {
  console.log("➡️ [clickMedicalEventsTab] Ψάχνω tab 'Γεγονότα Ιατρικού Φακέλου'");

  const tabTexts = [
    /Γεγονότα\s+Ιατρικού\s+Φακέλου/i,
    /Ιατρικού\s+Φακέλου/i,
    /Ιατρικό\s+Φάκελο/i,
    /Γεγονότα/i,
  ];

  for (const re of tabTexts) {
    // Tab button
    try {
      const btn = page.getByRole("tab", { name: re }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click({ timeout: 8000 });
        await page.waitForTimeout(1000);
        console.log("✅ [clickMedicalEventsTab] Πάτησα tab (getByRole tab).");
        return true;
      }
    } catch {}

    // Οποιοδήποτε element με το κείμενο
    try {
      const el = page.getByText(re, { exact: false }).first();
      if (await el.isVisible().catch(() => false)) {
        await el.click({ timeout: 8000 });
        await page.waitForTimeout(1000);
        console.log("✅ [clickMedicalEventsTab] Πάτησα tab (getByText).");
        return true;
      }
    } catch {}
  }

  console.log("⚠️ [clickMedicalEventsTab] Δεν βρέθηκε tab.");
  return false;
}

/**
 * Κάνει κλικ σε sidebar section και εξάγει τον πίνακα.
 * Περιμένει να αλλάξει το content πριν κάνει extract.
 */
async function extractSection(page, sectionLabel) {
  try {
    // Παίρνουμε snapshot του τρέχοντος content για να ξέρουμε πότε άλλαξε
    const beforeSnapshot = await page.evaluate(() => {
      const content = document.querySelector(".z-center, .z-center-body, [class*='center'], main") || document.body;
      return content ? (content.innerText || content.textContent || "").trim().slice(0, 200) : "";
    });

    // Κλικ μέσα στη sidebar (αριστερό panel) — αποφεύγουμε matches στο content
    const clicked = await page.evaluate((label) => {
      // Ψάχνουμε στο αριστερό panel / sidebar
      const sidebarCandidates = [
        document.querySelector(".z-west"),
        document.querySelector(".z-west-body"),
        document.querySelector("[class*='sidebar']"),
        document.querySelector("[class*='west']"),
        document.querySelector("[class*='nav']"),
      ].filter(Boolean);

      const sidebar = sidebarCandidates[0];

      // Αν βρήκαμε sidebar, ψάχνουμε μόνο εκεί
      const container = sidebar || document;

      const allEls = Array.from(container.querySelectorAll("*"));
      const match = allEls.find(el => {
        const text = (el.innerText || el.textContent || "").trim();
        return text === label && !el.querySelector("*[class*='listhead'], *[class*='column']");
      });

      if (match) {
        match.click();
        return true;
      }
      return false;
    }, sectionLabel);

    if (!clicked) {
      // Fallback: Playwright getByText περιορισμένο αριστερά
      try {
        const el = page.getByText(sectionLabel, { exact: true }).first();
        if (await el.isVisible().catch(() => false)) {
          await el.click({ timeout: 5000 });
        }
      } catch {}
    }

    // Περιμένουμε να αλλάξει το content (max 3 δευτ.)
    let changed = false;
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(500);
      const afterSnapshot = await page.evaluate(() => {
        const content = document.querySelector(".z-center, .z-center-body, [class*='center'], main") || document.body;
        return content ? (content.innerText || content.textContent || "").trim().slice(0, 200) : "";
      });
      if (afterSnapshot !== beforeSnapshot) {
        changed = true;
        break;
      }
    }

    if (!changed) {
      // Μάλλον ήταν ήδη επιλεγμένο ή δεν άλλαξε — extract ό,τι έχει
      console.log(`   ℹ️ Content δεν άλλαξε για: ${sectionLabel}`);
    }

    return await extractContentTable(page);
  } catch (err) {
    console.warn(`⚠️ extractSection(${sectionLabel}):`, err?.message);
    return [];
  }
}

/**
 * Εξάγει δεδομένα από τον πίνακα του ΚΕΝΤΡΙΚΟΥ content area.
 * Αποφεύγει τη sidebar (αριστερό panel).
 */
async function extractContentTable(page) {
  return await page.evaluate(() => {
    const rows = [];

    try {
      const content = document.querySelector(".z-center, .z-center-body, [class*='center'], main") || document.body;
      if (!content) return rows;

      // ZK Listbox μέσα στο content area
      const listboxes = content.querySelectorAll(".z-listbox");
      // Παίρνουμε το τελευταίο/μεγαλύτερο (συνήθως ο πίνακας δεδομένων)
      const listbox = Array.from(listboxes).sort(
        (a, b) => b.querySelectorAll(".z-listitem").length - a.querySelectorAll(".z-listitem").length
      )[0];

      if (listbox) {
        const headerCells = listbox.querySelectorAll(".z-listheader");
        const headers = Array.from(headerCells)
          .map(h => (h.innerText || h.textContent || "").trim())
          .filter(h => h && h !== "Ενέργειες" && h !== "#");

        const listItems = listbox.querySelectorAll(".z-listitem");
        listItems.forEach(item => {
          const cells = Array.from(item.querySelectorAll(".z-listcell"));
          if (!cells.length) return;

          const values = cells.map(c => (c.innerText || c.textContent || "").trim());
          const meaningful = values.filter(v => v && v !== "×" && v !== "✎");
          if (!meaningful.length) return;

          if (headers.length > 0) {
            const obj = {};
            // Βρίσκουμε το index του πρώτου non-# header για offset
            const startIdx = values.findIndex((v, i) => {
              const h = headers[0];
              return (cells[i]?.innerText || "").trim().includes(h) || i > 0;
            });
            const offset = startIdx > 0 ? startIdx : 1;

            headers.forEach((h, i) => {
              const cell = cells[i + offset];
              obj[h] = cell ? (cell.innerText || cell.textContent || "").trim() : "";
            });
            rows.push(obj);
          } else {
            rows.push({ value: meaningful.join(" | ") });
          }
        });

        if (rows.length > 0) return rows;
      }

      // ZK Grid fallback
      const grid = content.querySelector(".z-grid");
      if (grid) {
        const headerCells = grid.querySelectorAll(".z-columns .z-column");
        const headers = Array.from(headerCells)
          .map(h => (h.innerText || h.textContent || "").trim())
          .filter(h => h && h !== "Ενέργειες" && h !== "#");

        grid.querySelectorAll(".z-rows .z-row").forEach(row => {
          const cells = Array.from(row.querySelectorAll(".z-cell"));
          const values = cells.map(c => (c.innerText || c.textContent || "").trim());
          const meaningful = values.filter(v => v && v !== "×" && v !== "✎");
          if (!meaningful.length) return;

          if (headers.length > 0) {
            const obj = {};
            headers.forEach((h, i) => {
              obj[h] = cells[i] ? (cells[i].innerText || cells[i].textContent || "").trim() : "";
            });
            rows.push(obj);
          } else {
            rows.push({ value: meaningful.join(" | ") });
          }
        });
      }
    } catch (e) {
      console.error("extractContentTable error:", e);
    }

    return rows;
  });
}

