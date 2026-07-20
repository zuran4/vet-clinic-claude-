// ===============================================
// 📄 routes/pets/index.js
// Περιγραφή: Συνδυάζει όλα τα routes κατοικιδίων (CRUD, owner, history)
// ===============================================

import express from "express";

// επιμέρους routers
import baseRoutes from "./base.js";
import ownerRoutes from "./owner.js";
import historyRoutes from "./history.js";
import fileRoutes from "./files.js";

const router = express.Router();

// 🐾 CRUD κατοικιδίων
router.use("/", baseRoutes);

// 🔄 αλλαγή ιδιοκτήτη
router.use("/", ownerRoutes);

// 📜 ιστορικό κατοικιδίων
router.use("/", historyRoutes);

// 📎 αρχεία κατοικιδίων
router.use("/", fileRoutes);

export default router;
