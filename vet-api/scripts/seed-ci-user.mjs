/**
 * Seed script για CI — δημιουργεί έναν test user με γνωστό PIN.
 * Χρήση: node scripts/seed-ci-user.mjs <PIN>
 * Τρέχει μόνο σε CI (NODE_ENV=ci). Σβήνει τυχόν προηγούμενο CI user.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { hashPin } from "../services/auth/pinCrypto.js";
import User from "../models/User.js";

const PIN      = process.argv[2] ?? process.env.SYNTHETIC_USER_PIN;
const MONGO    = process.env.MONGO_URI;

if (!PIN)   { console.error("❌ Δεν δόθηκε PIN. Χρήση: node seed-ci-user.mjs <PIN>"); process.exit(1); }
if (!MONGO) { console.error("❌ MONGO_URI δεν ορίστηκε."); process.exit(1); }

await mongoose.connect(MONGO);
await User.deleteOne({ name: "CI Synthetic User" });
const pinHash = await hashPin(String(PIN));
await User.create({ name: "CI Synthetic User", role: "admin", pinHash, isActive: true });
console.log("✅ CI user δημιουργήθηκε με PIN", PIN);
await mongoose.disconnect();
