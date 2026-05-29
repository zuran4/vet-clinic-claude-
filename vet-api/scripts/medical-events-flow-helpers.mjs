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
 * Κάνει κλικ σε sidebar section χρησιμοποιώντας ZK events + DOM click.
 * Στρατηγική: βρίσκει το element με το label που βρίσκεται αριστερά στη σελίδα.
 */
async function extractSection(page, sectionLabel) {
  try {
    // Κλικ στο σωστό sidebar item
    await page.evaluate((label) => {
      // Βρίσκουμε όλα τα elements με αυτό το κείμενο
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        null
      );

      const matches = [];
      let node;
      while ((node = walker.nextNode())) {
        const text = (node.innerText || "").trim();
        if (text === label && node.children.length === 0) {
          matches.push(node);
        }
      }

      if (!matches.length) return;

      // Προτιμάμε το element που βρίσκεται στο αριστερό μισό της σελίδας
      const pageWidth = window.innerWidth;
      const leftEl = matches.find(el => {
        const rect = el.getBoundingClientRect();
        return rect.left < pageWidth / 2 && rect.width > 0;
      }) || matches[0];

      if (!leftEl) return;

      // Δοκιμάζουμε ZK event πρώτα
      if (window.zk && window.zAu) {
        try {
          const w = zk.Widget.$(leftEl);
          if (w) {
            window.zAu.send(new zk.Event(w, "onClick"));
            return;
          }
          // Ανεβαίνουμε στο parent για να βρούμε το ZK widget
          let parent = leftEl.parentElement;
          for (let i = 0; i < 5 && parent; i++) {
            const pw = zk.Widget.$(parent);
            if (pw) {
              window.zAu.send(new zk.Event(pw, "onClick"));
              return;
            }
            parent = parent.parentElement;
          }
        } catch {}
      }

      // Fallback: απλό DOM click
      leftEl.click();
    }, sectionLabel);

    // Περιμένουμε να φορτώσει το content (1.5 δευτ.)
    await page.waitForTimeout(1500);

    return await extractContentTable(page);
  } catch (err) {
    console.warn(`⚠️ extractSection(${sectionLabel}):`, err?.message);
    return [];
  }
}

/**
 * Εξάγει δεδομένα από τον πίνακα δεδομένων.
 * Βρίσκει το σωστό listbox εξετάζοντας τα headers του:
 * - Sidebar listbox: έχει section ονόματα ως items (Εμβολιασμοί, Στείρωση κλπ)
 * - Content listbox: έχει data columns (Ημερομηνία, κλπ)
 */
async function extractContentTable(page) {
  return await page.evaluate(() => {
    const rows = [];
    const SECTION_NAMES = [
      "Εμβολιασμοί", "Διαγνωστικές εξετάσεις", "Νοσήματα",
      "Κληρονομικές", "Στείρωση", "Γενετικό", "Αντιπαρασιτικές",
      "Κλινική", "Θεραπείες", "Επεμβάσεις", "Νοσηλεία",
    ];

    const isSidebarListbox = (lb) => {
      // Αν τα items του είναι section ονόματα → είναι sidebar
      const items = lb.querySelectorAll(".z-listitem, .z-treeitem");
      let sectionCount = 0;
      items.forEach(item => {
        const text = (item.innerText || "").trim();
        if (SECTION_NAMES.some(s => text.startsWith(s))) sectionCount++;
      });
      return sectionCount > 2;
    };

    const extractFromListbox = (listbox) => {
      const result = [];
      const headerCells = listbox.querySelectorAll(".z-listheader");
      const headers = Array.from(headerCells)
        .map(h => (h.innerText || h.textContent || "").trim())
        .filter(h => h && h !== "Ενέργειες" && h !== "#" && h.length > 0);

      const listItems = listbox.querySelectorAll(".z-listitem");
      listItems.forEach(item => {
        const cells = Array.from(item.querySelectorAll(".z-listcell"));
        if (!cells.length) return;
        const values = cells.map(c => (c.innerText || c.textContent || "").trim());
        const meaningful = values.filter(v => v && v !== "×" && v !== "✎" && v !== "");
        if (!meaningful.length) return;

        if (headers.length >= 2) {
          const obj = {};
          // Skip πρώτο cell αν είναι αριθμός (index #)
          const offset = /^\d+$/.test(values[0]) ? 1 : 0;
          headers.forEach((h, i) => {
            const cell = cells[i + offset];
            obj[h] = cell ? (cell.innerText || cell.textContent || "").trim() : "";
          });
          result.push(obj);
        } else {
          result.push({ value: meaningful.join(" | ") });
        }
      });
      return result;
    };

    try {
      // Βρίσκουμε όλα τα listboxes
      const allListboxes = Array.from(document.querySelectorAll(".z-listbox"));

      // Φιλτράρουμε — κρατάμε μόνο αυτά που ΔΕΝ είναι sidebar
      const contentListboxes = allListboxes.filter(lb => !isSidebarListbox(lb));

      // Παίρνουμε αυτό με τα περισσότερα headers (πίνακας δεδομένων)
      const best = contentListboxes.sort(
        (a, b) =>
          b.querySelectorAll(".z-listheader").length -
          a.querySelectorAll(".z-listheader").length
      )[0];

      if (best) {
        const result = extractFromListbox(best);
        if (result.length > 0 || best.querySelectorAll(".z-listheader").length >= 2) {
          return result;
        }
      }

      // Fallback: grid
      const grid = document.querySelector(".z-grid");
      if (grid) {
        const headers = Array.from(grid.querySelectorAll(".z-column"))
          .map(h => (h.innerText || "").trim())
          .filter(h => h && h !== "Ενέργειες" && h !== "#");

        grid.querySelectorAll(".z-row").forEach(row => {
          const cells = Array.from(row.querySelectorAll(".z-cell"));
          const meaningful = cells.map(c => (c.innerText || "").trim()).filter(v => v && v !== "×");
          if (!meaningful.length) return;
          if (headers.length >= 2) {
            const obj = {};
            headers.forEach((h, i) => { obj[h] = cells[i] ? (cells[i].innerText || "").trim() : ""; });
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

