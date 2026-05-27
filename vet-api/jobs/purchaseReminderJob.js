import cron from "node-cron";
import dayjs from "dayjs";

import Reminder from "../models/Reminder.js";
import { sendEmail } from "../services/emailService.js";
import { purchaseReminderHtml } from "../services/emailTemplates.js";
import Settings from "../models/Settings.js";
import logger from "../utils/logger.js";

/**
 * Τρέχει κάθε μέρα στις 10:00.
 * Βρίσκει reminders που είναι για σήμερα και δεν έχουν σταλεί ακόμα.
 */
export function startPurchaseReminderJob() {
  cron.schedule("0 10 * * *", async () => {
    logger.info("🛒 Έλεγχος για υπενθυμίσεις αγορών...");

    try {
      const settings  = await Settings.findOne();
      const clinicName = settings?.clinicName || "Κτηνιατρείο";

      // Βρίσκει reminders για σήμερα (αρχή ημέρας – τέλος ημέρας) που δεν έχουν σταλεί
      const startOfDay = dayjs().startOf("day").toDate();
      const endOfDay   = dayjs().endOf("day").toDate();

      const reminders = await Reminder.find({
        sent:         false,
        reminderDate: { $gte: startOfDay, $lte: endOfDay },
      }).populate("customer", "name email");

      let sent = 0;
      let skipped = 0;

      for (const reminder of reminders) {
        const customerEmail = reminder.customer?.email;
        const customerName  = reminder.customer?.name || "";

        if (!customerEmail) {
          skipped++;
          logger.warn(`⚠️ Reminder ${reminder._id}: ο πελάτης δεν έχει email`);
          continue;
        }

        try {
          await sendEmail({
            to:      customerEmail,
            subject: `Υπενθύμιση από ${clinicName}`,
            html:    purchaseReminderHtml({
              clinicName,
              clientName:   customerName,
              productNames: reminder.productNames || [],
              note:         reminder.note         || "",
              reminderDate: dayjs(reminder.reminderDate).format("DD/MM/YYYY"),
            }),
          });

          // Σήμανση ως σταλμένο
          reminder.sent   = true;
          reminder.sentAt = new Date();
          await reminder.save();

          sent++;
          logger.info(`📧 Reminder email → ${customerName} (${customerEmail})`);
        } catch (emailErr) {
          logger.warn(`⚠️ Αποτυχία αποστολής σε ${customerEmail}: ${emailErr.message}`);
        }
      }

      logger.info(`✅ Purchase reminders: ${sent} στάλθηκαν, ${skipped} χωρίς email`);
    } catch (err) {
      logger.error("❌ Σφάλμα purchaseReminderJob:", err.message);
    }
  });

  logger.info("🛒 purchaseReminderJob: ενεργό (10:00 κάθε μέρα)");
}
