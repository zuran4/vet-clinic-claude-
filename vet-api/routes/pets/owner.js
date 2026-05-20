// ===============================================
// 📄 routes/pets/owner.js
// Περιγραφή: Route για αλλαγή ιδιοκτήτη κατοικιδίου (modular version)
// ===============================================

import express from "express";

import validateObjectId from "../../utils/validateObjectId.js";
import * as pets from "../../controllers/pets/index.js";

const router = express.Router();

// ✅ Αλλαγή ιδιοκτήτη κατοικιδίου
router.put("/:id/updateOwner", validateObjectId, pets.updatePetOwner);

export default router;
