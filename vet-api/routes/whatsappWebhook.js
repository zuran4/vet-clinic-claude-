// routes/whatsappWebhook.js
//
// Δημόσιο endpoint (χωρίς JWT auth — το Twilio δεν έχει token μας) που
// καλεί το Twilio όταν φτάνει εισερχόμενο μήνυμα WhatsApp. Μοντάρεται
// ΠΡΙΝ τον γενικό auth guard (βλ. server.js), ίδιο μοτίβο με τα health/
// internal routes. Η γνησιότητα του αιτήματος επαληθεύεται μέσω της
// υπογραφής Twilio (X-Twilio-Signature), όχι JWT.
import { Router } from "express";
import twilio from "twilio";

import logger from "../utils/logger.js";
import { decrypt } from "../utils/crypto.js";
import { getTenantModels } from "../services/tenantConnectionManager.js";
import { emitChange } from "../utils/realtime.js";
import config from "../config/index.js";

const router = Router();

router.post("/:clinicId", async (req, res) => {
  const { clinicId } = req.params;

  try {
    const { Settings, Message, Customer } = getTenantModels(clinicId);
    const settings = await Settings.findOne();
    const authToken = settings?.smsConfig?.authToken ? decrypt(settings.smsConfig.authToken) : "";

    if (!authToken) {
      logger.warn(`⚠️ [${clinicId}] WhatsApp webhook: δεν έχουν ρυθμιστεί στοιχεία Twilio.`);
      return res.status(404).send();
    }

    const twilioSignature = req.header("X-Twilio-Signature") || "";
    // Χρησιμοποιούμε το γνωστό δημόσιο URL (config.publicBaseUrl) αντί να το
    // ανακατασκευάζουμε από req.protocol/req.get("host") — αυτά εξαρτώνται
    // από το πώς προωθεί τα headers το proxy chain (nginx/Cloudflare) και
    // μπορεί να μην ταιριάζουν ακριβώς με το URL που υπολόγισε η υπογραφή
    // του Twilio, οδηγώντας σε λάθος απόρριψη γνήσιων αιτημάτων.
    const fullUrl = `${config.publicBaseUrl}${req.originalUrl}`;

    const isValid = twilio.validateRequest(authToken, twilioSignature, fullUrl, req.body);
    if (!isValid) {
      logger.warn(`⚠️ [${clinicId}] WhatsApp webhook: μη έγκυρη υπογραφή Twilio — απορρίφθηκε. url=${fullUrl}`);
      return res.status(403).send();
    }

    const fromRaw = (req.body.From || "").replace(/^whatsapp:/, "");
    const body = req.body.Body || "";
    const profileName = req.body.ProfileName || "";
    const messageSid = req.body.MessageSid || "";

    if (fromRaw) {
      const digits = fromRaw.replace(/\D/g, "");
      const last10 = digits.slice(-10);
      const customer = last10
        ? await Customer.findOne({ phone: new RegExp(`${last10}$`) })
        : null;

      await Message.create({
        channel: "whatsapp",
        counterpart: fromRaw,
        counterpartName: profileName,
        customer: customer?._id || null,
        direction: "inbound",
        text: body,
        messageId: messageSid,
        receivedAt: new Date(),
      });

      emitChange("messages");
      logger.info(`💬 [${clinicId}] Νέο WhatsApp μήνυμα από ${fromRaw}`);
    }

    res.set("Content-Type", "text/xml");
    res.send("<Response></Response>");
  } catch (err) {
    if (err.code === 11000) {
      // Το Twilio ξαναστέλνει το ίδιο webhook (retry) — ήδη αποθηκευμένο, αγνοείται σιωπηλά.
      res.set("Content-Type", "text/xml");
      return res.send("<Response></Response>");
    }
    logger.error(`❌ [${clinicId}] Σφάλμα WhatsApp webhook:`, err.message);
    res.status(500).send();
  }
});

export default router;
