import { signToken } from "../../utils/jwt.js";
import logger from "../../utils/logger.js";
import { comparePin } from "./pinCrypto.js";
import { generateRefreshToken, saveRefreshToken } from "./tokenService.js";
import { getPermissions } from "../../config/roles.js";
import { getTenantModels } from "../tenantConnectionManager.js";
import { getTenantModel } from "../adminConnection.js";

/**
 * Login με clinicId + PIN.
 * 1) Επαληθεύει ότι η κλινική υπάρχει και είναι ενεργή (admin DB)
 * 2) Συνδέεται στη βάση της κλινικής και ψάχνει τον χρήστη με bcrypt
 * 3) Επιστρέφει JWT με clinicId ενσωματωμένο
 */
export async function loginWithPin(clinicId, pin) {
  const q = String(pin || "").trim();
  if (!q || !clinicId) return null;

  // 1) Έλεγχος tenant στο admin DB
  const Tenant = getTenantModel();
  const tenant = await Tenant.findOne({ clinicId, isActive: true }).lean();
  if (!tenant) return null;

  // 2) Φέρε User model από tenant connection
  const { User, RefreshToken } = getTenantModels(clinicId);

  const candidates = await User.find({
    isActive: true,
    pinHash: { $exists: true, $ne: null },
  })
    .select({ name: 1, role: 1, pinHash: 1 })
    .lean();

  for (const u of candidates) {
    const ok = await comparePin(q, u.pinHash);
    if (ok) {
      const token = signToken({ userId: u._id, name: u.name, role: u.role, clinicId });
      const rawRefresh = generateRefreshToken();
      await saveRefreshToken(u._id, rawRefresh, RefreshToken);
      logger.info(`login ok: ${u.name} (${u.role}) @ ${clinicId}`);
      return {
        token,
        refreshToken: rawRefresh,
        name: u.name,
        role: u.role,
        clinicId,
        clinicName: tenant.clinicName,
        permissions: getPermissions(u.role),
      };
    }
  }

  return null;
}
