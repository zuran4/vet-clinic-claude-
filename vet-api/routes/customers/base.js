import express from "express";

import validateObjectId from "../../utils/validateObjectId.js";
import validateBody from "../../validators/validateBody.js";
import createSchema from "../../validators/customers/createSchema.js";
import updateSchema from "../../validators/customers/updateSchema.js";
import * as customers from "../../controllers/customers/index.js";
import { importCustomers } from "../../controllers/customers/importCustomers.js";
import requirePermission from "../../middlewares/auth/requirePermission.js";

const router = express.Router();

router.get("/",     requirePermission("customers:read"),   customers.getAllCustomers);
router.get("/:id",  validateObjectId, requirePermission("customers:read"),   customers.getCustomerById);
router.post("/",    validateBody(createSchema), requirePermission("customers:write"),  customers.createCustomer);
router.post("/import", requirePermission("customers:write"), importCustomers);
router.put("/:id",  validateObjectId, validateBody(updateSchema), requirePermission("customers:write"),  customers.updateCustomer);
router.delete("/:id", validateObjectId, requirePermission("customers:delete"), customers.deleteCustomer);

export default router;
