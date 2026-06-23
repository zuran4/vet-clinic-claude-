import * as petService from "../../services/petService.js";
import logger from "../../utils/logger.js";

export default async function getAllPets(req, res, next) {
  try {
    const pets = await petService.getAllPets(req.models);
    logger.info(`📋 Επιστράφηκαν ${pets.length} κατοικίδια`);
    res.json(pets);
  } catch (error) {
    logger.error("❌ Σφάλμα κατά τη λήψη όλων των κατοικιδίων", { stack: error.stack });
    next(error);
  }
}
