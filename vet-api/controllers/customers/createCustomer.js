// ===============================================
// 📄 createCustomer.js
// Περιγραφή: Δημιουργεί νέο πελάτη, με αποστολή email & SMS καλωσορίσματος
// ===============================================

import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";
import { sendWelcomeEmail } from "../../utils/emailService.js";
import { sendSMS } from "../../utils/smsService.js";
import { emitChange } from "../../utils/realtime.js";

// ===============================
// POST /api/customers
// ===============================
export const createCustomer = async (req, res, next) => {
  try {
    const { Customer } = req.models;
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
    // 🔹 EMAIL ειδοποίηση (αν είναι ενεργή)
    // --------------------------------------------
    if (saved.notifications?.email) {
      sendWelcomeEmail(saved).catch((err) =>
        logger.error(`❌ Αποτυχία αποστολής email: ${err.message}`)
      );
    } else {
      logger.info(
        `🚫 Δεν στάλθηκε email — ο πελάτης ${saved.name} έχει απενεργοποιήσει τις ειδοποιήσεις email.`
      );
    }

    // --------------------------------------------
    // 🔹 SMS ειδοποίηση (αν είναι ενεργή)
    // --------------------------------------------
    if (saved.notifications?.sms) {
      const smsMessage = `Αγαπητέ/ή ${saved.name}, σας καλωσορίζουμε στην κλινική μας!`;
      sendSMS(saved.phone, smsMessage).catch((err) =>
        logger.error(`❌ Αποτυχία αποστολής SMS: ${err.message}`)
      );
    } else {
      logger.info(
        `🚫 Δεν στάλθηκε SMS — ο πελάτης ${saved.name} έχει απενεργοποιήσει τις ειδοποιήσεις SMS.`
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
