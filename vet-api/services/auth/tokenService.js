import crypto from "crypto";
import RefreshToken from "../../models/RefreshToken.js";

const EXPIRES_DAYS = 7;

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function saveRefreshToken(userId, rawToken) {
  const expiresAt = new Date(Date.now() + EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ userId, tokenHash: hashToken(rawToken), expiresAt });
}

// Επικυρώνει το refresh token, το διαγράφει (rotation) και επιστρέφει το userId.
// Επιστρέφει null αν το token δεν υπάρχει ή έχει λήξει.
export async function rotateRefreshToken(rawToken) {
  const hash = hashToken(rawToken);
  const record = await RefreshToken.findOneAndDelete({ tokenHash: hash });
  if (!record) return null;
  if (record.expiresAt < new Date()) return null;
  return record.userId;
}

export async function revokeRefreshToken(rawToken) {
  const hash = hashToken(rawToken);
  await RefreshToken.deleteOne({ tokenHash: hash });
}

export async function revokeAllForUser(userId) {
  await RefreshToken.deleteMany({ userId });
}
