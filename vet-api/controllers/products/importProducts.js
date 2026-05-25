// ===============================================
// 📄 controllers/products/importProducts.js
// Bulk import προϊόντων από CSV
// ===============================================

import Product from "../../models/Product.js";
import logger from "../../utils/logger.js";

const VALID_CATEGORIES = ["Φάρμακο", "Τροφή", "Παιχνίδι", "Αξεσουάρ", "Άλλο"];
const ALLOWED = ["name", "category", "quantity", "unit", "threshold", "barcode", "supplier", "notes"];

// Κανονικοποίηση κατηγορίας (ανεξαρτήτως πεζών/κεφαλαίων)
function normalizeCategory(raw = "") {
  const v = raw.trim();
  const match = VALID_CATEGORIES.find(
    (c) => c.toLowerCase() === v.toLowerCase()
  );
  return match || "Άλλο";
}

const pick = (obj) =>
  ALLOWED.reduce((acc, k) => {
    const v = String(obj[k] ?? "").trim();
    if (v) acc[k] = v;
    return acc;
  }, {});

export const importProducts = async (req, res, next) => {
  try {
    const rows = req.body?.products;

    if (!Array.isArray(rows) || rows.length === 0)
      return res.status(400).json({ message: "Δεν στάλθηκαν δεδομένα." });

    let inserted = 0;
    const errors = [];

    for (const row of rows) {
      const data = pick(row);

      // Validation: όνομα υποχρεωτικό
      if (!data.name || data.name.length < 2) {
        errors.push({ row, reason: "Λείπει ή πολύ μικρό όνομα (ελάχιστο 2 χαρακτήρες)" });
        continue;
      }

      // Κανονικοποίηση κατηγορίας
      data.category = normalizeCategory(data.category);

      // Μετατροπή αριθμητικών πεδίων
      data.quantity  = Math.max(0, parseInt(data.quantity,  10) || 0);
      data.threshold = Math.max(0, parseInt(data.threshold, 10) || 5);

      // Αν δεν υπάρχει barcode, αφαίρεσέ το τελείως (αποφυγή duplicate null)
      if (!data.barcode) delete data.barcode;

      try {
        await Product.create(data);
        inserted++;
      } catch (err) {
        // E11000 = duplicate key (barcode)
        const reason = err.code === 11000
          ? `Barcode "${data.barcode}" υπάρχει ήδη`
          : err.message;
        errors.push({ row, reason });
      }
    }

    logger.info(`📥 Bulk import προϊόντων: ${inserted} εισήχθησαν, ${errors.length} σφάλματα`);
    res.json({ inserted, errors });
  } catch (err) {
    next(err);
  }
};
