// ===============================================
// 📄 routes/customers/search.js
// Περιγραφή: Routes για αναζήτηση πελατών (modular version)
// ===============================================

import express from "express";

import { searchCustomers } from "../../controllers/customers/index.js";

const router = express.Router();

// 🔍 Αναζήτηση πελατών (π.χ. ChangeOwnerModal)
router.get("/search", searchCustomers);

export default router;
