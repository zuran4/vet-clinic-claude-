import * as petService from "../../../services/petService.js";
import ApiError from "../../../utils/apiError.js";
import logger from "../../../utils/logger.js";

export default async function getPetHistory(req, res, next) {
  try {
    const { id } = req.params;
    const history = await petService.getPetHistory(id, req.models);

    if (!history) {
      logger.warn(`⚠️ Δεν βρέθηκε ιστορικό για κατοικίδιο (id: ${id})`);
      return next(ApiError.notFound("Το κατοικίδιο δεν βρέθηκε"));
    }

    logger.info(`📄 Επιστράφηκαν ${history.length} εγγραφές ιστορικού για κατοικίδιο ${id}`);
    res.json(history);
  } catch (error) {
    logger.error("❌ Σφάλμα κατά τη λήψη ιστορικού κατοικιδίου", { stack: error.stack });
    next(error);
  }
}
