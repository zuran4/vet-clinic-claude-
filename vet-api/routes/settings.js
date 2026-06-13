import express from "express";

import Settings from "../models/Settings.js";
import { sendEmail } from "../services/emailService.js";
import { testEmailHtml } from "../services/emailTemplates.js";
import { emitChange } from "../utils/realtime.js";

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
      registryWorkerHeadless,
      staff,
      darkMode,
      emailConfig,
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
        registryWorkerHeadless,
        staff:       staff       || [],
        darkMode:    darkMode    || false,
        emailConfig: emailConfig || {},
      });
    } else {
      if (clinicName   !== undefined) settings.clinicName = clinicName;
      if (logo         !== undefined) settings.logo = logo;
      if (language     !== undefined) settings.language = language;
      if (timezone     !== undefined) settings.timezone = timezone;
      if (clinicWorkingHours !== undefined) settings.clinicWorkingHours = clinicWorkingHours;
      if (groomingWorkingHours !== undefined) settings.groomingWorkingHours = groomingWorkingHours;
      if (registryWorkerHeadless !== undefined) settings.registryWorkerHeadless = registryWorkerHeadless;
      if (staff !== undefined) settings.staff = staff;
      if (darkMode !== undefined) settings.darkMode = darkMode;
      if (emailConfig !== undefined) settings.emailConfig = emailConfig;
    }

    await settings.save();
    emitChange("settings");
    res.json(settings);
  } catch (err) {
    console.error("❌ Σφάλμα κατά την αποθήκευση ρυθμίσεων:", err);
    res.status(500).json({ error: "❌ Σφάλμα κατά την αποθήκευση ρυθμίσεων" });
  }
});


// ==========================
// 🔹 POST /api/settings/test-email
// ==========================
router.post("/test-email", async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: "Το πεδίο 'to' είναι υποχρεωτικό." });

    const settings = await Settings.findOne();
    const clinicName = settings?.clinicName || "Κτηνιατρείο";

    await sendEmail({
      to,
      subject: `Δοκιμαστικό email — ${clinicName}`,
      html: testEmailHtml({ clinicName }),
    });

    res.json({ ok: true, message: "Το δοκιμαστικό email στάλθηκε επιτυχώς." });
  } catch (err) {
    console.error("❌ Σφάλμα αποστολής δοκιμαστικού email:", err.message);
    res.status(500).json({ error: err.message });
  }
});

console.log("📡 Exporting router from settings.js");

export default router;
