import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import { hashPin } from "../services/auth/pinCrypto.js";

dotenv.config();

async function run() {
  if (!process.env.MONGO_URI) {
    console.error("❌ Missing MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });

  const users = await User.find({
    pin: { $exists: true, $ne: null, $ne: "" },
  });

  console.log(`🔎 Found ${users.length} users with legacy pin`);

  let migrated = 0;
  for (const u of users) {
    if (!u.pinHash && u.pin) {
      u.pinHash = await hashPin(u.pin);
      await u.save();
      migrated++;
      console.log(`✅ Migrated: ${u.name}`);
    }
  }

  console.log(`🎉 Done. Migrated ${migrated}/${users.length}.`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
