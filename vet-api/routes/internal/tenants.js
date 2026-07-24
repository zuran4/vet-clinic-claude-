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

// Active kiosks/logins per clinic -- each non-expired RefreshToken = one connected kiosk/device.
router.get("/:clinicId/sessions", requireServiceKey, async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { RefreshToken, User } = getTenantModels(clinicId);

    const tokens = await RefreshToken.find().sort({ createdAt: -1 }).lean();
    const userIds = [...new Set(tokens.map((t) => String(t.userId)))];
    const users = await User.find({ _id: { $in: userIds } }).select("name role isActive").lean();
    const userById = new Map(users.map((u) => [String(u._id), u]));

    const sessions = tokens.map((t) => {
      const user = userById.get(String(t.userId));
      return {
        userId: t.userId,
        name: user?.name || "Unknown",
        role: user?.role || null,
        loginAt: t.createdAt,
        expiresAt: t.expiresAt,
      };
    });

    res.json({ activeKiosks: sessions.length, sessions });
  } catch (err) {
    next(err);
  }
});

export default router;
