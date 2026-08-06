import nodemailer from "nodemailer";

import logger from "../utils/logger.js";
import { decrypt } from "../utils/crypto.js";
import config from "../config/index.js";

import { welcomeEmailHtml } from "./emailTemplates.js";

// Το settings.logo αποθηκεύεται σαν σχετικό path (π.χ. "/uploads/xxx.png") —
// μέσα σε email πρέπει να είναι απόλυτο URL, αλλιώς ο παραλήπτης βλέπει
// σπασμένη εικόνα (δεν υπάρχει "τρέχον origin" σε ένα email client).
export function resolveLogoUrl(logo) {
  if (!logo) return "";
  if (/^https?:\/\//i.test(logo)) return logo;
  if (!config.publicBaseUrl) return "";
  return `${config.publicBaseUrl}${logo}`;
}

/**
 * Δημιουργεί nodemailer transporter από ένα ήδη-φορτωμένο Settings document.
 * Το document πρέπει να προέρχεται από τη σωστή (ανά-κλινική) σύνδεση —
 * ο caller είναι υπεύθυνος να το φέρει μέσω req.models.Settings ή
 * getTenantModels(clinicId).Settings, ΠΟΤΕ από το default mongoose model.
 */
function buildTransporter(settings) {
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
        pass: decrypt(cfg.password),
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
 * @param {object}   opts.settings - Settings document της κλινικής (ήδη φορτωμένο)
 * @param {string}   opts.to      - email παραλήπτη
 * @param {string}   opts.subject - θέμα
 * @param {string}   opts.html    - html περιεχόμενο
 * @param {string}  [opts.text]   - plain-text fallback (προαιρετικό)
 */
export async function sendEmail({ settings, to, subject, html, text }) {
  const { transporter, from } = buildTransporter(settings);

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

/**
 * Email καλωσορίσματος σε νέο πελάτη.
 * Χρησιμοποιεί τις ίδιες ρυθμίσεις SMTP (βάση) με όλα τα υπόλοιπα emails.
 */
export async function sendWelcomeEmail({ settings, customer }) {
  if (!customer.email) {
    logger.warn(`⚠️ Δεν υπάρχει email για πελάτη ${customer.name}`);
    return;
  }

  const clinicName = settings?.clinicName || "Κτηνιατρείο";

  await sendEmail({
    settings,
    to: customer.email,
    subject: `Καλωσήρθες στο κτηνιατρείο μας, ${customer.name}!`,
    html: welcomeEmailHtml({
      clinicName,
      clientName: customer.name,
      phone: settings?.phone || "",
      address: settings?.address || "",
      email: settings?.email || "",
      logo: resolveLogoUrl(settings?.logo),
    }),
  });

  logger.info(`✅ Email καλωσορίσματος στάλθηκε σε ${customer.email}`);
}
