import ApiError from "../../utils/apiError.js";
import { getTenantModel } from "../adminConnection.js";
import { getTenantModels } from "../tenantConnectionManager.js";
import { hashPin } from "../auth/pinCrypto.js";

/**
 * Δημιουργεί μια νέα κλινική: Tenant record στο vetAdmin + πρώτος admin
 * χρήστης στη δική της βάση. Καλείται είτε από το CLI script
 * (scripts/provision-clinic.js) είτε από το internal API endpoint
 * (routes/internal/tenants.js).
 */
export async function provisionTenant({ clinicId, clinicName, adminName, adminPin, ownerEmail = "", ownerPhone = "" }) {
  const normalizedId = String(clinicId).toLowerCase().trim();
  const dbName = `vetClinic_${normalizedId}`;

  const Tenant = getTenantModel();
  const exists = await Tenant.findOne({ clinicId: normalizedId });
  if (exists) {
    throw ApiError.conflict(`Η κλινική "${normalizedId}" υπάρχει ήδη.`);
  }

  await Tenant.create({
    clinicId: normalizedId,
    clinicName,
    dbName,
    isActive: true,
    plan: "trial",
    ownerEmail,
    ownerPhone,
  });

  const { User } = getTenantModels(normalizedId);
  const pinHash = await hashPin(adminPin);
  await User.create({ name: adminName, role: "admin", pinHash, isActive: true });

  return { clinicId: normalizedId, clinicName, dbName };
}
