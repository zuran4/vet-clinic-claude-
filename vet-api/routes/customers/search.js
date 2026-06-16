import express from "express";

import { searchCustomers } from "../../controllers/customers/index.js";
import requirePermission from "../../middlewares/auth/requirePermission.js";

const router = express.Router();

router.get("/search", requirePermission("customers:read"), searchCustomers);

export default router;
