import * as petService from "../../services/petService.js";
import logger from "../../utils/logger.js";

export default async function updatePet(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await petService.updatePet(id, req.body);

    if (!updated) {
      logger.warn(`⚠️ Δεν βρέθηκε κατοικίδιο για ενημέρωση (id: ${id})`);
      return next(new Error("❌ Κατοικίδιο δεν βρέθηκε"));
    }

    logger.info(`✏️ Ενημερώθηκε κατοικίδιο: ${updated.name} (${updated.species})`);
    res.json(updated);
  } catch (error) {
    logger.error("❌ Σφάλμα κατά την ενημέρωση κατοικιδίου", { stack: error.stack });
    next(error);
  }
}
