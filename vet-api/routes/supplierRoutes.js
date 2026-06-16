import express from "express";

import Supplier from "../models/Supplier.js";
import requirePermission from "../middlewares/auth/requirePermission.js";

const router = express.Router();

const ALLOWED = ["name", "contact", "phone", "email", "website", "address", "notes"];
const pick = (obj) =>
  ALLOWED.reduce((acc, k) => {
    if (obj[k] !== undefined) acc[k] = String(obj[k] ?? "").trim();
    return acc;
  }, {});

router.get("/", requirePermission("suppliers:read"), async (req, res, next) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers);
  } catch (err) { next(err); }
});

router.post("/", requirePermission("suppliers:write"), async (req, res, next) => {
  try {
    const data = pick(req.body);
    if (!data.name) return res.status(400).json({ message: "Το όνομα είναι υποχρεωτικό." });
    const supplier = await Supplier.create(data);
    res.status(201).json(supplier);
  } catch (err) { next(err); }
});

router.post("/import", requirePermission("suppliers:write"), async (req, res, next) => {
  try {
    const rows = req.body?.suppliers;
    if (!Array.isArray(rows) || rows.length === 0)
      return res.status(400).json({ message: "Δεν στάλθηκαν δεδομένα." });

    let inserted = 0;
    const errors = [];

    for (const row of rows) {
      const data = pick(row);
      if (!data.name) { errors.push({ row, reason: "Λείπει το όνομα" }); continue; }
      try {
        await Supplier.create(data);
        inserted++;
      } catch (e) {
        errors.push({ row, reason: e.message });
      }
    }

    res.json({ inserted, errors });
  } catch (err) { next(err); }
});

router.put("/:id", requirePermission("suppliers:write"), async (req, res, next) => {
  try {
    const data = pick(req.body);
    if (!data.name) return res.status(400).json({ message: "Το όνομα είναι υποχρεωτικό." });
    const updated = await Supplier.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Ο προμηθευτής δεν βρέθηκε." });
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete("/:id", requirePermission("suppliers:delete"), async (req, res, next) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ message: "Ο προμηθευτής διαγράφηκε." });
  } catch (err) { next(err); }
});

export default router;
