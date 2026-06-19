import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

import multer from "multer";
import express from "express";
import requirePermission from "../middlewares/auth/requirePermission.js";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 📂 Βεβαιωνόμαστε ότι υπάρχει ο φάκελος uploads
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("📁 Δημιουργήθηκε φάκελος uploads:", uploadsDir);
}

// ✅ Επιτρεπτοί τύποι εικόνας για το λογότυπο (όχι SVG -> αποφυγή stored XSS)
const ALLOWED_MIME_TO_EXT = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

// 📂 Ρυθμίσεις αποθήκευσης
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    // Δεν χρησιμοποιούμε το originalname (αποφυγή path traversal) — η κατάληξη
    // προκύπτει αποκλειστικά από τον επιτρεπτό MIME type.
    const ext = ALLOWED_MIME_TO_EXT[file.mimetype];
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TO_EXT[file.mimetype]) {
      return cb(new Error("Μη επιτρεπτός τύπος αρχείου. Επιτρέπονται μόνο εικόνες PNG, JPG, GIF ή WEBP."));
    }
    cb(null, true);
  },
});

// ✅ Route για ανέβασμα logo
router.post("/logo", requirePermission("settings:write"), (req, res) => {
  upload.single("logo")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Το αρχείο είναι πολύ μεγάλο (μέγιστο 5MB)." });
      }
      return res.status(400).json({ error: err.message || "Σφάλμα κατά το ανέβασμα." });
    }

    if (!req.file) {
      console.warn("⚠️ Κλήθηκε /api/upload/logo χωρίς αρχείο");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    logger.info("✅ Logo uploaded:", req.file.filename);
    res.json({ url: fileUrl });
  });
});

export default router;
