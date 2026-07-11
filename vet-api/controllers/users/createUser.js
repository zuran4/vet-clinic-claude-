// ===============================================
// 📄 createUser.js
// Περιγραφή: Δημιουργεί νέο χρήστη (login account) με PIN και ρόλο
// ===============================================

import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";
import { hashPin } from "../../services/auth/pinCrypto.js";

export const createUser = async (req, res, next) => {
  try {
    const { User } = req.models;
    const { name, pin, role } = req.body;

    const pinHash = await hashPin(pin);
    const user = new User({ name, pinHash, role });
    const saved = await user.save();

    logger.info(`✅ Δημιουργήθηκε χρήστης: ${saved.name} (${saved.role})`);

    const { pinHash: _omit, ...safe } = saved.toObject();
    res.status(201).json(safe);
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη δημιουργία χρήστη", { stack: err.stack });
    next(new ApiError(400, "Αποτυχία δημιουργίας χρήστη"));
  }
};
