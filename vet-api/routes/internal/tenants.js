import { Router } from "express";
import requireServiceKey from "../../middlewares/internal/requireServiceKey.js";
import ApiError from "../../utils/apiError.js";
import { provisionTenant } from "../../services/tenants/provisionTenant.js";
import { getTenantModel } from "../../services/adminConnection.js";
import { getTenantConnection } from "../../services/tenantConnectionManager.js";

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

export default router;
