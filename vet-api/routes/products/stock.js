// routes/products/stock.js
import express from "express";

import validateObjectId from "../../utils/validateObjectId.js";
import validateBody from "../../validators/validateBody.js";
import batchesSchema from "../../validators/products/batchesSchema.js";
import exportSchema from "../../validators/products/exportSchema.js";
import { getBatches }    from "../../controllers/products/getBatches.js";
import { updateBatches } from "../../controllers/products/updateBatches.js";
import { exportStock }   from "../../controllers/products/exportStock.js";
import requirePermission from "../../middlewares/auth/requirePermission.js";

const router = express.Router();

router.get("/:id/batches",  validateObjectId, requirePermission("products:read"),  getBatches);
router.put("/:id/batches",  validateObjectId, validateBody(batchesSchema), requirePermission("products:write"), updateBatches);
router.post("/export",      validateBody(exportSchema), requirePermission("products:write"), exportStock);

export default router;
