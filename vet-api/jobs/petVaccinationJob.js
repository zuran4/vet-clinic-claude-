import cron from "node-cron";
import dayjs from "dayjs";

import Pet from "../models/Pet.js";
import { notificationsQueue } from "../queues/notificationsQueue.js";
import logger from "../utils/logger.js";

export function startPetVaccinationJob() {
  cron.schedule("0 9 * * *", async () => {
    logger.info("🐾 Έλεγχος για εμβόλια κατοικιδίων...");

    try {
      const pets = await Pet.find({}).populate("owner");

      for (const pet of pets) {
        const ownerPhone = pet.owner?.phone;
        if (!ownerPhone) continue;

        for (const entry of pet.history || []) {
          if (entry.reason === "Εμβολιασμός") {
            const nextDate = dayjs(entry.date).add(12, "month");
            const daysRemaining = nextDate.diff(dayjs(), "day");

            if (daysRemaining === 1) {
              if (notificationsQueue) {
                await notificationsQueue.add("sendSMS", {
                  to: ownerPhone,
                  message: `Υπενθύμιση: Ο ${pet.name} χρειάζεται εμβόλιο αύριο.`,
                });
              }

              logger.info(`📩 Ειδοποίηση εμβολίου για ${pet.name}`);
            }
          }
        }
      }
    } catch (err) {
      logger.error("❌ Σφάλμα petVaccinationJob:", err.message);
    }
  });
}
