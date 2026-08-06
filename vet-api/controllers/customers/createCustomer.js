// ===============================================
// 📄 createCustomer.js
// Περιγραφή: Δημιουργεί νέο πελάτη, με αποστολή email & SMS καλωσορίσματος
// ===============================================

import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";
import { sendWelcomeEmail } from "../../services/emailService.js";
import { sendSMS } from "../../services/smsService.js";
import { welcomeSms } from "../../services/smsTemplates.js";
import { emitChange } from "../../utils/realtime.js";

// ===============================
// POST /api/customers
// ===============================
export const createCustomer = async (req, res, next) => {
  try {
    const { Customer, Settings } = req.models;
    const { name, phone } = req.body;

    // 🔹 Έλεγχος διπλότυπου: ίδιο όνομα ΚΑΙ τηλέφωνο
    if (name && phone) {
      const existing = await Customer.findOne({
        name:  { $regex: `^${name.trim()}$`, $options: "i" },
        phone: phone.trim(),
      });
      if (existing) {
        return next(new ApiError(409, `Υπάρχει ήδη πελάτης με το όνομα "${existing.name}" και τηλέφωνο ${existing.phone}.`));
      }
    }

    // 🔹 Δημιουργία και αποθήκευση πελάτη
    const c = new Customer(req.body);
    const saved = await c.save();

    logger.info(`✅ Δημιουργήθηκε πελάτης: ${saved.name}`);
    emitChange("customers");

    // --------------------------------------------
    // 🔹 EMAIL / SMS ειδοποίηση (αν είναι ενεργές)
    // --------------------------------------------
    if (saved.notifications?.email || saved.notifications?.sms) {
      Settings.findOne().then((settings) => {
        if (saved.notifications?.email) {
          sendWelcomeEmail({ settings, customer: saved }).catch((err) =>
            logger.error(`❌ Αποτυχία αποστολής email: ${err.message}`)
          );
        }

        if (saved.notifications?.sms) {
          sendSMS({
            settings,
            to: saved.phone,
            message: welcomeSms({
              clinicName: settings?.clinicName || "Κτηνιατρείο",
              clientName: saved.name,
              template: settings?.smsTemplates?.welcome,
            }),
          }).catch((err) => logger.error(`❌ Αποτυχία αποστολής SMS: ${err.message}`));
        }
      }).catch((err) => logger.error(`❌ Αποτυχία φόρτωσης ρυθμίσεων για ειδοποιήσεις: ${err.message}`));
    } else {
      logger.info(
        `🚫 Δεν στάλθηκαν ειδοποιήσεις — ο πελάτης ${saved.name} έχει απενεργοποιήσει email και SMS.`
      );
    }

    // --------------------------------------------
    // 🔹 Επιστροφή στον client
    // --------------------------------------------
    res.status(201).json(saved);
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη δημιουργία πελάτη", { stack: err.stack });
    next(new ApiError(400, "Αποτυχία δημιουργίας πελάτη"));
  }
};
