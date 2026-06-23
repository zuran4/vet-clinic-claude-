// ===============================================
// 📄 getCustomerById.js
// Περιγραφή: Επιστρέφει συγκεκριμένο πελάτη και τα κατοικίδιά του
// ===============================================

import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

// ===============================
// GET /api/customers/:id → επιστρέφει και κατοικίδια
// ===============================
export const getCustomerById = async (req, res, next) => {
  try {
    const { Customer, Pet } = req.models;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      logger.warn(`⚠️ Δεν βρέθηκε πελάτης με id: ${req.params.id}`);
      throw new ApiError(404, "Ο πελάτης δεν βρέθηκε");
    }

    // 🔹 Φόρτωση κατοικιδίων πελάτη
    const pets = await Pet.find({ owner: req.params.id }).select(
      "name species gender neutered vaccinated microchip"
    );

    logger.info(`📋 Επιστράφηκε πελάτης με ${pets.length} κατοικίδια`);
    res.json({ ...customer.toObject(), pets });
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη λήψη πελάτη", { stack: err.stack });
    next(
      err instanceof ApiError
        ? err
        : new ApiError(500, "Σφάλμα κατά τη λήψη πελάτη")
    );
  }
};
