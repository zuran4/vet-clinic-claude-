// ===============================================
// 📄 deletePurchase.js
// Περιγραφή: Διαγράφει συγκεκριμένη αγορά πελάτη
// ===============================================

import ApiError from "../../../utils/apiError.js";
import logger from "../../../utils/logger.js";

// ===============================
// DELETE /api/customers/:customerId/purchases/:purchaseId
// ===============================
export const deleteCustomerPurchase = async (req, res, next) => {
  try {
    const { Customer } = req.models;
    const { customerId, purchaseId } = req.params;

    // 🔹 Εύρεση πελάτη
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new ApiError(404, "Ο πελάτης δεν βρέθηκε");
    }

    // 🔹 Εντοπισμός αγοράς στον πίνακα
    const idx = (customer.purchases || []).findIndex(
      (p) => String(p._id) === String(purchaseId)
    );

    if (idx === -1) {
      throw new ApiError(404, "Η αγορά δεν βρέθηκε");
    }

    // 🔹 Αφαίρεση αγοράς
    customer.purchases.splice(idx, 1);
    await customer.save();

    logger.info(`🗑️ Διαγράφηκε αγορά (${purchaseId}) για πελάτη ${customer.name}`);
    res.json({ message: "✅ Η αγορά διαγράφηκε επιτυχώς" });
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη διαγραφή αγοράς", { stack: err.stack });
    next(
      err instanceof ApiError
        ? err
        : new ApiError(500, "Σφάλμα κατά τη διαγραφή αγοράς")
    );
  }
};
