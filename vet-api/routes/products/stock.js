// routes/products/stock.js
import express from "express";

import validateObjectId from "../../utils/validateObjectId.js";
import validateBody from "../../validators/validateBody.js";
import batchesSchema from "../../validators/products/batchesSchema.js";
import exportSchema from "../../validators/products/exportSchema.js";
import { getBatches } from "../../controllers/products/getBatches.js";
import { updateBatches } from "../../controllers/products/updateBatches.js";
import { exportStock } from "../../controllers/products/exportStock.js";

const router = express.Router();

// 📦 Παρτίδες προϊόντος
router.get("/:id/batches", validateObjectId, getBatches);
router.put("/:id/batches", validateObjectId, validateBody(batchesSchema), updateBatches);

// 📤 Εξαγωγή αποθέματος
router.post("/export", validateBody(exportSchema), exportStock);

export default router;
