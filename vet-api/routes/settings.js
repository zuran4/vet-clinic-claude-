import express from "express";

import Settings from "../models/Settings.js";
import { sendEmail } from "../services/emailService.js";
import { testEmailHtml } from "../services/emailTemplates.js";
import { emitChange } from "../utils/realtime.js";
import requireRole from "../middlewares/auth/requireRole.js";

console.log("📡 settings.js loaded");

const router = express.Router();

// 🔒 Δεν επιστρέφουμε ποτέ το SMTP password στον client (αποφυγή credential leak)
function sanitizeSettings(settings) {
  const obj = settings.toObject();
  if (obj.emailConfig) obj.emailConfig = { ...obj.emailConfig, password: "" };
  return obj;
}

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
    res.json(sanitizeSettings(settings));
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
      if (emailConfig !== undefined) {
        // Το GET δεν επιστρέφει ποτέ το πραγματικό password, οπότε ένα κενό
        // password εδώ σημαίνει "δεν το άλλαξε ο χρήστης" — κρατάμε το παλιό.
        const existingPassword = settings.emailConfig?.password || "";
        settings.emailConfig = {
          ...emailConfig,
          password: emailConfig.password || existingPassword,
        };
      }
    }

    await settings.save();
    emitChange("settings");
    res.json(sanitizeSettings(settings));
  } catch (err) {
    console.error("❌ Σφάλμα κατά την αποθήκευση ρυθμίσεων:", err);
    res.status(500).json({ error: "❌ Σφάλμα κατά την αποθήκευση ρυθμίσεων" });
  }
});


// ==========================
// 🔹 POST /api/settings/test-email (μόνο admin)
// ==========================
router.post("/test-email", requireRole("admin"), async (req, res) => {
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
