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
 */
async function extractSection(page, sectionLabel) {
  try {
    // Κλικ στο sidebar item
    const sidebarItem = page.getByText(sectionLabel, { exact: false }).first();
    if (await sidebarItem.isVisible().catch(() => false)) {
      await sidebarItem.click({ timeout: 8000 });
      await page.waitForTimeout(800);
    }

    // Εξαγωγή πίνακα από το DOM
    return await extractActiveTable(page);
  } catch (err) {
    console.warn(`⚠️ extractSection(${sectionLabel}):`, err?.message);
    return [];
  }
}

/**
 * Εξάγει δεδομένα από τον ενεργό πίνακα στη σελίδα.
 * Χρησιμοποιεί DOM traversal — λειτουργεί με ZK Listbox/Grid.
 */
async function extractActiveTable(page) {
  return await page.evaluate(() => {
    const rows = [];

    try {
      // ZK Listbox: z-listbox > z-listhead (headers) + z-listitem (rows)
      const listbox = document.querySelector(".z-listbox");
      if (listbox) {
        const headerCells = listbox.querySelectorAll(".z-listheader, .z-listhead .z-listcell");
        const headers = Array.from(headerCells)
          .map(h => (h.innerText || h.textContent || "").trim())
          .filter(h => h && h !== "Ενέργειες" && h !== "#");

        const listItems = listbox.querySelectorAll(".z-listitem");
        listItems.forEach(item => {
          const cells = item.querySelectorAll(".z-listcell");
          if (!cells.length) return;

          const values = Array.from(cells)
            .map(c => (c.innerText || c.textContent || "").trim());

          // Παράλειψη κενών rows και action columns
          const meaningful = values.filter(v => v && v !== "×" && v !== "✎" && !/^\d+$/.test(v));
          if (!meaningful.length) return;

          if (headers.length > 0) {
            const obj = {};
            headers.forEach((h, i) => {
              // +1 για skip του # column
              const cell = cells[i + 1];
              obj[h] = cell ? (cell.innerText || cell.textContent || "").trim() : "";
            });
            rows.push(obj);
          } else {
            rows.push({ value: meaningful.join(" | ") });
          }
        });

        if (rows.length > 0) return rows;
      }

      // ZK Grid fallback: z-grid > z-rows > z-row
      const grid = document.querySelector(".z-grid");
      if (grid) {
        const headerCells = grid.querySelectorAll(".z-columns .z-column");
        const headers = Array.from(headerCells)
          .map(h => (h.innerText || h.textContent || "").trim())
          .filter(h => h && h !== "Ενέργειες" && h !== "#");

        const gridRows = grid.querySelectorAll(".z-rows .z-row");
        gridRows.forEach(row => {
          const cells = row.querySelectorAll(".z-cell");
          if (!cells.length) return;

          const values = Array.from(cells).map(c => (c.innerText || c.textContent || "").trim());
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

        if (rows.length > 0) return rows;
      }

      // HTML table fallback
      const table = document.querySelector("table");
      if (table) {
        const headerEls = table.querySelectorAll("thead th, thead td");
        const headers = Array.from(headerEls)
          .map(h => (h.innerText || h.textContent || "").trim())
          .filter(h => h && h !== "Ενέργειες" && h !== "#");

        const bodyRows = table.querySelectorAll("tbody tr");
        bodyRows.forEach(row => {
          const cells = row.querySelectorAll("td");
          if (!cells.length) return;

          const values = Array.from(cells).map(c => (c.innerText || c.textContent || "").trim());
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
      console.error("extractActiveTable error:", e);
    }

    return rows;
  });
}
