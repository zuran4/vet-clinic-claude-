import cron from "node-cron";
import dayjs from "dayjs";

import Product from "../models/Product.js";
import { notificationsQueue } from "../queues/notificationsQueue.js";
import logger from "../utils/logger.js";

const ADMIN_PHONE = process.env.ADMIN_PHONE || "";

export function startProductExpirationJob() {
  cron.schedule("0 7 * * *", async () => {
    logger.info("🧾 Έλεγχος λήξης προϊόντων...");

    if (!ADMIN_PHONE) {
      logger.warn("⚠️ ADMIN_PHONE δεν έχει οριστεί στο .env — παράλειψη ειδοποιήσεων.");
      return;
    }

    try {
      const products = await Product.find({});

      for (const product of products) {
        const datesToCheck = [];

        // Έλεγχος ημερομηνίας λήξης σε επίπεδο προϊόντος
        if (product.expirationDate) {
          datesToCheck.push(product.expirationDate);
        }

        // Έλεγχος ημερομηνίας λήξης σε κάθε παρτίδα
        for (const batch of product.batches || []) {
          if (batch.expirationDate) {
            datesToCheck.push(batch.expirationDate);
          }
        }

        // Αν κάποια ημερομηνία λήγει μέσα στις επόμενες 7 μέρες, στέλνουμε ειδοποίηση
        for (const date of datesToCheck) {
          const daysToExpire = dayjs(date).diff(dayjs(), "day");

          if (daysToExpire <= 7 && daysToExpire >= 0) {
            if (notificationsQueue) {
              await notificationsQueue.add("sendSMS", {
                to: ADMIN_PHONE,
                message: `Προσοχή: Το προϊόν "${product.name}" λήγει σε ${daysToExpire} ημέρες.`,
              });
            }

            logger.info(`📦 Ειδοποίηση για προϊόν: ${product.name}`);
            break; // μία ειδοποίηση ανά προϊόν αρκεί
          }
        }
      }
    } catch (err) {
      logger.error("❌ Σφάλμα productExpirationJob:", err.message);
    }
  });
}
