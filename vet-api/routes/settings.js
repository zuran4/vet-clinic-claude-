import express from "express";

import { sendEmail } from "../services/emailService.js";
import { testEmailHtml } from "../services/emailTemplates.js";
import { sendSMS } from "../services/smsService.js";
import { testSms } from "../services/smsTemplates.js";
import { emitChange } from "../utils/realtime.js";
import requirePermission from "../middlewares/auth/requirePermission.js";
import { encrypt } from "../utils/crypto.js";
import logger from "../utils/logger.js";

const router = express.Router();

// 🔒 Δεν επιστρέφουμε ποτέ SMTP/GOV passwords στον client (αποφυγή credential leak)
function sanitizeSettings(settings) {
  const obj = settings.toObject();
  if (obj.emailConfig) obj.emailConfig = { ...obj.emailConfig, password: "" };
  if (obj.smsConfig) obj.smsConfig = { ...obj.smsConfig, authToken: "" };
  if (obj.registryGov) obj.registryGov = { ...obj.registryGov, password: "" };
  return obj;
}

// ==========================
// 🔹 GET /api/settings
// ==========================
router.get("/", async (req, res) => {
  try {
    const { Settings } = req.models;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json(sanitizeSettings(settings));
  } catch (err) {
    logger.error("❌ Σφάλμα κατά την ανάγνωση ρυθμίσεων:", err);
    res.status(500).json({ error: "❌ Σφάλμα κατά την ανάγνωση ρυθμίσεων" });
  }
});

// ==========================
// 🔹 PUT /api/settings
// ==========================
router.put("/", requirePermission("settings:write"), async (req, res) => {
  try {
    const { Settings } = req.models;
    const {
      clinicName,
      logo,
      language,
      timezone,
      phone,
      address,
      afm,
      clinicWorkingHours,
      groomingWorkingHours,
      registryWorkerHeadless,
      clinicSlotDuration,
      groomingSlotDuration,
      staff,
      darkMode,
      emailConfig,
      smsConfig,
      notifications,
      registryGov,
    } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings({
        clinicName,
        logo,
        language,
        timezone,
        phone:    phone    || "",
        address:  address  || "",
        afm:      afm      || "",
        clinicWorkingHours,
        groomingWorkingHours,
        registryWorkerHeadless,
        clinicSlotDuration:   clinicSlotDuration   || 30,
        groomingSlotDuration: groomingSlotDuration || 60,
        staff:         staff         || [],
        darkMode:      darkMode      || false,
        emailConfig:   emailConfig
          ? { ...emailConfig, password: emailConfig.password ? encrypt(emailConfig.password) : "" }
          : {},
        smsConfig:     smsConfig
          ? { ...smsConfig, authToken: smsConfig.authToken ? encrypt(smsConfig.authToken) : "" }
          : {},
        notifications: notifications || {},
        registryGov:   registryGov
          ? { ...registryGov, password: registryGov.password ? encrypt(registryGov.password) : "" }
          : {},
      });
    } else {
      if (clinicName   !== undefined) settings.clinicName = clinicName;
      if (logo         !== undefined) settings.logo = logo;
      if (language     !== undefined) settings.language = language;
      if (timezone     !== undefined) settings.timezone = timezone;
      if (phone        !== undefined) settings.phone = phone;
      if (address      !== undefined) settings.address = address;
      if (afm          !== undefined) settings.afm = afm;
      if (clinicWorkingHours !== undefined) settings.clinicWorkingHours = clinicWorkingHours;
      if (groomingWorkingHours !== undefined) settings.groomingWorkingHours = groomingWorkingHours;
      if (clinicSlotDuration !== undefined) settings.clinicSlotDuration = clinicSlotDuration;
      if (groomingSlotDuration !== undefined) settings.groomingSlotDuration = groomingSlotDuration;
      if (registryWorkerHeadless !== undefined) settings.registryWorkerHeadless = registryWorkerHeadless;
      if (staff !== undefined) settings.staff = staff;
      if (darkMode !== undefined) settings.darkMode = darkMode;
      if (notifications !== undefined) settings.notifications = { ...settings.notifications, ...notifications };
      if (emailConfig !== undefined) {
        // Το GET δεν επιστρέφει ποτέ το πραγματικό password, οπότε ένα κενό
        // password εδώ σημαίνει "δεν το άλλαξε ο χρήστης" — κρατάμε το παλιό.
        const existingPassword = settings.emailConfig?.password || "";
        const incomingPassword = emailConfig.password;
        const newPassword = incomingPassword
          ? encrypt(incomingPassword)   // νέο password → κρυπτογράφηση
          : existingPassword;           // κενό → κρατάμε το υπάρχον (ήδη κρυπτογραφημένο)
        settings.emailConfig = { ...emailConfig, password: newPassword };
      }
      if (smsConfig !== undefined) {
        // Ίδιο μοτίβο με το emailConfig.password: το GET δεν επιστρέφει ποτέ
        // το πραγματικό authToken, οπότε κενό εδώ σημαίνει "δεν το άλλαξε".
        const existingToken = settings.smsConfig?.authToken || "";
        const incomingToken = smsConfig.authToken;
        const newToken = incomingToken
          ? encrypt(incomingToken)
          : existingToken;
        settings.smsConfig = { ...smsConfig, authToken: newToken };
      }
      if (registryGov !== undefined) {
        // Ίδιο μοτίβο με το emailConfig.password: το GET δεν επιστρέφει ποτέ
        // το πραγματικό password, οπότε κενό εδώ σημαίνει "δεν το άλλαξε".
        const existingGovPassword = settings.registryGov?.password || "";
        const incomingGovPassword = registryGov.password;
        const newGovPassword = incomingGovPassword
          ? encrypt(incomingGovPassword)
          : existingGovPassword;
        settings.registryGov = { ...registryGov, password: newGovPassword };
      }
    }

    await settings.save();
    emitChange("settings");
    res.json(sanitizeSettings(settings));
  } catch (err) {
    logger.error("❌ Σφάλμα κατά την αποθήκευση ρυθμίσεων:", err);
    res.status(500).json({ error: "❌ Σφάλμα κατά την αποθήκευση ρυθμίσεων" });
  }
});


// ==========================
// 🔹 POST /api/settings/test-email (μόνο admin)
// ==========================
router.post("/test-email", requirePermission("settings:write"), async (req, res) => {
  try {
    const { Settings } = req.models;
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: "Το πεδίο 'to' είναι υποχρεωτικό." });

    const settings = await Settings.findOne();
    const clinicName = settings?.clinicName || "Κτηνιατρείο";

    await sendEmail({
      settings,
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

// ==========================
// 🔹 POST /api/settings/test-sms (μόνο admin)
// ==========================
router.post("/test-sms", requirePermission("settings:write"), async (req, res) => {
  try {
    const { Settings } = req.models;
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: "Το πεδίο 'to' είναι υποχρεωτικό." });

    const settings = await Settings.findOne();
    const clinicName = settings?.clinicName || "Κτηνιατρείο";

    await sendSMS({ settings, to, message: testSms({ clinicName }) });

    res.json({ ok: true, message: "Το δοκιμαστικό SMS στάλθηκε επιτυχώς." });
  } catch (err) {
    console.error("❌ Σφάλμα αποστολής δοκιμαστικού SMS:", err.message);
    res.status(500).json({ error: err.message });
  }
});

console.log("📡 Exporting router from settings.js");

export default router;
