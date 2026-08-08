import twilio from "twilio";

import logger from "../utils/logger.js";
import { decrypt } from "../utils/crypto.js";
import { toE164Greek } from "./smsService.js";

/**
 * Ίδιος Twilio λογαριασμός με το SMS (accountSid/authToken), ξεχωριστός
 * αριθμός αποστολέα (whatsappConfig.fromNumber — ο registered WhatsApp sender).
 */
function buildClient(settings) {
  const smsCfg = settings?.smsConfig;
  const waCfg = settings?.whatsappConfig;

  if (!smsCfg?.accountSid || !smsCfg?.authToken || !waCfg?.fromNumber) {
    throw new Error(
      "Δεν έχουν ρυθμιστεί τα στοιχεία WhatsApp. " +
      "Πήγαινε στις Ρυθμίσεις → SMS/WhatsApp και συμπλήρωσε Account SID, Auth Token, και τον registered αριθμό WhatsApp."
    );
  }

  return {
    client: twilio(smsCfg.accountSid, decrypt(smsCfg.authToken)),
    from: `whatsapp:${waCfg.fromNumber}`,
  };
}

/**
 * Αποστολή μηνύματος WhatsApp μέσω Twilio.
 * @param {object} opts
 * @param {object} opts.settings - Settings document της κλινικής (ήδη φορτωμένο)
 * @param {string} opts.to      - αριθμός παραλήπτη (ελληνική ή διεθνής μορφή)
 * @param {string} opts.message - κείμενο μηνύματος
 */
export async function sendWhatsApp({ settings, to, message }) {
  if (!to) {
    logger.warn("⚠️ Δεν δόθηκε αριθμός τηλεφώνου για WhatsApp");
    return;
  }

  const { client, from } = buildClient(settings);
  const normalizedTo = `whatsapp:${toE164Greek(to)}`;

  const msg = await client.messages.create({ from, to: normalizedTo, body: message });

  logger.info(`💬 WhatsApp στάλθηκε σε ${normalizedTo} — SID: ${msg.sid}`);
  return msg;
}
