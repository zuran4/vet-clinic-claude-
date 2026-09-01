import express from "express";

import logger from "../utils/logger.js";
import config from "../config/index.js";

const router = express.Router();

// 🔹 Δημόσιο κλειδί — το frontend το χρειάζεται για να κάνει subscribe.
router.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: config.vapid.publicKey || null });
});

// 🔹 Αποθήκευση subscription μιας συσκευής (upsert με βάση το endpoint).
router.post("/subscribe", async (req, res) => {
  try {
    const { PushSubscription } = req.models;
    const { endpoint, keys } = req.body || {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: "Μη έγκυρο push subscription." });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { endpoint, keys, user: req.user.userId },
      { upsert: true, new: true }
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    logger.error("❌ Σφάλμα αποθήκευσης push subscription:", err.message);
    res.status(500).json({ error: "Σφάλμα αποθήκευσης." });
  }
});

// 🔹 Απενεργοποίηση ειδοποιήσεων σε αυτή τη συσκευή.
router.post("/unsubscribe", async (req, res) => {
  try {
    const { PushSubscription } = req.models;
    const { endpoint } = req.body || {};
    if (endpoint) await PushSubscription.deleteOne({ endpoint });
    res.json({ ok: true });
  } catch (err) {
    logger.error("❌ Σφάλμα κατάργησης push subscription:", err.message);
    res.status(500).json({ error: "Σφάλμα κατάργησης." });
  }
});

export default router;
