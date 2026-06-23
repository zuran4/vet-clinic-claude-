import * as petService from "../../services/petService.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";
import { emitChange } from "../../utils/realtime.js";

export default async function updatePet(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await petService.updatePet(id, req.body, req.models);

    if (!updated) {
      logger.warn(`⚠️ Δεν βρέθηκε κατοικίδιο για ενημέρωση (id: ${id})`);
      return next(ApiError.notFound("Το κατοικίδιο δεν βρέθηκε"));
    }

    logger.info(`✏️ Ενημερώθηκε κατοικίδιο: ${updated.name} (${updated.species})`);
    emitChange("pets");
    res.json(updated);
  } catch (error) {
    logger.error("❌ Σφάλμα κατά την ενημέρωση κατοικιδίου", { stack: error.stack });
    next(error);
  }
}
