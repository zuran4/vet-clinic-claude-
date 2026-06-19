import express from "express";

import Prescription from "../models/Prescription.js";
import requirePermission from "../middlewares/auth/requirePermission.js";
import logger from "../utils/logger.js";

const router = express.Router();

router.post("/", requirePermission("prescriptions:write"), async (req, res) => {
  try {
    if (!req.body.animalId || !req.body.animalName) {
      return res.status(400).json({ error: "animalId και animalName είναι υποχρεωτικά" });
    }
    const newPrescription = new Prescription(req.body);
    const saved = await newPrescription.save();
    res.status(201).json(saved);
  } catch (err) {
    logger.error("❌ Σφάλμα καταχώρησης συνταγής:", err);
    res.status(400).json({ error: err.message });
  }
});

router.get("/", requirePermission("prescriptions:read"), async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate("animalId", "name type breed owner")
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (err) {
    logger.error("❌ Σφάλμα φόρτωσης συνταγών:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/by-animal/:animalId", requirePermission("prescriptions:read"), async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ animalId: req.params.animalId })
      .populate("animalId", "name type breed owner")
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (err) {
    logger.error("❌ Σφάλμα λήψης συνταγών:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
