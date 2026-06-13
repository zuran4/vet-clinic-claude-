import * as petService from "../../services/petService.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";
import { emitChange } from "../../utils/realtime.js";

export default async function deletePet(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await petService.deletePet(id);

    if (!deleted) {
      logger.warn(`⚠️ Απόπειρα διαγραφής μη υπαρκτού κατοικιδίου (id: ${id})`);
      return next(ApiError.notFound("Το κατοικίδιο δεν βρέθηκε"));
    }

    logger.info(`🗑️ Διαγράφηκε κατοικίδιο: ${deleted.name} (${deleted.species})`);
    emitChange("pets");
    res.json({ message: "✅ Το κατοικίδιο διαγράφηκε" });
  } catch (error) {
    logger.error("❌ Σφάλμα κατά τη διαγραφή κατοικιδίου", { stack: error.stack });
    next(error);
  }
}
