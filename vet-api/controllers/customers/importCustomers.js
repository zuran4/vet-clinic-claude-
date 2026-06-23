// ===============================================
// 📄 controllers/customers/importCustomers.js
// Bulk import πελατών από CSV — χωρίς email/SMS
// ===============================================

import logger from "../../utils/logger.js";

const ALLOWED = ["name", "phone", "email", "address", "notes"];

const pick = (obj) =>
  ALLOWED.reduce((acc, k) => {
    const v = String(obj[k] ?? "").trim();
    if (v) acc[k] = v;
    return acc;
  }, {});

export const importCustomers = async (req, res, next) => {
  try {
    const { Customer } = req.models;
    const rows = req.body?.customers;

    if (!Array.isArray(rows) || rows.length === 0)
      return res.status(400).json({ message: "Δεν στάλθηκαν δεδομένα." });

    let inserted = 0;
    const errors = [];

    for (const row of rows) {
      const data = pick(row);

      // Validation: υποχρεωτικά πεδία
      if (!data.name || data.name.length < 2) {
        errors.push({ row, reason: "Λείπει ή μικρό όνομα (ελάχιστο 2 χαρακτήρες)" });
        continue;
      }
      if (!data.phone || data.phone.replace(/\D/g, "").length < 10) {
        errors.push({ row, reason: "Λείπει ή μη έγκυρο τηλέφωνο (ελάχιστο 10 ψηφία)" });
        continue;
      }

      try {
        await Customer.create({
          ...data,
          // Bulk import: ειδοποιήσεις OFF — αποφεύγουμε spam email/SMS
          notifications: { email: false, sms: false, reminders: true, promotions: false },
        });
        inserted++;
      } catch (err) {
        errors.push({ row, reason: err.message });
      }
    }

    logger.info(`📥 Bulk import πελατών: ${inserted} εισήχθησαν, ${errors.length} σφάλματα`);
    res.json({ inserted, errors });
  } catch (err) {
    next(err);
  }
};
