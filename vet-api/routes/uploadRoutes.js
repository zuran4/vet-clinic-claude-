import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import multer from "multer";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 📂 Βεβαιωνόμαστε ότι υπάρχει ο φάκελος uploads
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("📁 Δημιουργήθηκε φάκελος uploads:", uploadsDir);
}

// 📂 Ρυθμίσεις αποθήκευσης
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

// ✅ Route για ανέβασμα logo
router.post("/logo", upload.single("logo"), (req, res) => {
  if (!req.file) {
    console.warn("⚠️ Κλήθηκε /api/upload/logo χωρίς αρχείο");
    return res.status(400).json({ error: "No file uploaded" });
  }

  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

  console.log("✅ Logo uploaded:", req.file.filename);
  res.json({ url: fileUrl });
});

export default router;
