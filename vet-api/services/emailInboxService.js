// services/emailInboxService.js
//
// Διαβάζει νέα εισερχόμενα email από το mailbox μιας κλινικής (IMAP) και τα
// αποθηκεύει σαν Message (channel="email", direction="inbound"). ΔΕΝ κάνει
// ΠΟΤΕ mark-as-read στο πραγματικό mailbox — ο χρήστης μπορεί να συνεχίζει
// να το βλέπει κανονικά και από άλλο πρόγραμμα (Outlook/webmail).
//
// Χρησιμοποιεί τα ΙΔΙΑ credentials (host/user/password) με το SMTP
// (settings.emailConfig) — οι περισσότεροι πάροχοι φιλοξενίας email
// (π.χ. Papaki) εκθέτουν IMAP στον ίδιο host, port 993 (IMAPS).
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

import logger from "../utils/logger.js";
import { decrypt } from "../utils/crypto.js";
import { emitChange } from "../utils/realtime.js";

const IMAP_PORT = 993;

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Ελέγχει το inbox μιας κλινικής για νέα email (μόνο αυτά που ήρθαν μετά
 * το τελευταίο poll — παρακολουθούμε το IMAP UID στο Settings.emailInboxState).
 */
export async function pollClinicInbox(clinicId, { Settings, Message, Customer }) {
  const settings = await Settings.findOne();
  const cfg = settings?.emailConfig;

  if (!cfg?.host || !cfg?.user || !cfg?.password) {
    return { skipped: "no-config" };
  }

  const client = new ImapFlow({
    host: cfg.host,
    port: IMAP_PORT,
    secure: true,
    auth: { user: cfg.user, pass: decrypt(cfg.password) },
    logger: false,
  });

  let fetched = 0;
  let saved = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      const mailboxUidNext = client.mailbox.uidNext;
      const lastUid = settings.emailInboxState?.lastUid || 0;

      if (!lastUid) {
        // Πρώτο poll γι' αυτή την κλινική: δεν κατεβάζουμε όλο το ιστορικό
        // του mailbox, ορίζουμε απλά το σημείο εκκίνησης στο "τώρα".
        settings.emailInboxState = { lastUid: mailboxUidNext - 1 };
        await settings.save();
        return { skipped: "baseline-set" };
      }

      if (mailboxUidNext - 1 <= lastUid) {
        return { fetched: 0, saved: 0 };
      }

      const range = `${lastUid + 1}:*`;

      for await (const msg of client.fetch(range, { envelope: true, source: true }, { uid: true })) {
        fetched++;

        try {
          const parsed = await simpleParser(msg.source);
          const fromAddr = (parsed.from?.value?.[0]?.address || "").toLowerCase().trim();
          const fromName = parsed.from?.value?.[0]?.name || "";

          if (!fromAddr) continue;

          const customer = await Customer.findOne({
            email: new RegExp(`^${escapeRegex(fromAddr)}$`, "i"),
          });

          await Message.create({
            channel: "email",
            counterpart: fromAddr,
            counterpartName: fromName,
            customer: customer?._id || null,
            direction: "inbound",
            subject: parsed.subject || "",
            text: parsed.text || "",
            html: parsed.html || "",
            messageId: parsed.messageId || "",
            receivedAt: parsed.date || new Date(),
          });
          saved++;
        } catch (msgErr) {
          if (msgErr.code !== 11000) {
            logger.warn(`⚠️ [${clinicId}] Αποτυχία επεξεργασίας εισερχόμενου email: ${msgErr.message}`);
          }
        }
      }

      settings.emailInboxState = { lastUid: mailboxUidNext - 1 };
      await settings.save();

      if (saved > 0) {
        emitChange("messages");
        logger.info(`📬 [${clinicId}] ${saved} νέο(α) email στο unified inbox.`);
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }

  return { fetched, saved };
}
