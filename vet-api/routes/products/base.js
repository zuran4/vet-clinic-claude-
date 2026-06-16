import express from "express";

import validateObjectId from "../../utils/validateObjectId.js";
import validateBody from "../../validators/validateBody.js";
import createSchema from "../../validators/products/createSchema.js";
import updateSchema from "../../validators/products/updateSchema.js";
import { getAll }   from "../../controllers/products/getAll.js";
import { getById }  from "../../controllers/products/getById.js";
import { createOne } from "../../controllers/products/create.js";
import { updateOne } from "../../controllers/products/update.js";
import { removeOne } from "../../controllers/products/remove.js";
import { importProducts } from "../../controllers/products/importProducts.js";
import requirePermission from "../../middlewares/auth/requirePermission.js";

const router = express.Router();

router.get("/",     requirePermission("products:read"),   getAll);
router.get("/:id",  validateObjectId, requirePermission("products:read"),   getById);
router.post("/",    validateBody(createSchema), requirePermission("products:write"),  createOne);
router.post("/import", requirePermission("products:write"), importProducts);
router.put("/:id",  validateObjectId, validateBody(updateSchema), requirePermission("products:write"),  updateOne);
router.delete("/:id", validateObjectId, requirePermission("products:delete"), removeOne);

export default router;
