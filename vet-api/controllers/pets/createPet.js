import * as petService from "../../services/petService.js";
import logger from "../../utils/logger.js";
import { emitChange } from "../../utils/realtime.js";

export default async function createPet(req, res, next) {
  try {
    const pet = await petService.createPet(req.body);
    logger.info(`🐾 Νέο κατοικίδιο δημιουργήθηκε: ${pet.name} (${pet.species})`);
    emitChange("pets");
    res.status(201).json(pet);
  } catch (error) {
    logger.error("❌ Σφάλμα κατά τη δημιουργία κατοικιδίου", { stack: error.stack });
    next(error);
  }
}
