import { getTenantModels } from "../services/tenantConnectionManager.js";

/**
 * Τρέχει ΜΕΤΑ το requireAuth.
 * Διαβάζει το clinicId από το JWT (req.user.clinicId) και φορτώνει
 * όλα τα Mongoose models της σωστής κλινικής στο req.models.
 */
export default function resolveTenant(req, res, next) {
  const clinicId = req.user?.clinicId;
  if (!clinicId) {
    return res.status(401).json({ message: "Δεν βρέθηκε clinicId στο token." });
  }

  try {
    req.models = getTenantModels(clinicId);
    req.clinicId = clinicId;
    next();
  } catch (err) {
    next(err);
  }
}
