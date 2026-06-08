import { describe, it, expect } from "@jest/globals";

import { hashPin, comparePin } from "../pinCrypto.js";

describe("pinCrypto", () => {
  it("hashes a PIN and verifies it back via comparePin", async () => {
    const hash = await hashPin("1234");

    expect(hash).not.toBe("1234");
    await expect(comparePin("1234", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect PIN against an existing hash", async () => {
    const hash = await hashPin("1234");

    await expect(comparePin("9999", hash)).resolves.toBe(false);
  });

  it("produces a different hash each time due to bcrypt salting", async () => {
    const [hashA, hashB] = await Promise.all([hashPin("1234"), hashPin("1234")]);

    expect(hashA).not.toBe(hashB);
    await expect(comparePin("1234", hashA)).resolves.toBe(true);
    await expect(comparePin("1234", hashB)).resolves.toBe(true);
  });
});
