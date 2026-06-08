import express from "express";

import { getAuditLogs } from "../../controllers/audit/getAuditLogs.js";

const router = express.Router();

// 🔐 GET /api/audit — μόνο για admin (έλεγχος ρόλου μέσα στον controller)
router.get("/", getAuditLogs);

export default router;
