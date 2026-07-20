/**
 * Δημιουργεί μια νέα κλινική στο σύστημα (Tenant record + πρώτος admin χρήστης).
 * Λεπτό CLI wrapper πάνω από το services/tenants/provisionTenant.js — η ίδια
 * λογική χρησιμοποιείται και από το internal API endpoint (routes/internal/tenants.js).
 *
 * Χρήση:
 *   node scripts/provision-clinic.js \
 *     --clinicId papadopoulos \
 *     --clinicName "Κτηνιατρείο Παπαδόπουλου" \
 *     --adminName "Δρ. Παπαδόπουλος" \
 *     --adminPin 1234
 */

import dotenv from "dotenv";
import { parseArgs } from "node:util";

dotenv.config();

import { connectAdmin } from "../services/adminConnection.js";
import { closeAllTenantConnections } from "../services/tenantConnectionManager.js";
import { provisionTenant } from "../services/tenants/provisionTenant.js";

const { values: args } = parseArgs({
  options: {
    clinicId:   { type: "string" },
    clinicName: { type: "string" },
    adminName:  { type: "string" },
    adminPin:   { type: "string" },
  },
});

if (!args.clinicId || !args.clinicName || !args.adminName || !args.adminPin) {
  console.error("Χρήση: node provision-clinic.js --clinicId X --clinicName Y --adminName Z --adminPin W");
  process.exit(1);
}

async function main() {
  await connectAdmin(process.env.MONGO_URI);

  const result = await provisionTenant({
    clinicId: args.clinicId,
    clinicName: args.clinicName,
    adminName: args.adminName,
    adminPin: args.adminPin,
  });

  console.log(`✅ Tenant "${result.clinicId}" δημιουργήθηκε στο Admin DB.`);
  console.log(`✅ Admin χρήστης "${args.adminName}" δημιουργήθηκε στο ${result.dbName}.`);
  console.log("\n--- Στοιχεία Σύνδεσης ---");
  console.log(`  clinicId : ${result.clinicId}`);
  console.log(`  PIN      : ${args.adminPin}`);
  console.log(`  DB       : ${result.dbName}`);
  console.log("-------------------------\n");

  await closeAllTenantConnections();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Σφάλμα:", err.message);
  process.exit(1);
});
