// ===============================================
// 📄 deleteCustomer.js
// Περιγραφή: Διαγράφει πελάτη βάσει ID
// ===============================================

import Customer from "../../models/Customer.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

// ===============================
// DELETE /api/customers/:id
// ===============================
export const deleteCustomer = async (req, res, next) => {
  try {
    // 🔹 Διαγραφή πελάτη
    const deleted = await Customer.findByIdAndDelete(req.params.id);

    if (!deleted) {
      logger.warn(
        `⚠️ Απόπειρα διαγραφής μη υπαρκτού πελάτη (id: ${req.params.id})`
      );
      throw new ApiError(404, "Ο πελάτης δεν βρέθηκε");
    }

    logger.info(`🗑️ Διαγράφηκε πελάτης: ${deleted.name}`);
    res.json({ message: "✅ Ο πελάτης διαγράφηκε επιτυχώς" });
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη διαγραφή πελάτη", { stack: err.stack });
    next(
      err instanceof ApiError
        ? err
        : new ApiError(500, "Σφάλμα κατά τη διαγραφή πελάτη")
    );
  }
};
