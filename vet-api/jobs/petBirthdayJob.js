import cron from "node-cron";
import dayjs from "dayjs";

import { getTenantModel } from "../services/adminConnection.js";
import { getTenantModels } from "../services/tenantConnectionManager.js";
import { sendEmail } from "../services/emailService.js";
import { birthdayHtml } from "../services/emailTemplates.js";
import { sendSMS } from "../services/smsService.js";
import { birthdaySms } from "../services/smsTemplates.js";
import logger from "../utils/logger.js";

/**
 * Επεξεργάζεται τα γενέθλια κατοικιδίων για μία συγκεκριμένη κλινική.
 */
async function processTenant(clinicId, clinicNameFallback) {
  const { Settings, Pet } = getTenantModels(clinicId);

  const settings = await Settings.findOne();

  if (!settings?.notifications?.birthdayReminder) {
    return { skippedByToggle: true };
  }

  const clinicName = settings?.clinicName || clinicNameFallback || "Κτηνιατρείο";
  const smsEnabled  = settings?.notifications?.smsEnabled === true;
  const today = dayjs();

  const pets = await Pet.find({ birthDate: { $ne: null } }).populate("owner");

  let emailSent = 0, emailSkipped = 0;
  let smsSent = 0;

  for (const pet of pets) {
    if (!pet.birthDate) continue;

    const birthDate = dayjs(pet.birthDate);
    if (birthDate.date() !== today.date() || birthDate.month() !== today.month()) {
      continue;
    }

    const owner      = pet.owner;
    const ownerEmail = owner?.email;
    const ownerPhone = owner?.phone;
    const ownerName  = owner?.name || "";

    if (!owner) continue;

    const age = today.year() - birthDate.year();

    if (ownerEmail) {
      try {
        await sendEmail({
          settings,
          to: ownerEmail,
          subject: `🎂 Χρόνια πολλά, ${pet.name}! — ${clinicName}`,
          html: birthdayHtml({
            clinicName,
            clientName: ownerName,
            petName: pet.name,
            age,
          }),
        });

        emailSent++;
        logger.info(`🎂 Birthday email → ${pet.name} (${ownerEmail})`);
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
          message: birthdaySms({ clinicName, petName: pet.name, template: settings.smsTemplates?.birthday }),
        });

        smsSent++;
        logger.info(`📱 Birthday SMS → ${pet.name} (${ownerPhone})`);
      } catch (smsErr) {
        logger.warn(`⚠️ Αποτυχία αποστολής SMS σε ${ownerPhone}: ${smsErr.message}`);
      }
    }
  }

  return { emailSent, emailSkipped, smsSent };
}

/**
 * Τρέχει κάθε μέρα στις 10:00.
 * Για κάθε ενεργή κλινική, βρίσκει κατοικίδια που έχουν γενέθλια σήμερα
 * (ίδια μέρα/μήνας birthDate) και στέλνει υπενθύμιση email/SMS.
 */
export function startPetBirthdayJob() {
  cron.schedule("0 10 * * *", async () => {
    logger.info("🎂 Έλεγχος για γενέθλια κατοικιδίων...");

    try {
      const Tenant = getTenantModel();
      const tenants = await Tenant.find({ isActive: true });

      for (const tenant of tenants) {
        try {
          const result = await processTenant(tenant.clinicId, tenant.clinicName);

          if (result.skippedByToggle) {
            logger.info(`⏭️ [${tenant.clinicId}] Ειδοποιήσεις γενεθλίων απενεργοποιημένες — παράλειψη.`);
            continue;
          }

          logger.info(`✅ [${tenant.clinicId}] Birthday reminders: ${result.emailSent} email (${result.emailSkipped} χωρίς email), ${result.smsSent} SMS`);
        } catch (tenantErr) {
          logger.error(`❌ [${tenant.clinicId}] Σφάλμα petBirthdayJob:`, tenantErr.message);
        }
      }
    } catch (err) {
      logger.error("❌ Σφάλμα petBirthdayJob:", err.message);
    }
  });

  logger.info("🎂 petBirthdayJob: ενεργό (10:00 κάθε μέρα)");
}
