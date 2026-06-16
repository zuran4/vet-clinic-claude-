import crypto from "crypto";
import config from "../config/index.js";

const ALGORITHM  = "aes-256-gcm";
const IV_BYTES   = 12;
const PREFIX     = "enc:";

// Κρυπτογραφεί plaintext → "enc:ivHex:tagHex:ciphertextHex"
export function encrypt(plaintext) {
  if (!plaintext) return "";

  const key      = Buffer.from(config.encryptionKey, "hex");
  const iv       = crypto.randomBytes(IV_BYTES);
  const cipher   = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag      = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

// Αποκρυπτογραφεί "enc:ivHex:tagHex:ciphertextHex" → plaintext
// Αν η τιμή δεν είναι κρυπτογραφημένη (legacy plaintext), την επιστρέφει ως έχει.
export function decrypt(value) {
  if (!value) return "";
  if (!value.startsWith(PREFIX)) return value; // legacy — plaintext, ακόμα δεν κρυπτογραφήθηκε

  const rest   = value.slice(PREFIX.length);
  const parts  = rest.split(":");
  if (parts.length !== 3) return value; // malformed — επιστρέφουμε ως έχει

  const [ivHex, tagHex, encHex] = parts;
  const key       = Buffer.from(config.encryptionKey, "hex");
  const decipher  = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(encHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

export function isEncrypted(value) {
  return typeof value === "string" && value.startsWith(PREFIX);
}
