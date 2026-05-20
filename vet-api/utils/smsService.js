import twilio from "twilio";

import logger from "./logger.js";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to, message) {
  try {
    if (!to) {
      logger.warn("⚠️ Δεν δόθηκε αριθμός τηλεφώνου για SMS");
      return;
    }

    logger.info(`📱 Προετοιμασία αποστολής SMS σε ${to}...`);

    const sms = await client.messages.create({
      from: process.env.TWILIO_PHONE_FROM,
      to,
      body: message,
    });

    logger.info(`✅ SMS στάλθηκε επιτυχώς σε ${to} (SID: ${sms.sid})`);
  } catch (error) {
    logger.error(`❌ Σφάλμα αποστολής SMS σε ${to}: ${error.message}`);
  }
}
