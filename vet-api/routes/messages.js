import express from "express";

import logger from "../utils/logger.js";
import requirePermission from "../middlewares/auth/requirePermission.js";
import { sendEmail } from "../services/emailService.js";
import { sendWhatsApp } from "../services/whatsappService.js";
import { emitChange } from "../utils/realtime.js";

const router = express.Router();

// 🔹 Λίστα συνομιλιών (ομαδοποιημένες ανά counterpart), πιο πρόσφατη πρώτη.
router.get("/conversations", requirePermission("messages:read"), async (req, res) => {
  try {
    const { Message } = req.models;

    const conversations = await Message.aggregate([
      { $sort: { receivedAt: 1 } },
      {
        $group: {
          _id: { channel: "$channel", counterpart: "$counterpart" },
          counterpartName: { $last: "$counterpartName" },
          customer: { $last: "$customer" },
          lastSubject: { $last: "$subject" },
          lastText: { $last: "$text" },
          lastHasMedia: { $last: { $gt: [{ $size: { $ifNull: ["$media", []] } }, 0] } },
          lastDirection: { $last: "$direction" },
          lastReceivedAt: { $last: "$receivedAt" },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$direction", "inbound"] }, { $eq: ["$read", false] }] }, 1, 0],
            },
          },
        },
      },
      { $lookup: { from: "customers", localField: "customer", foreignField: "_id", as: "customerDoc" } },
      { $unwind: { path: "$customerDoc", preserveNullAndEmptyArrays: true } },
      { $sort: { lastReceivedAt: -1 } },
      {
        $project: {
          _id: 0,
          channel: "$_id.channel",
          counterpart: "$_id.counterpart",
          counterpartName: 1,
          customerId: "$customerDoc._id",
          customerName: "$customerDoc.name",
          lastSubject: 1,
          lastText: 1,
          lastHasMedia: 1,
          lastDirection: 1,
          lastReceivedAt: 1,
          unreadCount: 1,
        },
      },
    ]);

    res.json(conversations);
  } catch (err) {
    logger.error("❌ Σφάλμα λήψης συνομιλιών:", err.message);
    res.status(500).json({ error: "Σφάλμα λήψης συνομιλιών." });
  }
});

// 🔹 Πλήρες thread μηνυμάτων μιας συνομιλίας. Μαρκάρει τα εισερχόμενα σαν
// διαβασμένα (μόνο εσωτερικά — δεν αγγίζει το πραγματικό mailbox).
router.get("/conversations/:counterpart", requirePermission("messages:read"), async (req, res) => {
  try {
    const { Message } = req.models;
    const counterpart = decodeURIComponent(req.params.counterpart).toLowerCase();

    const messages = await Message.find({ counterpart }).sort({ receivedAt: 1 });

    await Message.updateMany(
      { counterpart, direction: "inbound", read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (err) {
    logger.error("❌ Σφάλμα λήψης μηνυμάτων συνομιλίας:", err.message);
    res.status(500).json({ error: "Σφάλμα λήψης μηνυμάτων." });
  }
});

// 🔹 Απάντηση σε συνομιλία email — στέλνει το email και το αποθηκεύει σαν
// outbound μήνυμα στο ίδιο thread.
router.post("/conversations/:counterpart/reply", requirePermission("messages:write"), async (req, res) => {
  try {
    const { Message, Settings } = req.models;
    const counterpart = decodeURIComponent(req.params.counterpart).toLowerCase();
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Το κείμενο της απάντησης είναι υποχρεωτικό." });
    }

    const lastMessage = await Message.findOne({ counterpart }).sort({ receivedAt: -1 });
    const channel = lastMessage?.channel || "email";
    const lastInbound = await Message.findOne({ counterpart, direction: "inbound" }).sort({ receivedAt: -1 });
    const settings = await Settings.findOne();

    let saved;

    if (channel === "whatsapp") {
      await sendWhatsApp({ settings, to: counterpart, message: text.trim() });

      saved = await Message.create({
        channel: "whatsapp",
        counterpart,
        counterpartName: lastMessage?.counterpartName || "",
        customer: lastMessage?.customer || null,
        direction: "outbound",
        text: text.trim(),
        receivedAt: new Date(),
      });

      logger.info(`💬 Απάντηση WhatsApp στάλθηκε → ${counterpart}`);
    } else {
      const subject = lastInbound?.subject
        ? (lastInbound.subject.startsWith("Re:") ? lastInbound.subject : `Re: ${lastInbound.subject}`)
        : "Απάντηση";
      const html = text.trim().replace(/\n/g, "<br>");

      await sendEmail({
        settings,
        to: counterpart,
        subject,
        html,
        text: text.trim(),
        inReplyTo: lastInbound?.messageId || undefined,
        references: lastInbound?.messageId || undefined,
      });

      saved = await Message.create({
        channel: "email",
        counterpart,
        counterpartName: lastInbound?.counterpartName || "",
        customer: lastInbound?.customer || null,
        direction: "outbound",
        subject,
        text: text.trim(),
        html,
        inReplyTo: lastInbound?.messageId || "",
        receivedAt: new Date(),
      });

      logger.info(`📧 Απάντηση email στάλθηκε → ${counterpart}`);
    }

    emitChange("messages");
    res.status(201).json(saved);
  } catch (err) {
    logger.error("❌ Σφάλμα αποστολής απάντησης:", err.message);
    res.status(500).json({ error: err.message || "Σφάλμα αποστολής απάντησης." });
  }
});

export default router;
