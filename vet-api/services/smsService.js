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

/**
 * Αποστολή SMS.
 * @param {object} opts
 * @param {object} opts.settings - Settings document της κλινικής (ήδη φορτωμένο)
 * @param {string} opts.to      - αριθμός παραλήπτη (E.164, π.χ. +306912345678)
 * @param {string} opts.message - κείμενο μηνύματος
 */
export async function sendSMS({ settings, to, message }) {
  if (!to) {
    logger.warn("⚠️ Δεν δόθηκε αριθμός τηλεφώνου για SMS");
    return;
  }

  const { client, from } = buildClient(settings);

  const sms = await client.messages.create({ from, to, body: message });

  logger.info(`📱 SMS στάλθηκε σε ${to} — SID: ${sms.sid}`);
  return sms;
}
