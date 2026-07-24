import { Router } from "express";
import requireServiceKey from "../../middlewares/internal/requireServiceKey.js";
import ApiError from "../../utils/apiError.js";
import { provisionTenant } from "../../services/tenants/provisionTenant.js";
import { getTenantModel } from "../../services/adminConnection.js";
import { getTenantConnection, getTenantModels } from "../../services/tenantConnectionManager.js";

const router = Router();

router.post("/", requireServiceKey, async (req, res, next) => {
  try {
    const { clinicId, clinicName, adminName, adminPin, ownerEmail, ownerPhone } = req.body;

    if (!clinicId || !clinicName || !adminName || !adminPin) {
      throw ApiError.badRequest("clinicId, clinicName, adminName και adminPin απαιτούνται.");
    }

    const tenant = await provisionTenant({ clinicId, clinicName, adminName, adminPin, ownerEmail, ownerPhone });
    res.status(201).json({ tenant });
  } catch (err) {
    next(err);
  }
});

// Χώρος αποθήκευσης (MB) ανά κλινική στο Atlas — dbStats() σε κάθε tenant DB.
router.get("/storage", requireServiceKey, async (req, res, next) => {
  try {
    const Tenant = getTenantModel();
    const tenants = await Tenant.find().select("clinicId clinicName").lean();

    const results = await Promise.all(
      tenants.map(async (t) => {
        try {
          const conn = getTenantConnection(t.clinicId);
          if (conn.readyState !== 1) await conn.asPromise();

          const dbStats = await conn.db.stats();
          const totalBytes = (dbStats.storageSize || 0) + (dbStats.indexSize || 0);

          return {
            clinicId: t.clinicId,
            clinicName: t.clinicName,
            storageMB: Math.round((totalBytes / (1024 * 1024)) * 100) / 100,
          };
        } catch (err) {
          return { clinicId: t.clinicId, clinicName: t.clinicName, storageMB: null, error: err.message };
        }
      })
    );

    res.json({ tenants: results });
  } catch (err) {
    next(err);
  }
});

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // θεωρείται online αν είδαμε δραστηριότητα τα τελευταία 2 λεπτά

// Διαφορετικοί χρήστες που έχουν ενεργό (μη ληγμένο) login σε αυτή την κλινική,
// με live online/offline βάσει lastSeenAt (ενημερώνεται σε κάθε request τους).
router.get("/:clinicId/sessions", requireServiceKey, async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { RefreshToken, User } = getTenantModels(clinicId);

    const tokens = await RefreshToken.find().select("userId").lean();
    const userIds = [...new Set(tokens.map((t) => String(t.userId)))];
    const users = await User.find({ _id: { $in: userIds } }).select("name role lastSeenAt").lean();

    const now = Date.now();
    const result = users
      .map((u) => {
        const lastSeenAt = u.lastSeenAt || null;
        const online = lastSeenAt ? now - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS : false;
        return { userId: u._id, name: u.name, role: u.role, lastSeenAt, online };
      })
      .sort((a, b) => {
        if (a.online !== b.online) return a.online ? -1 : 1;
        return new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0);
      });

    res.json({ users: result });
  } catch (err) {
    next(err);
  }
});

export default router;
