// ===============================================
// 📄 routes/customers/purchases.js
// Περιγραφή: Routes για αγορές πελατών (modular version)
// ===============================================

import express from "express";

import validateObjectId from "../../utils/validateObjectId.js";
import * as customers from "../../controllers/customers/index.js";

const router = express.Router();

// ===============================
// 🛒 Δημιουργία αγοράς
// ===============================
router.post("/:id/purchases", validateObjectId, customers.createPurchase);

// ===============================
// 📋 Λήψη αγορών πελάτη
// ===============================
router.get("/:id/purchases", validateObjectId, customers.getCustomerPurchases);

// ===============================
// 🗑️ Διαγραφή αγοράς πελάτη
// ===============================
router.delete(
  "/:customerId/purchases/:purchaseId",
  validateObjectId,
  customers.deleteCustomerPurchase
);

export default router;
