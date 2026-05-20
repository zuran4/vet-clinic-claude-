// ===============================================
// 📄 routes/pets/history.js
// Περιγραφή: Routes για ιστορικό κατοικιδίων (modular version)
// ===============================================

import express from "express";

import validateObjectId from "../../utils/validateObjectId.js";
import * as pets from "../../controllers/pets/index.js";

const router = express.Router();

// ➕ Προσθήκη εγγραφής στο ιστορικό
router.post("/:id/history", validateObjectId, pets.addHistoryEntry);

// 📋 Λήψη ιστορικού κατοικιδίου
router.get("/:id/history", validateObjectId, pets.getPetHistory);

// 🗑️ Διαγραφή εγγραφής ιστορικού
router.delete(
  "/:id/history/:entryId",
  validateObjectId,
  pets.deleteHistoryEntry
);

export default router;
