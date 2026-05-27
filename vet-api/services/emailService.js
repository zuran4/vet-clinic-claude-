import nodemailer from "nodemailer";
import Settings from "../models/Settings.js";
import logger from "../utils/logger.js";

/**
 * Δημιουργεί nodemailer transporter από τις ρυθμίσεις της βάσης.
 * Κάθε φορά που καλείται διαβάζει τις τρέχουσες ρυθμίσεις (fresh).
 */
async function createTransporter() {
  const settings = await Settings.findOne();
  const cfg = settings?.emailConfig;

  if (!cfg?.host || !cfg?.user || !cfg?.password) {
    throw new Error(
      "Δεν έχουν ρυθμιστεί τα στοιχεία SMTP. " +
      "Πήγαινε στις Ρυθμίσεις → Email και συμπλήρωσε host, user, password."
    );
  }

  return {
    transporter: nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port || 587,
      secure: cfg.port === 465,
      auth: {
        user: cfg.user,
        pass: cfg.password,
      },
    }),
    from: cfg.fromName
      ? `"${cfg.fromName}" <${cfg.fromEmail || cfg.user}>`
      : cfg.fromEmail || cfg.user,
  };
}

/**
 * Αποστολή email.
 * @param {object} opts
 * @param {string}   opts.to      - email παραλήπτη
 * @param {string}   opts.subject - θέμα
 * @param {string}   opts.html    - html περιεχόμενο
 * @param {string}  [opts.text]   - plain-text fallback (προαιρετικό)
 */
export async function sendEmail({ to, subject, html, text }) {
  const { transporter, from } = await createTransporter();

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ""), // auto plain-text από html
  });

  logger.info(`📧 Email στάλθηκε σε ${to} — MessageId: ${info.messageId}`);
  return info;
}
