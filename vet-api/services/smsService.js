import twilio from "twilio";

import logger from "../utils/logger.js";
import { decrypt } from "../utils/crypto.js";

/**
 * Δημιουργεί Twilio client από ένα ήδη-φορτωμένο Settings document.
 * Το document πρέπει να προέρχεται από τη σωστή (ανά-κλινική) σύνδεση —
 * ο caller είναι υπεύθυνος να το φέρει μέσω req.models.Settings ή
 * getTenantModels(clinicId).Settings, ΠΟΤΕ από το default mongoose model.
 */
function buildClient(settings) {
  const cfg = settings?.smsConfig;

  if (!cfg?.accountSid || !cfg?.authToken || !cfg?.fromNumber) {
    throw new Error(
      "Δεν έχουν ρυθμιστεί τα στοιχεία SMS. " +
      "Πήγαινε στις Ρυθμίσεις → SMS και συμπλήρωσε Account SID, Auth Token, αριθμό αποστολέα."
    );
  }

  return {
    client: twilio(cfg.accountSid, decrypt(cfg.authToken)),
    from: cfg.fromNumber,
  };
}

// Οι πελάτες αποθηκεύονται με ελληνικό τηλέφωνο χωρίς πρόθεμα (π.χ.
// "6912345678"), αλλά το Twilio απαιτεί πάντα διεθνή μορφή E.164 (+30...)
// — γι' αυτό η μετατροπή γίνεται εδώ, μόνο προς το Twilio, χωρίς να
// αλλάζει πουθενά αλλού η αποθηκευμένη/εμφανιζόμενη μορφή του τηλεφώνου.
function toE164Greek(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (phone.trim().startsWith("+")) return `+${digits}`;
  if (digits.startsWith("30")) return `+${digits}`;
  return `+30${digits.replace(/^0+/, "")}`;
}

/**
 * Αποστολή SMS.
 * @param {object} opts
 * @param {object} opts.settings - Settings document της κλινικής (ήδη φορτωμένο)
 * @param {string} opts.to      - αριθμός παραλήπτη (ελληνική ή διεθνής μορφή)
 * @param {string} opts.message - κείμενο μηνύματος
 */
export async function sendSMS({ settings, to, message }) {
  if (!to) {
    logger.warn("⚠️ Δεν δόθηκε αριθμός τηλεφώνου για SMS");
    return;
  }

  const { client, from } = buildClient(settings);
  const normalizedTo = toE164Greek(to);

  const sms = await client.messages.create({ from, to: normalizedTo, body: message });

  logger.info(`📱 SMS στάλθηκε σε ${normalizedTo} — SID: ${sms.sid}`);
  return sms;
}
