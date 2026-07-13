import { signToken } from "../../utils/jwt.js";
import logger from "../../utils/logger.js";
import { comparePin } from "./pinCrypto.js";
import { generateRefreshToken, saveRefreshToken } from "./tokenService.js";
import { getPermissions } from "../../config/roles.js";
import { getTenantModels } from "../tenantConnectionManager.js";
import { getTenantModel } from "../adminConnection.js";

/**
 * Επιστρέφει τη λίστα ενεργού προσωπικού μιας κλινικής (όνομα, ρόλος) —
 * χρησιμοποιείται στην οθόνη "διάλεξε ποιος είσαι" πριν το PIN, χωρίς να
 * απαιτείται σύνδεση.
 */
export async function getActiveStaff(clinicId) {
  if (!clinicId) return null;

  const Tenant = getTenantModel();
  const tenant = await Tenant.findOne({ clinicId, isActive: true }).lean();
  if (!tenant) return null;

  const { User } = getTenantModels(clinicId);
  const users = await User.find({ isActive: true }, { name: 1, role: 1 }).sort({ name: 1 }).lean();

  return { clinicName: tenant.clinicName, users };
}

/**
 * Login με clinicId + userId (επιλεγμένος χρήστης) + PIN.
 * 1) Επαληθεύει ότι η κλινική υπάρχει και είναι ενεργή (admin DB)
 * 2) Ελέγχει το PIN ΜΟΝΟ για τον συγκεκριμένο επιλεγμένο χρήστη (bcrypt)
 * 3) Επιστρέφει JWT με clinicId ενσωματωμένο
 */
export async function loginWithPin(clinicId, pin, userId) {
  const q = String(pin || "").trim();
  if (!q || !clinicId || !/^[a-fA-F0-9]{24}$/.test(String(userId || ""))) return null;

  // 1) Έλεγχος tenant στο admin DB
  const Tenant = getTenantModel();
  const tenant = await Tenant.findOne({ clinicId, isActive: true }).lean();
  if (!tenant) return null;

  // 2) Φέρε τον συγκεκριμένο χρήστη από τη βάση της κλινικής
  const { User, RefreshToken } = getTenantModels(clinicId);

  const u = await User.findOne({
    _id: userId,
    isActive: true,
    pinHash: { $exists: true, $ne: null },
  })
    .select({ name: 1, role: 1, pinHash: 1 })
    .lean();

  if (!u) return null;

  const ok = await comparePin(q, u.pinHash);
  if (!ok) return null;

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
