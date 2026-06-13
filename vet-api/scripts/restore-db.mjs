// scripts/restore-db.mjs (ESM)
//
// Επαναφέρει τη MongoDB από ένα .tar.gz backup που έφτιαξε το backup-db.mjs.
// ΠΡΟΣΟΧΗ: αντικαθιστά τα περιεχόμενα κάθε collection που υπάρχει στο backup
// (deleteMany + insertMany) — δεν αγγίζει collections που δεν υπάρχουν στο backup.
//
// Χρήση: node scripts/restore-db.mjs <path-to-backup.tar.gz> --confirm
//   (χωρίς --confirm κάνει μόνο dry-run και δείχνει τι θα γινόταν)

import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

import mongoose from "mongoose";
import { EJSON } from "bson";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGO_URI = process.env.MONGO_URI;
const archivePath = process.argv[2];
const confirmed = process.argv.includes("--confirm");

async function run() {
  if (!MONGO_URI) {
    console.error("❌ Missing MONGO_URI in .env");
    process.exit(1);
  }
  if (!archivePath || !fs.existsSync(archivePath)) {
    console.error("Χρήση: node scripts/restore-db.mjs <path-to-backup.tar.gz> [--confirm]");
    process.exit(1);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vet-restore-"));
  execSync(`tar -xzf "${archivePath}" -C "${tmpDir}"`);
  const extractedDir = path.join(tmpDir, fs.readdirSync(tmpDir)[0]);

  console.log("🔗 Connecting to MongoDB…");
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;

  for (const file of fs.readdirSync(extractedDir)) {
    if (!file.endsWith(".json")) continue;
    const name = file.replace(/\.json$/, "");
    const docs = EJSON.parse(fs.readFileSync(path.join(extractedDir, file), "utf8"));

    if (!confirmed) {
      console.log(`[dry-run] ${name}: θα γινόταν αντικατάσταση με ${docs.length} έγγραφα`);
      continue;
    }

    await db.collection(name).deleteMany({});
    if (docs.length > 0) {
      await db.collection(name).insertMany(docs);
    }
    console.log(`✅ ${name}: επαναφέρθηκαν ${docs.length} έγγραφα`);
  }

  if (!confirmed) {
    console.log("\nℹ️  Dry-run μόνο. Πρόσθεσε --confirm για πραγματική επαναφορά.");
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("❌ restore-db error:", e);
  process.exit(1);
});
