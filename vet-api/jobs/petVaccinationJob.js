import cron from "node-cron";
import dayjs from "dayjs";

import { getTenantModel } from "../services/adminConnection.js";
import { getTenantModels } from "../services/tenantConnectionManager.js";
import { sendEmail } from "../services/emailService.js";
import { vaccinationReminderHtml } from "../services/emailTemplates.js";
import { sendSMS } from "../services/smsService.js";
import { vaccinationReminderSms } from "../services/smsTemplates.js";
import logger from "../utils/logger.js";

/**
 * Επεξεργάζεται τις υπενθυμίσεις εμβολίων για μία συγκεκριμένη κλινική.
 */
async function processTenant(clinicId, clinicNameFallback) {
  const { Settings, Pet } = getTenantModels(clinicId);

  const settings = await Settings.findOne();

  if (settings?.notifications?.vaccineReminder === false) {
    return { skippedByToggle: true };
  }

  const clinicName = settings?.clinicName || clinicNameFallback || "Κτηνιατρείο";
  const smsEnabled  = settings?.notifications?.smsEnabled === true;

  const pets = await Pet.find({}).populate("owner");

  let emailSent = 0, emailSkipped = 0;
  let smsSent = 0;

  for (const pet of pets) {
    const owner      = pet.owner;
    const ownerEmail = owner?.email;
    const ownerPhone = owner?.phone;
    const ownerName  = owner?.name || "";

    if (!owner) continue;

    for (const entry of pet.history || []) {
      if (entry.reason !== "Εμβολιασμός") continue;

      const nextDate     = dayjs(entry.date).add(12, "month");
      const daysRemaining = nextDate.diff(dayjs(), "day");

      // Στέλνει 7 μέρες πριν ΚΑΙ 1 μέρα πριν
      if (daysRemaining === 7 || daysRemaining === 1) {
        const dayWord = daysRemaining === 1 ? "αύριο" : "σε 7 μέρες";

        if (ownerEmail) {
          try {
            await sendEmail({
              settings,
              to: ownerEmail,
              subject: `Υπενθύμιση εμβολίου — ${pet.name} — ${nextDate.format("DD/MM/YYYY")}`,
              html: vaccinationReminderHtml({
                clinicName,
                clientName:  ownerName,
                petName:     pet.name,
                vaccineType: entry.notes || entry.description || "",
                dueDate:     nextDate.format("DD/MM/YYYY"),
              }),
            });

            emailSent++;
            logger.info(`💉 Εμβόλιο email → ${pet.name} (${ownerEmail}) — ${dayWord}`);
          } catch (emailErr) {
            logger.warn(`⚠️ Αποτυχία αποστολής email σε ${ownerEmail}: ${emailErr.message}`);
          }
        } else {
          emailSkipped++;
        }

        if (smsEnabled && ownerPhone && owner.notifications?.sms === true) {
          try {
            await sendSMS({
              settings,
              to: ownerPhone,
              message: vaccinationReminderSms({
                clinicName,
                petName: pet.name,
                dueDate: nextDate.format("DD/MM/YYYY"),
              }),
            });

            smsSent++;
            logger.info(`📱 Εμβόλιο SMS → ${pet.name} (${ownerPhone}) — ${dayWord}`);
          } catch (smsErr) {
            logger.warn(`⚠️ Αποτυχία αποστολής SMS σε ${ownerPhone}: ${smsErr.message}`);
          }
        }
      }
    }
  }

  return { emailSent, emailSkipped, smsSent };
}

/**
 * Τρέχει κάθε μέρα στις 09:00.
 * Για κάθε ενεργή κλινική, ελέγχει ιστορικό εμβολιασμών — αν ο επόμενος
 * εμβολιασμός είναι σε 7 ή 1 μέρα, στέλνει υπενθύμιση email/SMS.
 */
export function startPetVaccinationJob() {
  cron.schedule("0 9 * * *", async () => {
    logger.info("🐾 Έλεγχος για εμβόλια κατοικιδίων...");

    try {
      const Tenant = getTenantModel();
      const tenants = await Tenant.find({ isActive: true });

      for (const tenant of tenants) {
        try {
          const result = await processTenant(tenant.clinicId, tenant.clinicName);

          if (result.skippedByToggle) {
            logger.info(`⏭️ [${tenant.clinicId}] Υπενθυμίσεις εμβολίου απενεργοποιημένες — παράλειψη.`);
            continue;
          }

          logger.info(`✅ [${tenant.clinicId}] Vaccination reminders: ${result.emailSent} email (${result.emailSkipped} χωρίς email), ${result.smsSent} SMS`);
        } catch (tenantErr) {
          logger.error(`❌ [${tenant.clinicId}] Σφάλμα petVaccinationJob:`, tenantErr.message);
        }
      }
    } catch (err) {
      logger.error("❌ Σφάλμα petVaccinationJob:", err.message);
    }
  });

  logger.info("💉 petVaccinationJob: ενεργό (09:00 κάθε μέρα)");
}
