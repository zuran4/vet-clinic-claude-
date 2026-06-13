// scripts/backup-db.mjs (ESM)
//
// Κάνει dump όλων των collections της MongoDB (Atlas) σε JSON (EJSON για σωστή
// διατήρηση τύπων όπως ObjectId/Date), τα πακετάρει σε .tar.gz και διαγράφει
// παλιά backups πέρα από το BACKUP_KEEP_DAYS.
//
// Χρήση: node scripts/backup-db.mjs
// Env:   MONGO_URI (απαιτείται), BACKUP_DIR (default /app/backups),
//        BACKUP_KEEP_DAYS (default 14)

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
const BACKUP_DIR = process.env.BACKUP_DIR || "/app/backups";
const KEEP_DAYS = Number(process.env.BACKUP_KEEP_DAYS || 14);

async function run() {
  if (!MONGO_URI) {
    console.error("❌ Missing MONGO_URI in .env");
    process.exit(1);
  }

  console.log("🔗 Connecting to MongoDB…");
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vet-backup-"));
  const dumpDir = path.join(tmpDir, timestamp);
  fs.mkdirSync(dumpDir, { recursive: true });

  const collections = await db.listCollections().toArray();
  for (const { name } of collections) {
    const docs = await db.collection(name).find({}).toArray();
    fs.writeFileSync(
      path.join(dumpDir, `${name}.json`),
      EJSON.stringify(docs, { relaxed: false }, 2)
    );
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const archivePath = path.join(BACKUP_DIR, `${timestamp}.tar.gz`);
  execSync(`tar -czf "${archivePath}" -C "${tmpDir}" "${timestamp}"`);
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // Rotation: διαγραφή backups πέρα από KEEP_DAYS
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  for (const file of fs.readdirSync(BACKUP_DIR)) {
    if (!file.endsWith(".tar.gz")) continue;
    const filePath = path.join(BACKUP_DIR, file);
    if (fs.statSync(filePath).mtimeMs < cutoff) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Διαγράφηκε παλιό backup: ${file}`);
    }
  }

  await mongoose.disconnect();
  console.log(`✅ Backup ολοκληρώθηκε: ${archivePath} (${collections.length} collections)`);
}

run().catch((e) => {
  console.error("❌ backup-db error:", e);
  process.exit(1);
});
