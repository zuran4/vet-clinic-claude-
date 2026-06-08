// ===============================================
// 📄 services/auth/authService.js
// Στόχος: login ΜΟΝΟ με hashed PIN (bcrypt)
// Προϋπόθεση: models/User.js -> pinHash (required), ΟΧΙ plain pin
// ===============================================

import User from "../../models/User.js";
import { signToken } from "../../utils/jwt.js";
import logger from "../../utils/logger.js";

import { comparePin } from "./pinCrypto.js";

/**
 * Login με PIN:
 * - Παίρνουμε το PIN από τον χρήστη
 * - Βρίσκουμε ενεργούς χρήστες με pinHash
 * - Κάνουμε bcrypt.compare για να βρούμε ποιος ταιριάζει
 *
 * Σημείωση: Αν έχεις πολλούς χρήστες, προτίμησε selector (π.χ. username/email)
 * για να αποφύγεις iteration. Με μόνο PIN, απαιτείται έλεγχος σε υποψήφιους.
 */
export async function loginWithPin(pin) {
  const q = String(pin || "").trim();
  if (!q) return null;

  // 1) Φέρε ενεργούς χρήστες που έχουν pinHash
  const candidates = await User.find({
    isActive: true,
    pinHash: { $exists: true, $ne: null },
  })
    .select({ name: 1, role: 1, pinHash: 1 }) // μόνο ό,τι χρειάζεται
    .lean();

  // 2) Έλεγχος bcrypt.compare ανά υποψήφιο
  for (const u of candidates) {
    const ok = await comparePin(q, u.pinHash);
    if (ok) {
      const token = signToken({ userId: u._id, name: u.name, role: u.role });
      logger.info(`login ok: ${u.name} (${u.role})`);
      return { token, name: u.name, role: u.role };
    }
  }

  // 3) Καμία αντιστοίχιση
  return null;
}
