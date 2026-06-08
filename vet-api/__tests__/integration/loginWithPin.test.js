import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";

import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/testDb.js";
import { loginWithPin } from "../../services/auth/authService.js";
import { hashPin } from "../../services/auth/pinCrypto.js";
import { verifyToken } from "../../utils/jwt.js";
import User from "../../models/User.js";

beforeAll(connectTestDb, 60_000);
afterAll(disconnectTestDb);
beforeEach(clearCollections);

describe("loginWithPin", () => {
  it("returns a signed token plus profile when the PIN matches an active user", async () => {
    await User.create({ name: "Δρ. Παπαδάκη", role: "admin", pinHash: await hashPin("4321"), isActive: true });

    const result = await loginWithPin("4321");

    expect(result).not.toBeNull();
    expect(result).toEqual(expect.objectContaining({ name: "Δρ. Παπαδάκη", role: "admin" }));
    expect(verifyToken(result.token)).toEqual(expect.objectContaining({ name: "Δρ. Παπαδάκη", role: "admin" }));
  });

  it("returns null when the PIN does not match any user", async () => {
    await User.create({ name: "Δρ. Παπαδάκη", role: "admin", pinHash: await hashPin("4321"), isActive: true });

    await expect(loginWithPin("0000")).resolves.toBeNull();
  });

  it("ignores inactive users even with a matching PIN", async () => {
    await User.create({ name: "Πρώην Συνεργάτης", role: "assistant", pinHash: await hashPin("9999"), isActive: false });

    await expect(loginWithPin("9999")).resolves.toBeNull();
  });

  it("returns null for an empty or missing PIN without querying matches", async () => {
    await expect(loginWithPin("")).resolves.toBeNull();
    await expect(loginWithPin(undefined)).resolves.toBeNull();
  });
});
