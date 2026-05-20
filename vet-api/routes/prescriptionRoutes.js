import express from "express";

import Prescription from "../models/Prescription.js";


const router = express.Router();

// 🔹 Δημιουργία νέας συνταγής
router.post("/", async (req, res) => {
  try {
    // ✅ Βεβαιωνόμαστε ότι στέλνονται animalId + animalName
    if (!req.body.animalId || !req.body.animalName) {
      return res
        .status(400)
        .json({ error: "animalId και animalName είναι υποχρεωτικά" });
    }

    const newPrescription = new Prescription(req.body);
    const saved = await newPrescription.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Σφάλμα καταχώρησης συνταγής:", err);
    res.status(400).json({ error: err.message });
  }
});

// 🔹 Λήψη όλων των συνταγών
router.get("/", async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate("animalId", "name type breed owner") // φέρνει τα βασικά πεδία κατοικιδίου
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (err) {
    console.error("❌ Σφάλμα φόρτωσης συνταγών:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Λήψη συνταγών για συγκεκριμένο ζώο
router.get("/by-animal/:animalId", async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      animalId: req.params.animalId,
    })
      .populate("animalId", "name type breed owner")
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (err) {
    console.error("❌ Σφάλμα λήψης συνταγών:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
