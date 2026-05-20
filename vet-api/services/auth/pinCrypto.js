import bcrypt from "bcryptjs";

export async function hashPin(pin) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin, salt);
}

export async function comparePin(pin, hash) {
  return bcrypt.compare(pin, hash);
}
