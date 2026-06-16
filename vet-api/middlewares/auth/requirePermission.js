import ApiError from "../../utils/apiError.js";
import { hasPermission } from "../../config/roles.js";

// Πρέπει να χρησιμοποιείται ΜΕΤΑ το requireAuth (χρειάζεται το req.user.role)
export default function requirePermission(permission) {
  return function (req, res, next) {
    const role = req.user?.role;
    if (!role) return next(ApiError.unauthorized("Απαιτείται σύνδεση"));
    if (!hasPermission(role, permission)) {
      return next(ApiError.forbidden("Δεν έχεις δικαίωμα για αυτή την ενέργεια"));
    }
    next();
  };
}
