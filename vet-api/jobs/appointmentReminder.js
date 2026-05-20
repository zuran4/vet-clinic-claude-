import cron from "node-cron";
import dayjs from "dayjs";

import Appointment from "../models/appointmentModel.js";
import { notificationsQueue } from "../queues/notificationsQueue.js";
import logger from "../utils/logger.js";

export function startAppointmentReminderJob() {
  cron.schedule("0 8 * * *", async () => {
    logger.info("⏰ Έλεγχος ραντεβού για υπενθυμίσεις...");

    try {
      const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");

      const appointments = await Appointment.find({ date: tomorrow });

      for (const appt of appointments) {
        if (!appt.phone) continue;

        if (notificationsQueue) {
          await notificationsQueue.add("sendSMS", {
            to: appt.phone,
            message: `Υπενθύμιση: Ραντεβού για ${appt.animalName} αύριο στις ${appt.time}.`,
          });
        }

        logger.info(`📨 Προγραμματίστηκε SMS για ${appt.clientName}`);
      }
    } catch (err) {
      logger.error("❌ Σφάλμα appointmentReminderJob:", err.message);
    }
  });
}
