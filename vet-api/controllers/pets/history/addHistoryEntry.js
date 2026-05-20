import * as petService from "../../../services/petService.js";
import logger from "../../../utils/logger.js";

export default async function addHistoryEntry(req, res, next) {
  try {
    const { id } = req.params;
    const pet = await petService.addHistoryEntry(id, req.body);

    if (!pet) {
      logger.warn(`⚠️ Δεν βρέθηκε κατοικίδιο για προσθήκη ιστορικού (id: ${id})`);
      return next(new Error("❌ Κατοικίδιο δεν βρέθηκε"));
    }

    logger.info(`🩺 Προστέθηκε εγγραφή ιστορικού για κατοικίδιο: ${pet.name}`);
    res.status(201).json(pet);
  } catch (error) {
    logger.error("❌ Σφάλμα κατά την προσθήκη εγγραφής ιστορικού", { stack: error.stack });
    next(error);
  }
}
