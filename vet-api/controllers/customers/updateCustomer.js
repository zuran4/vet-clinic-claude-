// ===============================================
// 📄 updateCustomer.js
// Περιγραφή: Ενημερώνει στοιχεία υπάρχοντος πελάτη
// ===============================================

import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";
import { emitChange } from "../../utils/realtime.js";

// ===============================
// PUT /api/customers/:id
// ===============================
export const updateCustomer = async (req, res, next) => {
  try {
    const { Customer } = req.models;
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated) {
      logger.warn(
        `⚠️ Απόπειρα ενημέρωσης μη υπαρκτού πελάτη (id: ${req.params.id})`
      );
      throw new ApiError(404, "Ο πελάτης δεν βρέθηκε");
    }

    logger.info(`✏️ Ενημερώθηκε πελάτης: ${updated.name}`);
    emitChange("customers");
    res.json(updated);
  } catch (err) {
    logger.error("❌ Σφάλμα κατά την ενημέρωση πελάτη", { stack: err.stack });
    next(
      err instanceof ApiError
        ? err
        : new ApiError(500, "Σφάλμα κατά την ενημέρωση πελάτη")
    );
  }
};
