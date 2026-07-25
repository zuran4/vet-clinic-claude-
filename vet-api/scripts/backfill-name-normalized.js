// scripts/backfill-name-normalized.js
//
// Συμπληρώνει το nameNormalized (χωρίς τόνους, ομόηχα ενοποιημένα) σε όλους
// τους ήδη υπάρχοντες πελάτες & κατοικίδια, σε ΟΛΕΣ τις κλινικές (tenants).
// Χρειάζεται μόνο μία φορά — τα νέα/ενημερωμένα records το γεμίζουν πλέον
// αυτόματα μέσω των pre-save / pre-findOneAndUpdate hooks στα models.
//
// Χρήση: node scripts/backfill-name-normalized.js
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import { connectAdmin, getTenantModel } from "../services/adminConnection.js";
import { getTenantModels } from "../services/tenantConnectionManager.js";
import { normalizeGreek } from "../utils/greekNormalize.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function backfillCollection(Model, label) {
  const docs = await Model.find({}, { name: 1 }).lean();
  let updated = 0;

  for (const doc of docs) {
    const nameNormalized = normalizeGreek(doc.name);
    await Model.updateOne({ _id: doc._id }, { $set: { nameNormalized } });
    updated++;
  }

  console.log(`   ${label}: ενημερώθηκαν ${updated}/${docs.length}`);
}

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ Λείπει το MONGO_URI στο .env");
    process.exit(1);
  }

  console.log("🔗 Σύνδεση στο vetAdmin...");
  await connectAdmin(uri);
  const Tenant = getTenantModel();

  const tenants = await Tenant.find({}, { clinicId: 1, clinicName: 1 }).lean();
  console.log(`🔎 Βρέθηκαν ${tenants.length} κλινικές.`);

  for (const t of tenants) {
    console.log(`\n🏥 ${t.clinicName} (${t.clinicId})`);
    const { Customer, Pet } = getTenantModels(t.clinicId);
    await backfillCollection(Customer, "Πελάτες");
    await backfillCollection(Pet, "Κατοικίδια");
  }

  console.log("\n✅ Ολοκληρώθηκε το backfill.");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ backfill-name-normalized error:", err);
  process.exit(1);
});
