import cron from "node-cron";
import dayjs from "dayjs";

import { getTenantModel } from "../services/adminConnection.js";
import { getTenantModels } from "../services/tenantConnectionManager.js";
import { sendEmail } from "../services/emailService.js";
import { purchaseReminderHtml } from "../services/emailTemplates.js";
import { sendSMS } from "../services/smsService.js";
import { purchaseReminderSms } from "../services/smsTemplates.js";
import logger from "../utils/logger.js";

/**
 * Επεξεργάζεται τις υπενθυμίσεις αγορών για μία συγκεκριμένη κλινική.
 */
async function processTenant(clinicId, clinicNameFallback) {
  const { Settings, Reminder } = getTenantModels(clinicId);

  const settings = await Settings.findOne();

  if (settings?.notifications?.purchaseReminder === false) {
    return { skippedByToggle: true };
  }

  const clinicName = settings?.clinicName || clinicNameFallback || "Κτηνιατρείο";
  const smsEnabled  = settings?.notifications?.smsEnabled === true;

  // Βρίσκει reminders για σήμερα (αρχή ημέρας – τέλος ημέρας) που δεν έχουν σταλεί
  const startOfDay = dayjs().startOf("day").toDate();
  const endOfDay   = dayjs().endOf("day").toDate();

  const reminders = await Reminder.find({
    sent:         false,
    reminderDate: { $gte: startOfDay, $lte: endOfDay },
  }).populate("customer", "name email phone notifications");

  let emailSent = 0, emailSkipped = 0;
  let smsSent = 0;

  for (const reminder of reminders) {
    const customer      = reminder.customer;
    const customerEmail = customer?.email;
    const customerPhone = customer?.phone;
    const customerName  = customer?.name || "";

    let delivered = false;

    if (customerEmail) {
      try {
        await sendEmail({
          settings,
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

        emailSent++;
        delivered = true;
        logger.info(`📧 Reminder email → ${customerName} (${customerEmail})`);
      } catch (emailErr) {
        logger.warn(`⚠️ Αποτυχία αποστολής email σε ${customerEmail}: ${emailErr.message}`);
      }
    } else {
      emailSkipped++;
      logger.warn(`⚠️ Reminder ${reminder._id}: ο πελάτης δεν έχει email`);
    }

    if (smsEnabled && customerPhone && customer?.notifications?.sms === true) {
      try {
        await sendSMS({
          settings,
          to: customerPhone,
          message: purchaseReminderSms({
            clinicName,
            productNames: reminder.productNames || [],
            template: settings.smsTemplates?.purchaseReminder,
          }),
        });

        smsSent++;
        delivered = true;
        logger.info(`📱 Reminder SMS → ${customerName} (${customerPhone})`);
      } catch (smsErr) {
        logger.warn(`⚠️ Αποτυχία αποστολής SMS σε ${customerPhone}: ${smsErr.message}`);
      }
    }

    if (delivered) {
      reminder.sent   = true;
      reminder.sentAt = new Date();
      await reminder.save();
    }
  }

  return { emailSent, emailSkipped, smsSent };
}

async function runPurchaseReminders() {
  logger.info("🛒 Έλεγχος για υπενθυμίσεις αγορών...");

  try {
    const Tenant = getTenantModel();
    const tenants = await Tenant.find({ isActive: true });

    for (const tenant of tenants) {
      try {
        const result = await processTenant(tenant.clinicId, tenant.clinicName);

        if (result.skippedByToggle) {
          logger.info(`⏭️ [${tenant.clinicId}] Υπενθυμίσεις αγορών απενεργοποιημένες — παράλειψη.`);
          continue;
        }

        logger.info(`✅ [${tenant.clinicId}] Purchase reminders: ${result.emailSent} email (${result.emailSkipped} χωρίς email), ${result.smsSent} SMS`);
      } catch (tenantErr) {
        logger.error(`❌ [${tenant.clinicId}] Σφάλμα purchaseReminderJob:`, tenantErr.message);
      }
    }
  } catch (err) {
    logger.error("❌ Σφάλμα purchaseReminderJob:", err.message);
  }
}

/**
 * Τρέχει κάθε μέρα στις 10:00.
 * Για κάθε ενεργή κλινική, βρίσκει reminders που είναι για σήμερα και
 * δεν έχουν σταλεί ακόμα.
 */
export function startPurchaseReminderJob() {
  cron.schedule("0 10 * * *", runPurchaseReminders);

  // Catch-up: βλ. σχόλιο στο appointmentReminder.js. Εδώ δεν χρειάζεται
  // επιπλέον guard ημέρας — το processTenant φιλτράρει ήδη μόνο reminders
  // με sent:false, οπότε είναι φυσικά ασφαλές να ξανατρέξει.
  if (dayjs().hour() >= 10) {
    runPurchaseReminders().catch((err) =>
      logger.error("❌ Σφάλμα catch-up purchaseReminderJob:", err.message)
    );
  }

  logger.info("🛒 purchaseReminderJob: ενεργό (10:00 κάθε μέρα)");
}
