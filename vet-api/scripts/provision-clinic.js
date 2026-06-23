/**
 * Δημιουργεί μια νέα κλινική στο σύστημα:
 *  1. Προσθέτει record στο vetAdmin (Tenant registry)
 *  2. Δημιουργεί τον πρώτο admin χρήστη στη βάση της κλινικής
 *  3. Εκτυπώνει τα credentials
 *
 * Χρήση:
 *   node scripts/provision-clinic.js \
 *     --clinicId papadopoulos \
 *     --clinicName "Κτηνιατρείο Παπαδόπουλου" \
 *     --adminName "Δρ. Παπαδόπουλος" \
 *     --adminPin 1234
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { parseArgs } from "node:util";

dotenv.config();

import { tenantSchema } from "../models/Tenant.js";
import { userSchema }   from "../models/User.js";
import { hashPin }      from "../services/auth/pinCrypto.js";

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

const clinicId = args.clinicId.toLowerCase().trim();
const dbName   = `vetClinic_${clinicId}`;

function buildUri(baseUri, db) {
  return baseUri.replace(/\/([^/?]+)(\?.*)?$/, `/${db}$2`);
}

async function main() {
  // 1) Σύνδεση στο Admin DB
  const adminConn = await mongoose.createConnection(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  }).asPromise();

  const Tenant = adminConn.model("Tenant", tenantSchema);

  const exists = await Tenant.findOne({ clinicId });
  if (exists) {
    console.error(`❌ Η κλινική "${clinicId}" υπάρχει ήδη.`);
    await adminConn.close();
    process.exit(1);
  }

  // 2) Δημιουργία tenant record
  await Tenant.create({
    clinicId,
    clinicName: args.clinicName,
    dbName,
    isActive: true,
    plan: "trial",
  });
  console.log(`✅ Tenant "${clinicId}" δημιουργήθηκε στο Admin DB.`);

  // 3) Σύνδεση στο Tenant DB
  const tenantUri  = buildUri(process.env.MONGO_URI, dbName);
  const tenantConn = await mongoose.createConnection(tenantUri, {
    serverSelectionTimeoutMS: 10000,
  }).asPromise();

  const User = tenantConn.model("User", userSchema);

  // 4) Δημιουργία admin χρήστη
  const pinHash = await hashPin(args.adminPin);
  await User.create({ name: args.adminName, role: "admin", pinHash, isActive: true });

  console.log(`✅ Admin χρήστης "${args.adminName}" δημιουργήθηκε στο ${dbName}.`);
  console.log("\n--- Στοιχεία Σύνδεσης ---");
  console.log(`  clinicId : ${clinicId}`);
  console.log(`  PIN      : ${args.adminPin}`);
  console.log(`  DB       : ${dbName}`);
  console.log("-------------------------\n");

  await adminConn.close();
  await tenantConn.close();
}

main().catch((err) => {
  console.error("❌ Σφάλμα:", err.message);
  process.exit(1);
});
