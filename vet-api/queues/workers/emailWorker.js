// queues/workers/emailWorker.js
import { Worker } from "bullmq";
import nodemailer from "nodemailer";

import { redisConnection } from "../../config/redis.js";

// Δημιουργούμε worker για την ουρά "notifications"
const emailWorker = new Worker(
  "notifications",
  async (job) => {
    const { to, subject, message } = job.data;

    console.log("📧 Αποστολή email σε:", to);

    // 1️⃣ Δημιουργία transporter (χρησιμοποιούμε προσωρινό SMTP της nodemailer)
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // 2️⃣ Στέλνουμε email
    const info = await transporter.sendMail({
      from: '"Vet Project" <noreply@vetpro.gr>',
      to,
      subject,
      text: message,
    });

    console.log("✅ Email sent:", info.messageId);
    console.log("🔗 Preview:", nodemailer.getTestMessageUrl(info));
  },
  { connection: redisConnection }
);

// Log αν υπάρξει σφάλμα
emailWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});
