import express from "express";

import Supplier from "../models/Supplier.js";

const router = express.Router();

// ==========================
// 📦 GET: Όλοι οι προμηθευτές
// ==========================
router.get("/", async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers);
  } catch (err) {
    console.error("❌ Σφάλμα φόρτωσης προμηθευτών:", err);
    res.status(500).json({ message: "❌ Σφάλμα φόρτωσης προμηθευτών" });
  }
});

// ==========================
// ➕ POST: Δημιουργία νέου προμηθευτή
// ==========================
router.post("/", async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json(supplier);
  } catch (err) {
    console.error("❌ Σφάλμα δημιουργίας προμηθευτή:", err);
    res.status(400).json({ message: "❌ Σφάλμα αποθήκευσης προμηθευτή" });
  }
});

// ==========================
// ✏️ PUT: Ενημέρωση προμηθευτή
// ==========================
router.put("/:id", async (req, res) => {
  try {
    const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error("❌ Σφάλμα ενημέρωσης προμηθευτή:", err);
    res.status(400).json({ message: "❌ Σφάλμα ενημέρωσης προμηθευτή" });
  }
});

// ==========================
// 🗑️ DELETE: Διαγραφή προμηθευτή
// ==========================
router.delete("/:id", async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ message: "✅ Ο προμηθευτής διαγράφηκε" });
  } catch (err) {
    console.error("❌ Σφάλμα διαγραφής προμηθευτή:", err);
    res.status(400).json({ message: "❌ Σφάλμα διαγραφής προμηθευτή" });
  }
});

export default router;
