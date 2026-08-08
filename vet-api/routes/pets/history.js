import express from "express";

import validateObjectId from "../../utils/validateObjectId.js";
import * as pets from "../../controllers/pets/index.js";
import requirePermission from "../../middlewares/auth/requirePermission.js";

const router = express.Router();

router.post("/:id/history",              validateObjectId, requirePermission("pets.history:write"),  pets.addHistoryEntry);
router.get("/:id/history",               validateObjectId, requirePermission("pets.history:read"),   pets.getPetHistory);
router.delete("/:id/history/:entryId",   validateObjectId, requirePermission("pets.history:delete"), pets.deleteHistoryEntry);
router.post("/:id/send-instructions",    validateObjectId, requirePermission("pets.history:write"),  pets.sendInstructions);

export default router;
