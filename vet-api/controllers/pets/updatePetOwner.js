import * as petService from "../../services/petService.js";
import logger from "../../utils/logger.js";

export default async function updatePetOwner(req, res, next) {
  try {
    const { id } = req.params;
    const { newOwnerId } = req.body;

    const updated = await petService.updatePetOwner(id, newOwnerId);
    if (!updated) {
      logger.warn(
        `⚠️ Αποτυχία ενημέρωσης ιδιοκτήτη (petId: ${id}, newOwnerId: ${newOwnerId})`
      );
      return next(new Error("❌ Κατοικίδιο ή νέος ιδιοκτήτης δεν βρέθηκαν"));
    }

    logger.info(`👥 Αλλαγή ιδιοκτήτη για κατοικίδιο: ${updated.name}`);
    res.json({ message: "✅ Ο ιδιοκτήτης ενημερώθηκε", pet: updated });
  } catch (error) {
    logger.error("❌ Σφάλμα κατά την αλλαγή ιδιοκτήτη κατοικιδίου", { stack: error.stack });
    next(error);
  }
}
