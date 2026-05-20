import express from "express";

const router = express.Router();

/**
 * GET /api/settings
 * Επιστρέφει settings shape που περιμένει το frontend (MainLayout.jsx).
 */
router.get("/", (req, res) => {
  return res.json({
    clinicName: process.env.CLINIC_NAME || "Vet Clinic",
    logo: process.env.CLINIC_LOGO_URL || "",
    language: process.env.UI_LANGUAGE || "el",
    darkMode: (process.env.UI_DARK_MODE || "false").toLowerCase() === "true",

    // προαιρετικό runtime info (δεν χαλάει το UI)
    _meta: {
      env: process.env.NODE_ENV || "development",
      apiTime: new Date().toISOString(),
      requestId: req.requestId || null,
    },
  });
});

export default router;
