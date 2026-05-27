import cron from "node-cron";
import dayjs from "dayjs";

import Pet from "../models/Pet.js";
import { sendEmail } from "../services/emailService.js";
import { vaccinationReminderHtml } from "../services/emailTemplates.js";
import Settings from "../models/Settings.js";
import logger from "../utils/logger.js";

/**
 * Τρέχει κάθε μέρα στις 09:00.
 * Ελέγχει ιστορικό εμβολιασμών — αν ο επόμενος εμβολιασμός είναι σε 7 ή 1 μέρα,
 * στέλνει email στον ιδιοκτήτη.
 */
export function startPetVaccinationJob() {
  cron.schedule("0 9 * * *", async () => {
    logger.info("🐾 Έλεγχος για εμβόλια κατοικιδίων...");

    try {
      const settings = await Settings.findOne();
      const clinicName = settings?.clinicName || "Κτηνιατρείο";

      const pets = await Pet.find({}).populate("owner");

      let sent = 0;
      let skipped = 0;

      for (const pet of pets) {
        const ownerEmail = pet.owner?.email;
        const ownerName  = pet.owner?.name || "";

        if (!ownerEmail) {
          skipped++;
          continue;
        }

        for (const entry of pet.history || []) {
          if (entry.reason !== "Εμβολιασμός") continue;

          const nextDate     = dayjs(entry.date).add(12, "month");
          const daysRemaining = nextDate.diff(dayjs(), "day");

          // Στέλνει 7 μέρες πριν ΚΑΙ 1 μέρα πριν
          if (daysRemaining === 7 || daysRemaining === 1) {
            const dayWord = daysRemaining === 1 ? "αύριο" : "σε 7 μέρες";

            try {
              await sendEmail({
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

              sent++;
              logger.info(`💉 Εμβόλιο email → ${pet.name} (${ownerEmail}) — ${dayWord}`);
            } catch (emailErr) {
              logger.warn(`⚠️ Αποτυχία αποστολής σε ${ownerEmail}: ${emailErr.message}`);
            }
          }
        }
      }

      logger.info(`✅ Vaccination reminders: ${sent} στάλθηκαν, ${skipped} χωρίς email`);
    } catch (err) {
      logger.error("❌ Σφάλμα petVaccinationJob:", err.message);
    }
  });

  logger.info("💉 petVaccinationJob: ενεργό (09:00 κάθε μέρα)");
}
