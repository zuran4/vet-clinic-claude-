import express from "express";

import validateObjectId from "../../utils/validateObjectId.js";
import * as pets from "../../controllers/pets/index.js";
import requirePermission from "../../middlewares/auth/requirePermission.js";

const router = express.Router();

router.post("/",                         requirePermission("pets:write"),  pets.createPet);
router.get("/count",                     requirePermission("pets:read"),   pets.getPetsCount);
router.get("/",                          requirePermission("pets:read"),   pets.getAllPets);
router.get("/by-owner/:ownerId",         requirePermission("pets:read"),   pets.getPetsByOwner);
router.patch("/snapshot/:microchip",     requirePermission("pets:write"),  pets.updateRegistrySnapshot);
router.get("/:id",   validateObjectId,   requirePermission("pets:read"),   pets.getPetById);
router.put("/:id",   validateObjectId,   requirePermission("pets:write"),  pets.updatePet);
router.delete("/:id", validateObjectId,  requirePermission("pets:delete"), pets.deletePet);

export default router;
