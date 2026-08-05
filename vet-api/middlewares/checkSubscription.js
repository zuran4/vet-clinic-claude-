import ApiError from "../utils/apiError.js";
import { getTenantModel } from "../services/adminConnection.js";

// Μετά τη λήξη trialEndsAt, η κλινική έχει ακόμα τόσο χρόνο σε read-only mode
// πριν μπλοκαριστεί εντελώς.
const GRACE_PERIOD_MS = 5 * 24 * 60 * 60 * 1000;

// Cache του Tenant doc ώστε να μη χτυπάμε το vetAdmin σε κάθε request
// (ίδιο pattern με το pool Map του tenantConnectionManager.js).
const CACHE_TTL_MS = 45 * 1000;
const cache = new Map(); // clinicId -> { tenant, expiresAt }

async function getCachedTenant(clinicId) {
  const cached = cache.get(clinicId);
  if (cached && cached.expiresAt > Date.now()) return cached.tenant;

  const Tenant = getTenantModel();
  const tenant = await Tenant.findOne({ clinicId }).lean();
  cache.set(clinicId, { tenant, expiresAt: Date.now() + CACHE_TTL_MS });
  return tenant;
}

/**
 * Πρέπει να τρέχει ΜΕΤΑ το resolveTenant (χρειάζεται req.clinicId).
 * Επιβάλλει isActive/plan/trialEndsAt από το Tenant registry:
 *  - isActive = false            → πλήρες block
 *  - trial, εντός trialEndsAt    → κανονική πρόσβαση
 *  - trial, grace period         → μόνο GET requests
 *  - trial, μετά το grace period → πλήρες block
 *  - basic/pro                   → καμία ενέργεια (billing enforcement έρχεται αργότερα)
 */
export default async function checkSubscription(req, res, next) {
  const clinicId = req.clinicId;
  if (!clinicId) {
    return next(ApiError.unauthorized("Δεν βρέθηκε clinicId."));
  }

  try {
    const tenant = await getCachedTenant(clinicId);

    if (!tenant) {
      return next(new ApiError(403, "Το κτηνιατρείο δεν βρέθηκε.", { code: "TENANT_NOT_FOUND", expose: true }));
    }

    if (!tenant.isActive) {
      return next(
        new ApiError(403, "Ο λογαριασμός του κτηνιατρείου είναι απενεργοποιημένος.", {
          code: "TENANT_INACTIVE",
          expose: true,
        })
      );
    }

    if (tenant.plan === "trial" && tenant.trialEndsAt) {
      const trialEnd = new Date(tenant.trialEndsAt).getTime();
      const now = Date.now();

      if (now < trialEnd) return next();

      const graceEnd = trialEnd + GRACE_PERIOD_MS;
      if (now < graceEnd) {
        if (req.method === "GET") return next();
        return next(
          new ApiError(403, "Η δοκιμαστική περίοδος έληξε. Μπορείτε μόνο να δείτε δεδομένα μέχρι να ανανεωθεί η συνδρομή.", {
            code: "SUBSCRIPTION_GRACE_PERIOD",
            expose: true,
          })
        );
      }

      return next(
        new ApiError(403, "Η δοκιμαστική περίοδος έληξε. Επικοινωνήστε για ανανέωση συνδρομής.", {
          code: "SUBSCRIPTION_EXPIRED",
          expose: true,
        })
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

// Χρησιμοποιείται ΜΟΝΟ σε tests για να αδειάζει το cache ανάμεσα σε cases
export function _clearTenantCache(clinicId) {
  if (clinicId) cache.delete(clinicId);
  else cache.clear();
}
