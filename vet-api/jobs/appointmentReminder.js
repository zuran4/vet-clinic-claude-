import cron from "node-cron";
import dayjs from "dayjs";

import { getTenantModel } from "../services/adminConnection.js";
import { getTenantModels } from "../services/tenantConnectionManager.js";
import { sendEmail } from "../services/emailService.js";
import { appointmentReminderHtml } from "../services/emailTemplates.js";
import { sendSMS } from "../services/smsService.js";
import { appointmentReminderSms } from "../services/smsTemplates.js";
import logger from "../utils/logger.js";

/**
 * Επεξεργάζεται τα ραντεβού-υπενθυμίσεις για μία συγκεκριμένη κλινική.
 */
async function processTenant(clinicId, clinicNameFallback) {
  const { Settings, Appointment } = getTenantModels(clinicId);

  const settings = await Settings.findOne();

  if (settings?.notifications?.appointmentReminder === false) {
    return { skippedByToggle: true };
  }

  const clinicName = settings?.clinicName || clinicNameFallback || "Κτηνιατρείο";
  const smsEnabled  = settings?.notifications?.smsEnabled === true;

  // Βρίσκει ραντεβού για αύριο (με τον συνδεδεμένο πελάτη, αν υπάρχει)
  const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
  const appointments = await Appointment.find({ date: tomorrow }).populate("owner");

  let emailSent = 0, emailSkipped = 0;
  let smsSent = 0;

  for (const appt of appointments) {
    // Το email υπάρχει μόνο μέσω του συνδεδεμένου πελάτη (owner) —
    // το ίδιο το ραντεβού δεν έχει πεδίο email.
    const email = appt.owner?.email;

    if (email) {
      try {
        await sendEmail({
          settings,
          to: email,
          subject: `Υπενθύμιση ραντεβού — ${appt.animalName} — ${appt.date}`,
          html: appointmentReminderHtml({
            clinicName,
            clientName:  appt.clientName  || "",
            animalName:  appt.animalName  || "",
            date:        appt.date        || tomorrow,
            time:        appt.time        || "",
            reason:      appt.reason      || appt.notes || "",
          }),
        });

        emailSent++;
        logger.info(`📧 Υπενθύμιση email → ${appt.clientName} (${email})`);
      } catch (emailErr) {
        logger.warn(`⚠️ Αποτυχία αποστολής email σε ${email}: ${emailErr.message}`);
      }
    } else {
      emailSkipped++;
    }

    // SMS: μόνο αν είναι ενεργό το master toggle και ο πελάτης έχει
    // ρητά ενεργοποιήσει SMS ειδοποιήσεις (ή δεν υπάρχει συνδεδεμένος
    // πελάτης, οπότε ο αριθμός στο ραντεβού θεωρείται δοσμένος για
    // επικοινωνία σχετικά με το ίδιο το ραντεβού).
    const phone = appt.phone || appt.owner?.phone;
    const smsAllowed = !appt.owner || appt.owner.notifications?.sms === true;

    if (smsEnabled && phone && smsAllowed) {
      try {
        await sendSMS({
          settings,
          to: phone,
          message: appointmentReminderSms({
            clinicName,
            animalName: appt.animalName || "",
            date:       appt.date        || tomorrow,
            time:       appt.time        || "",
            template:   settings.smsTemplates?.appointmentReminder,
          }),
        });

        smsSent++;
        logger.info(`📱 Υπενθύμιση SMS → ${appt.clientName} (${phone})`);
      } catch (smsErr) {
        logger.warn(`⚠️ Αποτυχία αποστολής SMS σε ${phone}: ${smsErr.message}`);
      }
    }
  }

  return { emailSent, emailSkipped, smsSent };
}

/**
 * Τρέχει κάθε μέρα στις 08:00.
 * Για κάθε ενεργή κλινική, βρίσκει ραντεβού για αύριο και στέλνει
 * υπενθύμιση email/SMS.
 */
export function startAppointmentReminderJob() {
  cron.schedule("0 8 * * *", async () => {
    logger.info("⏰ Έλεγχος ραντεβού για υπενθυμίσεις...");

    try {
      const Tenant = getTenantModel();
      const tenants = await Tenant.find({ isActive: true });

      for (const tenant of tenants) {
        try {
          const result = await processTenant(tenant.clinicId, tenant.clinicName);

          if (result.skippedByToggle) {
            logger.info(`⏭️ [${tenant.clinicId}] Υπενθυμίσεις ραντεβού απενεργοποιημένες — παράλειψη.`);
            continue;
          }

          logger.info(`✅ [${tenant.clinicId}] Appointment reminders: ${result.emailSent} email (${result.emailSkipped} χωρίς email), ${result.smsSent} SMS`);
        } catch (tenantErr) {
          logger.error(`❌ [${tenant.clinicId}] Σφάλμα appointmentReminderJob:`, tenantErr.message);
        }
      }
    } catch (err) {
      logger.error("❌ Σφάλμα appointmentReminderJob:", err.message);
    }
  });

  logger.info("⏰ appointmentReminderJob: ενεργό (08:00 κάθε μέρα)");
}
