import express from "express";

import validateObjectId from "../../utils/validateObjectId.js";
import validateBody from "../../validators/validateBody.js";
import createSchema from "../../validators/products/createSchema.js";
import updateSchema from "../../validators/products/updateSchema.js";
import { getAll } from "../../controllers/products/getAll.js";
import { getById } from "../../controllers/products/getById.js";
import { createOne } from "../../controllers/products/create.js";
import { updateOne } from "../../controllers/products/update.js";
import { removeOne } from "../../controllers/products/remove.js";
import { importProducts } from "../../controllers/products/importProducts.js";

const router = express.Router();

router.get("/", getAll);
router.get("/:id", validateObjectId, getById);
router.post("/", validateBody(createSchema), createOne);
router.post("/import", importProducts);                    // 📥 Bulk import
router.put("/:id", validateObjectId, validateBody(updateSchema), updateOne);
router.delete("/:id", validateObjectId, removeOne);

export default router;
