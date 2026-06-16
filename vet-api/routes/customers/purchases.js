import express from "express";

import validateObjectId from "../../utils/validateObjectId.js";
import * as customers from "../../controllers/customers/index.js";
import requirePermission from "../../middlewares/auth/requirePermission.js";

const router = express.Router();

router.post("/:id/purchases",                       validateObjectId, requirePermission("purchases:write"), customers.createPurchase);
router.get("/:id/purchases",                        validateObjectId, requirePermission("customers:read"),  customers.getCustomerPurchases);
router.delete("/:customerId/purchases/:purchaseId", validateObjectId, requirePermission("purchases:write"), customers.deleteCustomerPurchase);

export default router;
