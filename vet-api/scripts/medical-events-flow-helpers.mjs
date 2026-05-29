// scripts/medical-events-flow-helpers.mjs
//
// Scraping του "Ψηφιακό Χρονολόγιο" tab από pet.gov.gr/emzs-backoffice/
// Περιέχει ΟΛΑ τα γεγονότα σε έναν πίνακα — ομαδοποιούμε ανά τύπο.

import { BOOKLET_WIDGET_IDS } from "./zk-helpers.mjs";

// Mapping από "Γεγονός" text → section key
const EVENT_TYPE_MAP = [
  { key: "vaccinations",    patterns: ["εμβολιασμ"] },
  { key: "antiparasitic",   patterns: ["αντιπαρασιτικ"] },
  { key: "sterilization",   patterns: ["στείρωση", "στειρωση"] },
  { key: "microchip",       patterns: ["σήμανση", "σημανση", "καταγραφ"] },
  { key: "acquisition",     patterns: ["απόκτηση", "αποκτηση"] },
  { key: "birth",           patterns: ["γέννηση", "γεννηση"] },
  { key: "diagnostics",     patterns: ["διαγνωστικ"] },
  { key: "diseases",        patterns: ["νόσημα", "νοσημα"] },
  { key: "hereditary",      patterns: ["κληρονομικ"] },
  { key: "genetic",         patterns: ["γενετικ"] },
  { key: "clinical",        patterns: ["κλινικ"] },
  { key: "treatments",      patterns: ["θεραπε"] },
  { key: "surgeries",       patterns: ["επέμβαση", "επεμβαση"] },
  { key: "hospitalization", patterns: ["νοσηλε"] },
  { key: "passport",        patterns: ["διαβατήριο", "διαβατηριο"] },
  { key: "ownership",       patterns: ["ιδιοκτησ", "μεταβίβαση", "μεταβιβαση"] },
];

function classifyEvent(eventText) {
  const lower = (eventText || "").toLowerCase();
  for (const { key, patterns } of EVENT_TYPE_MAP) {
    if (patterns.some(p => lower.includes(p))) return key;
  }
  return "other";
}

/**
 * Κύρια ροή: αναζητά microchip, ανοίγει booklet, πηγαίνει στο
 * "Ψηφιακό Χρονολόγιο" tab και εξάγει ΟΛΑ τα events.
 * Επιστρέφει data ομαδοποιημένα ανά τύπο + timeline (όλα μαζί).
 */
export async function runMedicalEventsFlow(page, microchip) {
  const trimmed = (microchip || "").trim();
  console.log("🏥 runMedicalEventsFlow για microchip:", trimmed);

  const emptyData = () => ({
    timeline: [],
    vaccinations: [], antiparasitic: [], sterilization: [],
    microchip: [], acquisition: [], birth: [], diagnostics: [],
    diseases: [], hereditary: [], genetic: [], clinical: [],
    treatments: [], surgeries: [], hospitalization: [],
    passport: [], ownership: [], other: [],
  });

  try {
    if (!trimmed) {
      return { ok: false, found: false, reason: "MISSING_MICROCHIP", data: emptyData() };
    }

    // 1) Search page
    const inSearch = await goToSearchPage(page);
    if (!inSearch) {
      return { ok: false, found: false, reason: "SEARCH_PAGE_NOT_REACHED", data: emptyData() };
    }

    // 2) Search + open booklet
    const opened = await searchAndOpenBooklet(page, trimmed);
    if (!opened) {
      return { ok: true, found: false, reason: "NO_RESULTS_OR_OPEN_FAILED", data: emptyData() };
    }

    // 3) Κλικ στο "Ψηφιακό Χρονολόγιο" tab (ή είναι ήδη το default)
    await clickChronologyTab(page);

    // 4) Εξαγωγή ολόκληρου του πίνακα
    const allRows = await extractChronologyTable(page);
    console.log(`   📋 Βρέθηκαν ${allRows.length} εγγραφές συνολικά`);

    // 5) Ομαδοποίηση ανά τύπο γεγονότος
    const data = emptyData();
    data.timeline = allRows;

    for (const row of allRows) {
      const eventText = row["Γεγονός"] || row["Γεγονος"] || row["event"] || Object.values(row)[0] || "";
      const key = classifyEvent(eventText);
      if (data[key]) data[key].push(row);
      else data.other.push(row);
    }

    // 6) Επιστροφή σε search page
    await goToSearchPage(page);

    return { ok: true, found: true, reason: "OK", data };
  } catch (err) {
    console.error("❌ [runMedicalEventsFlow] Fatal error:", err);
    try { await goToSearchPage(page); } catch {}
    return {
      ok: false, found: false, reason: "EXCEPTION",
      details: err?.message, data: emptyData(),
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

/**
 * Κλικ στο "Ψηφιακό Χρονολόγιο" tab.
 * Είναι συνήθως το πρώτο/default tab — αν όχι το κάνουμε κλικ.
 * Export για χρήση και από άλλους flows.
 */
export async function clickChronologyTab(page) {
  const tabTexts = [
    /Ψηφιακό\s*Χρονολόγιο/i,
    /Χρονολόγιο/i,
    /Χρονολογιο/i,
    /Digital/i,
    /Timeline/i,
  ];

  for (const re of tabTexts) {
    try {
      const el = page.getByText(re, { exact: false }).first();
      if (await el.isVisible().catch(() => false)) {
        await el.click({ timeout: 5000 });
        await page.waitForTimeout(1000);
        console.log("✅ [clickChronologyTab] Πάτησα Χρονολόγιο tab.");
        return true;
      }
    } catch {}
  }

  // Ίσως είναι ήδη ανοιχτό — συνεχίζουμε
  console.log("ℹ️ [clickChronologyTab] Tab δεν βρέθηκε — ίσως είναι default.");
  return true;
}

/**
 * Εξάγει τον πίνακα του Ψηφιακού Χρονολογίου.
 * Στήλες: Γεγονός | Ημερομηνία | Όνομα Κατόχου | Καταχωρίσθηκε από
 * Export για χρήση και από άλλους flows.
 */
export async function extractChronologyTable(page) {
  // Περιμένουμε να φορτώσει ο πίνακας
  await page.waitForTimeout(1200);

  return await page.evaluate(() => {
    const rows = [];

    const extractFromListbox = (lb) => {
      const result = [];
      const headerEls = lb.querySelectorAll(".z-listheader");
      const headers = Array.from(headerEls)
        .map(h => (h.innerText || h.textContent || "").trim())
        .filter(h => h && h !== "#" && h !== "Ενέργειες");

      if (headers.length === 0) return result;

      const items = lb.querySelectorAll(".z-listitem");
      items.forEach(item => {
        const cells = Array.from(item.querySelectorAll(".z-listcell"));
        if (!cells.length) return;

        const values = cells.map(c => (c.innerText || c.textContent || "").trim());
        const meaningful = values.filter(v => v && v !== "×" && v !== "✎");
        if (!meaningful.length) return;

        // Skip index cell (#) αν είναι αριθμός
        const offset = /^\d+$/.test(values[0]) ? 1 : 0;

        const obj = {};
        headers.forEach((h, i) => {
          const cell = cells[i + offset];
          obj[h] = cell ? (cell.innerText || cell.textContent || "").trim() : "";
        });

        // Αν τουλάχιστον μία στήλη έχει τιμή
        if (Object.values(obj).some(v => v && v !== "")) {
          result.push(obj);
        }
      });

      return result;
    };

    // Βρίσκουμε τον "σωστό" listbox:
    // Έχει headers που περιλαμβάνουν "Γεγονός" ή "Ημερομηνία"
    const allListboxes = Array.from(document.querySelectorAll(".z-listbox"));

    for (const lb of allListboxes) {
      const headers = Array.from(lb.querySelectorAll(".z-listheader"))
        .map(h => (h.innerText || h.textContent || "").trim());

      const isChronology = headers.some(h =>
        h.includes("Γεγον") || h.includes("Ημερομ") || h.includes("Κάτοχ") || h.includes("Κατοχ")
      );

      if (isChronology) {
        const data = extractFromListbox(lb);
        if (data.length > 0) return data;
      }
    }

    // Fallback: παίρνουμε τον μεγαλύτερο listbox
    const biggest = allListboxes.sort(
      (a, b) => b.querySelectorAll(".z-listitem").length - a.querySelectorAll(".z-listitem").length
    )[0];

    if (biggest) return extractFromListbox(biggest);

    return rows;
  });
}
