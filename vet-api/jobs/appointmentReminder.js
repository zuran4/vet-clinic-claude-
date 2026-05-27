import cron from "node-cron";
import dayjs from "dayjs";

import Appointment from "../models/appointmentModel.js";
import { sendEmail } from "../services/emailService.js";
import { appointmentReminderHtml } from "../services/emailTemplates.js";
import Settings from "../models/Settings.js";
import logger from "../utils/logger.js";

/**
 * Τρέχει κάθε μέρα στις 08:00.
 * Βρίσκει ραντεβού για αύριο και στέλνει υπενθύμιση email.
 */
export function startAppointmentReminderJob() {
  cron.schedule("0 8 * * *", async () => {
    logger.info("⏰ Έλεγχος ραντεβού για υπενθυμίσεις email...");

    try {
      const settings = await Settings.findOne();
      const clinicName = settings?.clinicName || "Κτηνιατρείο";

      // Βρίσκει ραντεβού για αύριο
      const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
      const appointments = await Appointment.find({ date: tomorrow });

      let sent = 0;
      let skipped = 0;

      for (const appt of appointments) {
        // Χρειαζόμαστε email για αποστολή
        if (!appt.email) {
          skipped++;
          continue;
        }

        try {
          await sendEmail({
            to: appt.email,
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

          sent++;
          logger.info(`📧 Υπενθύμιση email → ${appt.clientName} (${appt.email})`);
        } catch (emailErr) {
          logger.warn(`⚠️ Αποτυχία αποστολής σε ${appt.email}: ${emailErr.message}`);
        }
      }

      logger.info(`✅ Appointment reminders: ${sent} στάλθηκαν, ${skipped} χωρίς email`);
    } catch (err) {
      logger.error("❌ Σφάλμα appointmentReminderJob:", err.message);
    }
  });

  logger.info("⏰ appointmentReminderJob: ενεργό (08:00 κάθε μέρα)");
}
