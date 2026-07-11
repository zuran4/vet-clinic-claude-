// ===============================================
// 📄 deleteUser.js
// Περιγραφή: Διαγράφει χρήστη — δεν επιτρέπεται η διαγραφή του ίδιου του λογαριασμού
// ===============================================

import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.userId) {
      return next(ApiError.badRequest("Δεν μπορείς να διαγράψεις τον δικό σου λογαριασμό."));
    }

    const { User } = req.models;
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return next(ApiError.notFound("Ο χρήστης δεν βρέθηκε"));

    logger.info(`🗑️ Διαγράφηκε χρήστης: ${deleted.name}`);
    res.json({ message: "✅ Ο χρήστης διαγράφηκε." });
  } catch (err) {
    logger.error("❌ Σφάλμα κατά τη διαγραφή χρήστη", { stack: err.stack });
    next(new ApiError(400, "Αποτυχία διαγραφής χρήστη"));
  }
};
