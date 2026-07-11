// ===============================================
// 📄 routes/users/index.js
// Περιγραφή: CRUD για χρήστες (login accounts) — μόνο admin (βλ. requirePermission)
// ===============================================

import express from "express";

import validateObjectId from "../../utils/validateObjectId.js";
import validateBody from "../../validators/validateBody.js";
import createSchema from "../../validators/users/createSchema.js";
import updateSchema from "../../validators/users/updateSchema.js";
import * as users from "../../controllers/users/index.js";
import requirePermission from "../../middlewares/auth/requirePermission.js";

const router = express.Router();

router.get("/",      requirePermission("users:read"),   users.getAllUsers);
router.post("/",     requirePermission("users:write"),  validateBody(createSchema), users.createUser);
router.put("/:id",   requirePermission("users:write"),  validateObjectId, validateBody(updateSchema), users.updateUser);
router.delete("/:id", requirePermission("users:delete"), validateObjectId, users.deleteUser);

export default router;
