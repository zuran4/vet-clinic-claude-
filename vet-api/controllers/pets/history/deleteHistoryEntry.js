import * as petService from "../../../services/petService.js";
import logger from "../../../utils/logger.js";

export default async function deleteHistoryEntry(req, res, next) {
  try {
    const { id, entryId } = req.params;
    const history = await petService.deleteHistoryEntry(id, entryId);

    if (!history) {
      logger.warn(`⚠️ Απόπειρα διαγραφής εγγραφής ιστορικού μη υπαρκτού κατοικιδίου (id: ${id})`);
      return next(new Error("❌ Κατοικίδιο δεν βρέθηκε"));
    }

    logger.info(`🗑️ Διαγράφηκε εγγραφή ιστορικού για κατοικίδιο ${id}`);
    res.json({ message: "✅ Εγγραφή ιστορικού διαγράφηκε", history });
  } catch (error) {
    logger.error("❌ Σφάλμα κατά τη διαγραφή εγγραφής ιστορικού", { stack: error.stack });
    next(error);
  }
}
