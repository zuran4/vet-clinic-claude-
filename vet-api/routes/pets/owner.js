import express from "express";

import validateObjectId from "../../utils/validateObjectId.js";
import * as pets from "../../controllers/pets/index.js";
import requirePermission from "../../middlewares/auth/requirePermission.js";

const router = express.Router();

router.put("/:id/updateOwner", validateObjectId, requirePermission("pets:write"), pets.updatePetOwner);

export default router;
