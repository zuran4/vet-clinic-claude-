// ===============================================
// 📄 routes/customers/index.js
// Περιγραφή: Συνδυάζει όλα τα routes των πελατών (base, purchases)
// ===============================================

import express from "express";

// Εισαγωγή επιμέρους routers
import baseRoutes from "./base.js";
import purchasesRoutes from "./purchases.js";

const router = express.Router();

// -----------------------------
// Ενοποίηση υποδρομολογητών
// -----------------------------

// 🔹 CRUD πελατών (base) — περιλαμβάνει και GET /?search=...
router.use("/", baseRoutes);

// 🔹 Αγορές πελατών
router.use("/", purchasesRoutes);

export default router;
