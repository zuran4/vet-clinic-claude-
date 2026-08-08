import * as petService from "../../../services/petService.js";
import ApiError from "../../../utils/apiError.js";
import logger from "../../../utils/logger.js";

export default async function sendInstructions(req, res, next) {
  try {
    const { id } = req.params;
    const { diagnosis, medications, instructions } = req.body;

    const result = await petService.sendInstructions(
      id,
      { diagnosis, medications, instructions },
      req.models
    );

    if (!result) {
      logger.warn(`⚠️ Δεν βρέθηκε κατοικίδιο για αποστολή οδηγιών (id: ${id})`);
      return next(ApiError.notFound("Το κατοικίδιο δεν βρέθηκε"));
    }

    res.json({ emailSent: result.emailSent, smsSent: result.smsSent });
  } catch (error) {
    logger.error("❌ Σφάλμα κατά την αποστολή οδηγιών θεραπείας", { stack: error.stack });
    next(error);
  }
}
