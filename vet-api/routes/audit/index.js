import express from "express";

import { getAuditLogs } from "../../controllers/audit/getAuditLogs.js";
import requirePermission from "../../middlewares/auth/requirePermission.js";

const router = express.Router();

router.get("/", requirePermission("audit:read"), getAuditLogs);

export default router;
