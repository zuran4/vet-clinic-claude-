import crypto from "crypto";

const EXPIRES_DAYS = 7;

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// Όλες οι συναρτήσεις δέχονται το RefreshToken model ως παράμετρο (dependency injection)
export async function saveRefreshToken(userId, rawToken, RefreshToken) {
  const expiresAt = new Date(Date.now() + EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ userId, tokenHash: hashToken(rawToken), expiresAt });
}

export async function rotateRefreshToken(rawToken, RefreshToken) {
  const hash = hashToken(rawToken);
  const record = await RefreshToken.findOneAndDelete({ tokenHash: hash });
  if (!record) return null;
  if (record.expiresAt < new Date()) return null;
  return record.userId;
}

export async function revokeRefreshToken(rawToken, RefreshToken) {
  const hash = hashToken(rawToken);
  await RefreshToken.deleteOne({ tokenHash: hash });
}

export async function revokeAllForUser(userId, RefreshToken) {
  await RefreshToken.deleteMany({ userId });
}
