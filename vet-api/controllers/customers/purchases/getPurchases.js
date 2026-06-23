// ===============================================
// 📄 getPurchases.js
// Περιγραφή: Επιστρέφει όλες τις αγορές συγκεκριμένου πελάτη
// ===============================================

import ApiError from "../../../utils/apiError.js";
import logger from "../../../utils/logger.js";

// ===============================
// GET /api/customers/:id/purchases
// ===============================
export const getCustomerPurchases = async (req, res, next) => {
  try {
    const { Customer } = req.models;
    const customer = await Customer.findById(req.params.id).populate(
      "purchases.product",
      "name"
    );

    if (!customer) {
      logger.warn(`⚠️ Δεν βρέθηκε πελάτης για λήψη αγορών (id: ${req.params.id})`);
      throw new ApiError(404, "Ο πελάτης δεν βρέθηκε");
    }

    // 🔹 Επιστροφή αγορών
    res.json({
      customer: { _id: customer._id, name: customer.name },
      purchases: customer.purchases || [],
    });
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη λήψη αγορών πελάτη", { stack: err.stack });
    next(
      err instanceof ApiError
        ? err
        : new ApiError(500, "Σφάλμα κατά τη λήψη αγορών")
    );
  }
};
