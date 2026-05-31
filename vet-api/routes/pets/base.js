// ===============================================
// 📄 routes/pets/base.js
// Περιγραφή: CRUD routes για κατοικίδια
// ===============================================

import express from "express";

import validateObjectId from "../../utils/validateObjectId.js";
import * as pets from "../../controllers/pets/index.js";

const router = express.Router();

// ➕ Δημιουργία κατοικιδίου
router.post("/", pets.createPet);

// 📋 Λήψη όλων των κατοικιδίων
router.get("/", pets.getAllPets);

// 📋 Λήψη κατοικιδίων για συγκεκριμένο πελάτη
router.get("/by-owner/:ownerId", pets.getPetsByOwner);

// 💾 Αποθήκευση registry snapshot (by microchip)
router.patch("/snapshot/:microchip", pets.updateRegistrySnapshot);

// 📋 Λήψη κατοικιδίου με ID
router.get("/:id", validateObjectId, pets.getPetById);

// ✏️ Ενημέρωση κατοικιδίου
router.put("/:id", validateObjectId, pets.updatePet);

// 🗑️ Διαγραφή κατοικιδίου
router.delete("/:id", validateObjectId, pets.deletePet);

export default router;
