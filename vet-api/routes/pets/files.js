import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

import multer from "multer";
import express from "express";
import validateObjectId from "../../utils/validateObjectId.js";
import requirePermission from "../../middlewares/auth/requirePermission.js";
import * as pets from "../../controllers/pets/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 📂 Βεβαιωνόμαστε ότι υπάρχει ο φάκελος uploads
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ✅ Επιτρεπτοί τύποι αρχείων (όχι SVG/HTML -> αποφυγή stored XSS)
const ALLOWED_MIME_TO_EXT = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TO_EXT[file.mimetype]) {
      return cb(new Error("Μη επιτρεπτός τύπος αρχείου. Επιτρέπονται εικόνες, PDF και έγγραφα Word/Excel."));
    }
    cb(null, true);
  },
});

// 📎 Ανέβασμα αρχείου για κατοικίδιο
router.post("/:id/files", validateObjectId, requirePermission("pets.files:write"), (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Το αρχείο είναι πολύ μεγάλο (μέγιστο 10MB)." });
      }
      return res.status(400).json({ error: err.message || "Σφάλμα κατά το ανέβασμα." });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    req.uploadedFile = req.file;
    next();
  });
}, pets.addPetFile);

// 📎 Λίστα αρχείων κατοικιδίου
router.get("/:id/files", validateObjectId, requirePermission("pets.files:read"), pets.getPetFiles);

// 📎 Διαγραφή αρχείου
router.delete("/:id/files/:fileId", validateObjectId, requirePermission("pets.files:delete"), pets.deletePetFile);

export default router;
