// utils/emailService.js
import nodemailer from "nodemailer";

import logger from "./logger.js";

// ------------------------------------------------------
// Δημιουργία transporter (SMTP για Gmail)
// ------------------------------------------------------
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true αν χρησιμοποιείς port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ------------------------------------------------------
// Συνάρτηση αποστολής email καλωσορίσματος
// ------------------------------------------------------
export async function sendWelcomeEmail(customer) {
  try {
    if (!customer.email) {
      logger.warn(`⚠️ Δεν υπάρχει email για πελάτη ${customer.name}`);
      return;
    }

    logger.info(`📧 Προετοιμασία αποστολής email σε ${customer.email}`);

    const mailOptions = {
      from: `"Κτηνιατρικό Κέντρο" <${process.env.SMTP_USER}>`,
      to: customer.email,
      subject: `Καλωσήρθες στην κλινική μας, ${customer.name}!`,
      text: `Αγαπητέ/ή ${customer.name},\n\nΣας ευχαριστούμε που μας εμπιστευθήκατε!\nΘα είμαστε πάντα δίπλα στα κατοικίδιά σας.\n\nΜε εκτίμηση,\nΗ ομάδα της κλινικής.`,
    };

    // Αποστολή
    await transporter.sendMail(mailOptions);
    logger.info(`✅ Email καλωσορίσματος στάλθηκε σε ${customer.email}`);
  } catch (error) {
    logger.error(`❌ Σφάλμα αποστολής email: ${error.message}`);
  }
}
