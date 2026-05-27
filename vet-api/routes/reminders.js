import express from "express";
import Reminder from "../models/Reminder.js";
import Customer from "../models/Customer.js";
import logger from "../utils/logger.js";

const router = express.Router();

// ──────────────────────────────────────────────
// POST /api/reminders
// Δημιουργία νέας υπενθύμισης
// ──────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { customerId, reminderDate, note, productNames } = req.body;

    if (!customerId || !reminderDate) {
      return res.status(400).json({ error: "customerId και reminderDate είναι υποχρεωτικά." });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: "Ο πελάτης δεν βρέθηκε." });
    }

    const reminder = new Reminder({
      customer:     customerId,
      reminderDate: new Date(reminderDate),
      note:         note         || "",
      productNames: productNames || [],
    });

    await reminder.save();

    logger.info(`🔔 Υπενθύμιση δημιουργήθηκε για ${customer.name} — ${reminderDate}`);

    res.status(201).json({ ok: true, reminder });
  } catch (err) {
    logger.error("❌ Σφάλμα δημιουργίας reminder:", err.message);
    res.status(500).json({ error: "Σφάλμα δημιουργίας υπενθύμισης." });
  }
});

// ──────────────────────────────────────────────
// GET /api/reminders
// Λίστα όλων των reminders (για admin panel)
// ──────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const reminders = await Reminder.find()
      .populate("customer", "name email phone")
      .sort({ reminderDate: 1 });

    res.json(reminders);
  } catch (err) {
    logger.error("❌ Σφάλμα λήψης reminders:", err.message);
    res.status(500).json({ error: "Σφάλμα λήψης υπενθυμίσεων." });
  }
});

// ──────────────────────────────────────────────
// DELETE /api/reminders/:id
// Διαγραφή reminder
// ──────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await Reminder.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Σφάλμα διαγραφής." });
  }
});

export default router;
