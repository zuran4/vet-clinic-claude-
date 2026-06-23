import * as petService from "../../services/petService.js";
import logger from "../../utils/logger.js";

export default async function getPetsByOwner(req, res, next) {
  try {
    const { ownerId } = req.params;
    const pets = await petService.getPetsByOwner(ownerId, req.models);
    logger.info(`👤 Επιστράφηκαν ${pets.length} κατοικίδια για ownerId: ${ownerId}`);
    res.json(pets);
  } catch (error) {
    logger.error("❌ Σφάλμα κατά τη λήψη κατοικιδίων ανά ιδιοκτήτη", { stack: error.stack });
    next(error);
  }
}
