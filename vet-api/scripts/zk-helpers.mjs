// scripts/zk-helpers.mjs

// ZK widget IDs που βρήκες στη σελίδα βιβλιαρίου
export const BOOKLET_WIDGET_IDS = {
  microchip: "microchipCode",
  chipDate: "chipDate",
  petName: "name",
  gender: "gender",
  age: "age",
  breed: "animalRace",
  species: "kind",
  small: "animalSmall",
  color: "color",
  managedBy: "ownerNameC",
};

// ZK widget IDs για την καρτέλα ΣΤΕΙΡΩΣΗΣ
export const STERILIZATION_WIDGET_IDS = {
  button: "btnNeuter",
  cancelButton: "btnCancel",
  surgeryDate: "surgeryDate",
  ownerSubmission: "ownerSubmission",
  vetGenitalExam: "vetGenitalExam",
  diagnosticTechnique: "diagnosticTechnique",
};

// Πιθανά ZK widget IDs για τον εμβολιασμό στη σελίδα βιβλιαρίου
const VACCINATION_WIDGET_CANDIDATES = [
  "isVaccinated",
  "vaccination",
  "vaccinated",
  "animalVaccinated",
  "vaccinationStatus",
  "vaccineStatus",
  "animalVaccination",
];

// ZK widget IDs για τη σελίδα στοιχείων ΙΔΙΟΚΤΗΤΗ
export const OWNER_WIDGET_IDS = {
  firstName: "firstname",
  surname: "surname",
  phone: "cellphone",
  email: "email",
  address: "address",
  city: "regionalUnit",
  afm: "taxid",
};

// ZK widget id του search box στο backoffice (header search)
export const BACKOFFICE_SEARCH_WIDGET_ID = "bdHeaderSearch";

/**
 * Helper: περιμένει να εμφανιστούν ZK widgets στείρωσης (δηλαδή ότι άνοιξε το panel).
 * Χρήσιμο για να μην κάνεις extract πριν φορτώσει το UI.
 */
export async function waitSterilizationWidgets(page, timeout = 8000) {
  const ids = STERILIZATION_WIDGET_IDS;

  const ok = await page
    .waitForFunction(
      (wids) => {
        try {
          return (
            window.zk &&
            window.zk.Widget &&
            typeof window.zk.Widget.$ === "function" &&
            // αρκεί να υπάρχει έστω 1 “core” widget του panel
            (window.zk.Widget.$("$" + wids.surgeryDate) ||
              window.zk.Widget.$("$" + wids.diagnosticTechnique))
          );
        } catch {
          return false;
        }
      },
      ids,
      { timeout }
    )
    .then(() => true)
    .catch(() => false);

  return ok;
}

/**
 * Διαβάζει τιμές από ZK widgets μέσα στη σελίδα βιβλιαρίου.
 * (PURE read)
 */
export async function extractBookletData(page) {
  const ids = BOOKLET_WIDGET_IDS;

  try {
    const data = await page.evaluate((widgetIds) => {
      if (!window.zk || !zk.Widget) return {};

      const readWidget = (id) => {
        if (!id) return null;
        try {
          const w = zk.Widget.$("$" + id);
          if (!w) return null;

          if (typeof w.getValue === "function") return w.getValue();
          if (typeof w.getLabel === "function") return w.getLabel();

          // fallback στο DOM node αν υπάρχει
          try {
            const n = typeof w.$n === "function" ? w.$n() : null;
            if (n) {
              const t = (n.innerText || n.textContent || "").trim();
              return t || null;
            }
          } catch {}

          return null;
        } catch {
          return null;
        }
      };

      const rawMicrochip = readWidget(widgetIds.microchip);
      const rawName = readWidget(widgetIds.petName);
      const rawGender = readWidget(widgetIds.gender);
      const rawAge = readWidget(widgetIds.age);
      const rawBreed = readWidget(widgetIds.breed);
      const rawSpecies = readWidget(widgetIds.species);
      const rawSmall = readWidget(widgetIds.small);
      const rawColor = readWidget(widgetIds.color);
      const rawManagedBy = readWidget(widgetIds.managedBy);

      // Chip date: δοκίμασε ZK widget, fallback σε span.z-label με date pattern (DD/MM/YY HH:mm)
      let rawChipDate = readWidget(widgetIds.chipDate);
      if (!rawChipDate) {
        try {
          const labelSpans = Array.from(document.querySelectorAll("span.z-label"));
          for (const span of labelSpans) {
            const txt = (span.innerText || span.textContent || "").trim();
            if (/^\d{2}\/\d{2}\/\d{2,4}(\s+\d{2}:\d{2})?$/.test(txt)) {
              rawChipDate = txt;
              break;
            }
          }
        } catch {}
      }

      const normalizeAge = (v) => (v == null ? null : String(v).trim() || null);

      const normalizeSmall = (v) => {
        if (v == null) return null;
        const t = String(v).trim().toUpperCase();
        if (t === "NAI" || t === "ΝΑΙ") return true;
        if (t === "OXI" || t === "ΟΧΙ") return false;
        return v;
      };

      return {
        microchip: rawMicrochip ?? null,
        chipDate: rawChipDate ?? null,
        markingDate: rawChipDate ?? null,
        petName: rawName ?? null,
        name: rawName ?? null,
        sex: rawGender ?? null,
        age: normalizeAge(rawAge),
        petAge: normalizeAge(rawAge),
        breed: rawBreed ?? null,
        species: rawSpecies ?? null,
        isSmallPet: normalizeSmall(rawSmall),
        smallPet: normalizeSmall(rawSmall),
        color: rawColor ?? null,
        coatColor: rawColor ?? null,
        managedBy: rawManagedBy ?? null,
        managedByName: rawManagedBy ?? null,
      };
    }, ids);

    return data || {};
  } catch (error) {
    console.error("❌ Σφάλμα στο extractBookletData:", error);
    return {};
  }
}

/**
 * Διαβάζει τιμές από τα ZK widgets της καρτέλας ΣΤΕΙΡΩΣΗΣ.
 * (PURE read — ΔΕΝ πατάει κουμπιά, ΔΕΝ ανοίγει panel)
 *
 * Προϋπόθεση: έχεις ήδη ανοίξει την καρτέλα/φόρμα στείρωσης (btnNeuter) στο flow.
 */
export async function extractSterilizationData(page) {
  const ids = STERILIZATION_WIDGET_IDS;

  try {
    const data = await page.evaluate((widgetIds) => {
      if (!window.zk || !zk.Widget) return {};

      const readWidget = (id) => {
        if (!id) return null;
        try {
          const w = zk.Widget.$("$" + id);
          if (!w) return null;

          if (typeof w.getValue === "function") return w.getValue();
          if (typeof w.getLabel === "function") return w.getLabel();

          // DOM fallback
          try {
            const n = typeof w.$n === "function" ? w.$n() : null;
            if (n) {
              const t = (n.innerText || n.textContent || "").trim();
              return t || null;
            }
          } catch {}

          return null;
        } catch {
          return null;
        }
      };

      const readCheckbox = (id) => {
        if (!id) return null;
        try {
          const w = zk.Widget.$("$" + id);
          if (!w) return null;

          let v = null;

          if (typeof w.isChecked === "function") v = w.isChecked();
          else if (typeof w.getChecked === "function") v = w.getChecked();
          else if (typeof w.getValue === "function") v = w.getValue();
          else if (typeof w.getLabel === "function") v = w.getLabel();

          if (typeof v === "boolean") return v;
          if (v == null) return null;

          const t = String(v).trim().toUpperCase();
          if (t === "NAI" || t === "ΝΑΙ" || t === "TRUE" || t === "ON") return true;
          if (t === "OXI" || t === "ΟΧΙ" || t === "FALSE" || t === "OFF") return false;

          return null;
        } catch {
          return null;
        }
      };

      const normalize = (v) => {
        if (v == null) return null;
        // αν είναι Date από ZK getValue()
        try {
          if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString();
        } catch {}
        const t = String(v).trim();
        return t === "" ? null : t;
      };

      const rawSurgeryDate = readWidget(widgetIds.surgeryDate);
      const ownerSubmission = readCheckbox(widgetIds.ownerSubmission);
      const vetGenitalExam = readCheckbox(widgetIds.vetGenitalExam);
      const rawDiagnosticTechnique = readWidget(widgetIds.diagnosticTechnique);

      const sterilizationDate = normalize(rawSurgeryDate);
      const sterilizationDiagnosticTechnique = normalize(rawDiagnosticTechnique);

      const isSterilized =
        !!sterilizationDate ||
        ownerSubmission === true ||
        vetGenitalExam === true;

      return {
        sterilizationDate,
        sterilizationOwnerSubmission: ownerSubmission,
        sterilizationVetGenitalExam: vetGenitalExam,
        sterilizationDiagnosticTechnique,
        isSterilized,
      };
    }, ids);

    return data || {};
  } catch (error) {
    console.error("❌ Σφάλμα στο extractSterilizationData:", error);
    return {};
  }
}

/**
 * Διαβάζει τιμές από ZK widgets μέσα στη σελίδα ΙΔΙΟΚΤΗΤΗ.
 * (PURE read)
 */
export async function extractOwnerData(page) {
  const ids = OWNER_WIDGET_IDS;

  try {
    const data = await page.evaluate((widgetIds) => {
      if (!window.zk || !zk.Widget) return {};

      const readWidget = (id) => {
        if (!id) return null;
        try {
          const w = zk.Widget.$("$" + id);
          if (!w) return null;

          if (typeof w.getValue === "function") return w.getValue();
          if (typeof w.getLabel === "function") return w.getLabel();

          // DOM fallback
          try {
            const n = typeof w.$n === "function" ? w.$n() : null;
            if (n) {
              const t = (n.innerText || n.textContent || "").trim();
              return t || null;
            }
          } catch {}

          return null;
        } catch {
          return null;
        }
      };

      const normalize = (v) => {
        if (v == null) return null;
        const t = String(v).trim();
        return t === "" ? null : t;
      };

      const rawFirstName = readWidget(widgetIds.firstName);
      const rawSurname = readWidget(widgetIds.surname);

      const rawPhone = readWidget(widgetIds.phone);
      const rawEmail = readWidget(widgetIds.email);
      const rawAddress = readWidget(widgetIds.address);
      const rawCity = readWidget(widgetIds.city);
      const rawAfm = readWidget(widgetIds.afm);

      const firstName = normalize(rawFirstName);
      const surname = normalize(rawSurname);

      const fullName =
        firstName || surname ? [firstName, surname].filter(Boolean).join(" ") : null;

      return {
        fullName,
        phone: normalize(rawPhone),
        email: normalize(rawEmail),
        address: normalize(rawAddress),
        city: normalize(rawCity),
        afm: normalize(rawAfm),
      };
    }, ids);

    return data || {};
  } catch (error) {
    console.error("❌ Σφάλμα στο extractOwnerData:", error);
    return {};
  }
}

/**
 * Εξάγει την κατάσταση εμβολιασμού από τη σελίδα βιβλιαρίου.
 * Δοκιμάζει πιθανά ZK widget IDs και κάνει fallback σε DOM text search.
 * Καλείται ενώ η σελίδα βιβλιαρίου είναι ανοιχτή (χωρίς πλοήγηση).
 */
export async function extractVaccinationFromBooklet(page) {
  try {
    // Phase 1: Εξαγωγή status από span.z-label (κύρια σελίδα booklet)
    const statusRaw = await page.evaluate((candidates) => {
      const readWidget = (id) => {
        try {
          if (!window.zk || !zk.Widget) return null;
          const w = zk.Widget.$("$" + id);
          if (!w) return null;
          if (typeof w.getValue === "function") return w.getValue();
          if (typeof w.getLabel === "function") return w.getLabel();
          try {
            const n = typeof w.$n === "function" ? w.$n() : null;
            if (n) return (n.innerText || n.textContent || "").trim() || null;
          } catch {}
          return null;
        } catch { return null; }
      };

      for (const id of candidates) {
        const v = readWidget(id);
        if (v != null && String(v).trim() !== "") return String(v).trim();
      }

      // DOM fallback: span.z-label
      try {
        for (const span of document.querySelectorAll("span.z-label")) {
          const txt = (span.innerText || span.textContent || "").trim();
          if (/^εμβολιασμένο$/i.test(txt) || /^ανεμβολίαστο$/i.test(txt)) return txt;
        }
      } catch {}

      return null;
    }, VACCINATION_WIDGET_CANDIDATES);

    const statusLower = (statusRaw || "").toLowerCase();
    const isVaccinated = statusRaw
      ? statusLower.includes("εμβολιασμένο") || statusLower === "true" || statusLower === "ναι"
      : null;

    // Phase 2: Κλικ στο "Γεγονότα Ιατρικού Φακέλου" tab → εξαγωγή λεπτομερειών
    let lastVacDate = null;
    let vacBrand = null;
    let vacType = null;

    try {
      // Κλικ στο tab
      const tabClicked = await _clickMedicalEventsTab(page);
      if (tabClicked) {
        // Περιμένουμε να φορτώσει το content του tab
        await page.waitForTimeout(2000);

        const details = await page.evaluate(() => {
          const getText = (el) => (el.innerText || el.textContent || "").trim();
          let lastVacDate = null;
          let vacBrand = null;
          let vacType = null;

          // Χρησιμοποιούμε .z-listitem (όχι tr.) για συμβατότητα με li/tr/div
          const allRows = Array.from(document.querySelectorAll(".z-listitem"));

          // STEP 1: Βρες summary vaccination rows → πιο πρόσφατη ημερομηνία
          let bestTs = 0;
          for (const row of allRows) {
            const cells = Array.from(row.querySelectorAll("div.z-listcell-content")).map(getText).filter(Boolean);
            if (!cells.some(c => /εμβολιασμ/i.test(c))) continue;
            const dc = cells.find(c => /^\d{2}\/\d{2}\/\d{4}$/.test(c));
            if (!dc) continue;
            const [d, m, y] = dc.split("/").map(Number);
            const ts = new Date(y, m - 1, d).getTime();
            if (ts > bestTs) { bestTs = ts; lastVacDate = dc; }
          }

          // STEP 2: Βρες detail row που έχει ΚΑΙ Latin brand ΚΑΙ Greek type (πεζά)
          for (const row of allRows) {
            const cells = Array.from(row.querySelectorAll("div.z-listcell-content")).map(getText).filter(Boolean);
            const lb = cells.find(c => /[A-Z]{2,}/.test(c) && !/[α-ωΑ-Ω]/.test(c) && !/\*/.test(c) && !/^\d/.test(c));
            const gt = cells.find(c => /[α-ω]/.test(c) && !/\*/.test(c) && !/εμβολιασμ/i.test(c) && !/ζώου/i.test(c));
            if (lb && gt) { vacBrand = lb; vacType = gt; break; }
          }

          return { lastVacDate, vacBrand, vacType };
        });

        console.log("🔬 [VAC] details:", details);
        lastVacDate = details.lastVacDate;
        vacBrand = details.vacBrand;
        vacType = details.vacType;

        // Επιστροφή στο πρώτο tab (summary/booklet)
        await _returnToBookletSummaryTab(page);
      }
    } catch (detailErr) {
      console.warn("⚠️ [extractVaccinationFromBooklet] Αποτυχία εξαγωγής details:", detailErr?.message);
    }

    return { isVaccinated, vaccinationRaw: statusRaw, lastVacDate, vacBrand, vacType };
  } catch (err) {
    console.error("❌ Σφάλμα στο extractVaccinationFromBooklet:", err);
    return { isVaccinated: null };
  }
}

async function _clickMedicalEventsTab(page) {
  // 1) Μέσω z-tab-text span (hospital icon + text)
  try {
    const tabSpan = page.locator("span.z-tab-text").filter({ hasText: /Ιατρικ/i }).first();
    if (await tabSpan.isVisible().catch(() => false)) {
      await tabSpan.click({ timeout: 5000 });
      console.log("✅ [_clickMedicalEventsTab] Click via span.z-tab-text Ιατρικ.");
      return true;
    }
  } catch {}

  // 2) Μέσω parent .z-tab element
  try {
    const tab = page.locator(".z-tab").filter({ hasText: /Ιατρικ/i }).first();
    if (await tab.isVisible().catch(() => false)) {
      await tab.click({ timeout: 5000 });
      console.log("✅ [_clickMedicalEventsTab] Click via .z-tab Ιατρικ.");
      return true;
    }
  } catch {}

  // 3) Μέσω img src (hospital SVG)
  try {
    const img = page.locator('img[src*="local_hospital"]').first();
    if (await img.isVisible().catch(() => false)) {
      const parent = img.locator("..").locator("..");
      await parent.click({ timeout: 5000 });
      console.log("✅ [_clickMedicalEventsTab] Click via hospital img parent.");
      return true;
    }
  } catch {}

  // 4) getByRole tab
  try {
    const roleTab = page.getByRole("tab", { name: /Ιατρικ/i }).first();
    if (await roleTab.isVisible().catch(() => false)) {
      await roleTab.click({ timeout: 5000 });
      console.log("✅ [_clickMedicalEventsTab] Click via getByRole tab.");
      return true;
    }
  } catch {}

  // 5) getByText fallback
  const textPatterns = [
    /Γεγονότα\s*Ιατρικού\s*Φακέλου/i,
    /Ιατρικού\s*Φακέλου/i,
    /Ιατρικου\s*Φακελου/i,
  ];
  for (const re of textPatterns) {
    try {
      const el = page.getByText(re, { exact: false }).first();
      if (await el.isVisible().catch(() => false)) {
        await el.click({ timeout: 5000 });
        console.log("✅ [_clickMedicalEventsTab] Click via getByText:", re);
        return true;
      }
    } catch {}
  }

  console.warn("⚠️ [_clickMedicalEventsTab] Δεν βρέθηκε το 'Γεγονότα Ιατρικού Φακέλου' tab.");
  return false;
}

async function _returnToBookletSummaryTab(page) {
  // Κλικ στο πρώτο tab (summary / booklet)
  const patterns = [/Ψηφιακό\s*Χρονολόγιο/i, /Χρονολόγιο/i, /Παρακολούθηση/i, /Παρακολουθηση/i];
  for (const re of patterns) {
    try {
      const el = page.getByText(re, { exact: false }).first();
      if (await el.isVisible().catch(() => false)) {
        await el.click({ timeout: 5000 });
        await page.waitForTimeout(500);
        return;
      }
    } catch {}
  }
}

/**
 * Κάνει search στο backoffice χρησιμοποιώντας το ZK widget (bdHeaderSearch),
 * και επιπλέον ρίχνει DOM events (input + Enter) σαν fallback.
 *
 * Προσοχή: Αυτό εδώ είναι “επιθετικό” επίτηδες (πολλά events),
 * άρα αν το καλείς μαζί με άλλα search mechanics μπορεί να φαίνεται σαν “διπλό”.
 */
export async function triggerBackofficeSearch(page, microchip) {
  console.log(
    "[triggerBackofficeSearch] Περιμένω να φορτώσει το ZK header search widget...",
    BACKOFFICE_SEARCH_WIDGET_ID
  );

  await page.waitForFunction(
    (id) =>
      !!(
        window.zk &&
        window.zk.Widget &&
        window.zAu &&
        zk.Widget.$("$" + id)
      ),
    BACKOFFICE_SEARCH_WIDGET_ID,
    { timeout: 30000 }
  );

  const result = await page.evaluate(
    ({ microchip, searchId }) => {
      const out = {
        zkAvailable: !!(window.zk && window.zk.Widget),
        zAuAvailable: !!window.zAu,
        widgetIdTried: searchId,
        widgetFound: false,
        usedSetValue: false,
        usedSetText: false,
        usedGetInputNode: false,
        firedOnChanging: false,
        firedOnChange: false,
        firedOnOK: false,
        firedDomInputEvent: false,
        firedDomEnterKey: false,
        error: null,
      };

      try {
        if (!out.zkAvailable || !out.zAuAvailable) {
          out.error = "ZK or zAu not available in backoffice page";
          return out;
        }

        const w = zk.Widget.$("$" + searchId);
        if (!w) {
          out.error = "Search widget not found via zk.Widget.$('$" + searchId + "')";
          return out;
        }

        out.widgetFound = true;

        // set value
        if (microchip) {
          try {
            if (typeof w.setValue === "function") {
              w.setValue(microchip);
              out.usedSetValue = true;
            } else if (typeof w.setText === "function") {
              w.setText(microchip);
              out.usedSetText = true;
            } else {
              const inputNode = typeof w.getInputNode === "function" ? w.getInputNode() : null;
              if (inputNode) {
                out.usedGetInputNode = true;
                inputNode.value = microchip;
              }
            }
          } catch (eSet) {
            out.error = "Error while setting widget value: " + (eSet?.message || eSet);
            return out;
          }
        }

        // ZK events
        try {
          try {
            window.zAu.send(
              new zk.Event(w, "onChanging", { value: microchip, start: 0, bySelectBack: false })
            );
            out.firedOnChanging = true;
          } catch {}

          try {
            window.zAu.send(new zk.Event(w, "onChange", { value: microchip }));
            out.firedOnChange = true;
          } catch {}

          try {
            window.zAu.send(new zk.Event(w, "onOK", {}));
            out.firedOnOK = true;
          } catch {}
        } catch (eEvt) {
          out.error = "Error while sending ZK events: " + (eEvt?.message || eEvt);
        }

        // DOM fallback
        try {
          const inputNode = typeof w.getInputNode === "function" ? w.getInputNode() : null;
          if (inputNode) {
            out.usedGetInputNode = true;
            if (microchip) inputNode.value = microchip;

            inputNode.dispatchEvent(new Event("input", { bubbles: true }));
            out.firedDomInputEvent = true;

            inputNode.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "Enter",
                code: "Enter",
                keyCode: 13,
                which: 13,
                bubbles: true,
              })
            );
            out.firedDomEnterKey = true;
          }
        } catch (eDom) {
          out.error = "Error while firing DOM events: " + (eDom?.message || eDom);
        }

        return out;
      } catch (err) {
        out.error = "Unexpected error in triggerBackofficeSearch(): " + (err?.message || err);
        return out;
      }
    },
    { microchip, searchId: BACKOFFICE_SEARCH_WIDGET_ID }
  );

  if (!result.zkAvailable || !result.zAuAvailable) {
    throw new Error(
      "[triggerBackofficeSearch] ZK ή zAu δεν είναι διαθέσιμα στη σελίδα backoffice."
    );
  }

  if (!result.widgetFound) {
    throw new Error(
      `[triggerBackofficeSearch] Δεν βρέθηκε search widget (id "${result.widgetIdTried}").`
    );
  }

  if (
    !result.firedOnChanging &&
    !result.firedOnChange &&
    !result.firedOnOK &&
    !result.firedDomInputEvent &&
    !result.firedDomEnterKey
  ) {
    throw new Error(
      "[triggerBackofficeSearch] Δεν κατάφερα να πυροδοτήσω κανένα ZK ή DOM event."
    );
  }

  console.log("[triggerBackofficeSearch] debug result:", result);
  return result;
}
