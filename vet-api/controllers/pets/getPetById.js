import * as petService from "../../services/petService.js";
import logger from "../../utils/logger.js";

export default async function getPetById(req, res, next) {
  try {
    const { id } = req.params;
    const pet = await petService.getPetById(id);

    if (!pet) {
      logger.warn(`⚠️ Δεν βρέθηκε κατοικίδιο με id: ${id}`);
      return next(new Error("❌ Κατοικίδιο δεν βρέθηκε"));
    }

    logger.info(`📄 Επιστράφηκαν στοιχεία κατοικιδίου: ${pet.name} (${pet.species})`);
    res.json(pet);
  } catch (error) {
    logger.error("❌ Σφάλμα κατά τη λήψη κατοικιδίου με ID", { stack: error.stack });
    next(error);
  }
}
