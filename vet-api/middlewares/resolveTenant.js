import * as Sentry from "@sentry/node";
import { getTenantModels } from "../services/tenantConnectionManager.js";

// Throttle των lastSeenAt updates ώστε να μη γράφουμε στη Mongo σε κάθε
// request — αρκεί μία ενημέρωση κάθε λίγα δευτερόλεπτα ανά χρήστη.
const LAST_SEEN_THROTTLE_MS = 20_000;
const lastSeenThrottle = new Map(); // "clinicId:userId" -> timestamp

function touchLastSeen(models, userId, clinicId) {
  const key = `${clinicId}:${userId}`;
  const now = Date.now();
  const last = lastSeenThrottle.get(key) || 0;
  if (now - last < LAST_SEEN_THROTTLE_MS) return;

  lastSeenThrottle.set(key, now);
  models.User.updateOne({ _id: userId }, { lastSeenAt: new Date() }).catch(() => {});
}

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

    // Ώστε κάθε error σε αυτό το request να φιλτράρεται ανά κλινική στο Sentry
    // (ίδιο scope API με το requestId στο middlewares/requestId.js — το global
    // Sentry.setTag() γράφει σε άλλο scope και δεν "κολλάει" αξιόπιστα ανά request)
    Sentry.getCurrentScope().setTag("clinicId", clinicId);

    if (req.user?.userId) {
      touchLastSeen(req.models, req.user.userId, clinicId);
    }

    next();
  } catch (err) {
    next(err);
  }
}
