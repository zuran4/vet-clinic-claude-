// ===============================================
// 📄 routes/customers/base.js
// Περιγραφή: Routes για CRUD λειτουργίες πελατών (modular version)
// ===============================================

import express from "express";

import validateObjectId from "../../utils/validateObjectId.js";
import validateBody from "../../validators/validateBody.js";
import createSchema from "../../validators/customers/createSchema.js";
import updateSchema from "../../validators/customers/updateSchema.js";
import * as customers from "../../controllers/customers/index.js";
import { importCustomers } from "../../controllers/customers/importCustomers.js";

const router = express.Router();

router.get("/", customers.getAllCustomers);
router.get("/:id", validateObjectId, customers.getCustomerById);
router.post("/", validateBody(createSchema), customers.createCustomer);
router.post("/import", importCustomers);                                   // 📥 Bulk import
router.put("/:id", validateObjectId, validateBody(updateSchema), customers.updateCustomer);
router.delete("/:id", validateObjectId, customers.deleteCustomer);

export default router;
