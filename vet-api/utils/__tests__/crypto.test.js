import { describe, it, expect } from "@jest/globals";
import { encrypt, decrypt, isEncrypted } from "../crypto.js";

describe("crypto utils", () => {
  it("κρυπτογραφεί και αποκρυπτογραφεί σωστά", () => {
    const plaintext = "MySuperSecretPass123!";
    const ciphertext = encrypt(plaintext);

    expect(ciphertext).not.toBe(plaintext);
    expect(ciphertext).toMatch(/^enc:/);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it("παράγει διαφορετικό ciphertext κάθε φορά (τυχαίο IV)", () => {
    const plaintext = "SamePassword";
    const c1 = encrypt(plaintext);
    const c2 = encrypt(plaintext);

    expect(c1).not.toBe(c2);
    expect(decrypt(c1)).toBe(plaintext);
    expect(decrypt(c2)).toBe(plaintext);
  });

  it("επιστρέφει κενό string για κενή είσοδο", () => {
    expect(encrypt("")).toBe("");
    expect(decrypt("")).toBe("");
  });

  it("επιστρέφει legacy plaintext ως έχει (migration path)", () => {
    expect(decrypt("PlaintextPassword")).toBe("PlaintextPassword");
    expect(isEncrypted("PlaintextPassword")).toBe(false);
  });

  it("isEncrypted αναγνωρίζει σωστά κρυπτογραφημένες τιμές", () => {
    expect(isEncrypted(encrypt("test"))).toBe(true);
    expect(isEncrypted("plain")).toBe(false);
    expect(isEncrypted("")).toBe(false);
  });
});
