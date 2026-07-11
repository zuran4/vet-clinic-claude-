// ===============================================
// 📄 updateUser.js
// Περιγραφή: Ενημερώνει όνομα/ρόλο/κατάσταση χρήστη, ή επαναφέρει το PIN του
// ===============================================

import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";
import { hashPin } from "../../services/auth/pinCrypto.js";

export const updateUser = async (req, res, next) => {
  try {
    const { User } = req.models;
    const { name, pin, role, isActive } = req.body;

    const update = {};
    if (name !== undefined)     update.name = name;
    if (role !== undefined)     update.role = role;
    if (isActive !== undefined) update.isActive = isActive;
    if (pin)                    update.pinHash = await hashPin(pin);

    const updated = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select({ pinHash: 0 });
    if (!updated) return next(ApiError.notFound("Ο χρήστης δεν βρέθηκε"));

    logger.info(`✅ Ενημερώθηκε χρήστης: ${updated.name}`);
    res.json(updated);
  } catch (err) {
    logger.error("❌ Σφάλμα κατά την ενημέρωση χρήστη", { stack: err.stack });
    next(new ApiError(400, "Αποτυχία ενημέρωσης χρήστη"));
  }
};
