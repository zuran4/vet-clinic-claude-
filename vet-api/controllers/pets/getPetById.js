import * as petService from "../../services/petService.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

export default async function getPetById(req, res, next) {
  try {
    const { id } = req.params;
    const pet = await petService.getPetById(id);

    if (!pet) {
      logger.warn(`⚠️ Δεν βρέθηκε κατοικίδιο με id: ${id}`);
      return next(ApiError.notFound("Το κατοικίδιο δεν βρέθηκε"));
    }

    logger.info(`📄 Επιστράφηκαν στοιχεία κατοικιδίου: ${pet.name} (${pet.species})`);
    res.json(pet);
  } catch (error) {
    logger.error("❌ Σφάλμα κατά τη λήψη κατοικιδίου με ID", { stack: error.stack });
    next(error);
  }
}
