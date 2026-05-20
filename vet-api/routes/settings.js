import express from "express";

import Settings from "../models/Settings.js";

console.log("📡 settings.js loaded");

const router = express.Router();

// ==========================
// 🔹 GET /api/settings
// ==========================
router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    console.error("❌ Σφάλμα κατά την ανάγνωση ρυθμίσεων:", err);
    res.status(500).json({ error: "❌ Σφάλμα κατά την ανάγνωση ρυθμίσεων" });
  }
});

// ==========================
// 🔹 PUT /api/settings
// ==========================
router.put("/", async (req, res) => {
  try {
    const {
      clinicName,
      logo,
      language,
      timezone,
      clinicWorkingHours,
      groomingWorkingHours,
      registryWorkerHeadless, // 👈 ΝΕΟ πεδίο από το body
    } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings({
        clinicName,
        logo,
        language,
        timezone,
        clinicWorkingHours,
        groomingWorkingHours,
        registryWorkerHeadless, // 👈 αν έρθει τιμή, την αποθηκεύουμε
      });
    } else {
      if (clinicName !== undefined) settings.clinicName = clinicName;
      if (logo !== undefined) settings.logo = logo;
      if (language !== undefined) settings.language = language;
      if (timezone !== undefined) settings.timezone = timezone;
      if (clinicWorkingHours !== undefined)
        settings.clinicWorkingHours = clinicWorkingHours;
      if (groomingWorkingHours !== undefined)
        settings.groomingWorkingHours = groomingWorkingHours;
      if (registryWorkerHeadless !== undefined)
        settings.registryWorkerHeadless = registryWorkerHeadless; // 👈 ενημέρωση πεδίου
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error("❌ Σφάλμα κατά την αποθήκευση ρυθμίσεων:", err);
    res.status(500).json({ error: "❌ Σφάλμα κατά την αποθήκευση ρυθμίσεων" });
  }
});


console.log("📡 Exporting router from settings.js");

export default router;
