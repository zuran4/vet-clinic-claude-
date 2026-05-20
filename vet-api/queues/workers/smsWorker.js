// queues/workers/smsWorker.js
import { Worker } from "bullmq";
import dotenv from "dotenv";

import { redisConnection } from "../../config/redis.js";

dotenv.config();

// Δημιουργούμε worker για αποστολή SMS
const smsWorker = new Worker(
  "notifications",
  async (job) => {
    if (job.name !== "sendSMS") return;

    const { to, message } = job.data;
    console.log("📱 Αποστολή SMS σε:", to);

    // Αν έχουμε πραγματικά Twilio credentials (ξεκινούν με AC)
    if (
      process.env.TWILIO_ACCOUNT_SID?.startsWith("AC") &&
      process.env.TWILIO_AUTH_TOKEN
    ) {
      const twilio = await import("twilio");
      const client = twilio.default(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const msg = await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
        body: message,
      });

      console.log("✅ SMS sent:", msg.sid);
    } else {
      // Δοκιμαστικό mode
      console.log("🧪 (Δοκιμαστικό) SMS :", message);
    }
  },
  { connection: redisConnection }
);

smsWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});
