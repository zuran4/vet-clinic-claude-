import * as petService from "../../../services/petService.js";
import ApiError from "../../../utils/apiError.js";
import logger from "../../../utils/logger.js";

export default async function getPetFiles(req, res, next) {
  try {
    const { id } = req.params;
    const files = await petService.getFiles(id, req.models);

    if (!files) {
      logger.warn(`⚠️ Δεν βρέθηκαν αρχεία για κατοικίδιο (id: ${id})`);
      return next(ApiError.notFound("Το κατοικίδιο δεν βρέθηκε"));
    }

    res.json(files);
  } catch (error) {
    logger.error("❌ Σφάλμα κατά τη λήψη αρχείων κατοικιδίου", { stack: error.stack });
    next(error);
  }
}
