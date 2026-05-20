// models/User.js (ESM)
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ["admin","assistant"], default: "assistant", index: true },
    // ❌ αφαιρέθηκε το legacy `pin`
    pinHash: { type: String, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// ❌ αφαιρέθηκε το userSchema.index({ pinHash: 1 }, ...)
// Σημείωση: Μην βάλεις unique στο pinHash. Με bcrypt υπάρχει salt, άρα ίδιο PIN ≠ ίδιο hash.
const User = mongoose.model("User", userSchema);
export default User;
