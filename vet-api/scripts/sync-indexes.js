// scripts/sync-indexes.js (ESM)
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";

// Optional: αν θέλεις να δεις καθαρό error όταν λείπει index
mongoose.set("strictQuery", true);

// resolve για .env από project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ Missing MONGO_URI in .env");
    process.exit(1);
  }

  console.log("🔗 Connecting to MongoDB…");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  console.log("🔧 Syncing indexes for User model…");
  await User.syncIndexes();

  // Προαιρετικά: δες τα τρέχοντα indexes
  const idx = await User.collection.indexes();
  console.log("📚 Current User indexes:", idx.map(i => i.name));

  await mongoose.disconnect();
  console.log("✅ Done.");
}

run().catch((e) => {
  console.error("❌ sync-indexes error:", e);
  process.exit(1);
});
