import ApiError from "../../utils/apiError.js";

// Πρέπει να χρησιμοποιείται ΜΕΤΑ το requireAuth (χρειάζεται το req.user.role)
export default function requireRole(...roles) {
  return function (req, res, next) {
    if (!roles.includes(req.user?.role)) {
      return next(ApiError.forbidden("Δεν έχεις δικαίωμα πρόσβασης σε αυτή την ενέργεια"));
    }
    next();
  };
}
