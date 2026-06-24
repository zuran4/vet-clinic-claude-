import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";

import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/testDb.js";
import { loginWithPin } from "../../services/auth/authService.js";
import { _setForTest } from "../../services/adminConnection.js";
import { _setConnectionForTest } from "../../services/tenantConnectionManager.js";
import { tenantSchema } from "../../models/Tenant.js";
import { hashPin } from "../../services/auth/pinCrypto.js";
import { verifyToken } from "../../utils/jwt.js";
import User from "../../models/User.js";

const CLINIC_ID = "test";
let Tenant;

beforeAll(async () => {
  await connectTestDb();
  // Χρησιμοποιούμε το MongoMemoryServer connection ως admin + tenant DB
  Tenant = mongoose.models.Tenant ?? mongoose.model("Tenant", tenantSchema);
  _setForTest(mongoose.connection, Tenant);
  _setConnectionForTest(CLINIC_ID, mongoose.connection);
}, 60_000);

afterAll(disconnectTestDb);
beforeEach(clearCollections);

async function createTestTenant() {
  return Tenant.create({
    clinicId: CLINIC_ID,
    clinicName: "Test Clinic",
    dbName: `vetClinic_${CLINIC_ID}`,
    isActive: true,
  });
}

describe("loginWithPin", () => {
  it("returns a signed token plus profile when the PIN matches an active user", async () => {
    await createTestTenant();
    await User.create({ name: "Δρ. Παπαδάκη", role: "admin", pinHash: await hashPin("4321"), isActive: true });

    const result = await loginWithPin(CLINIC_ID, "4321");

    expect(result).not.toBeNull();
    expect(result).toEqual(
      expect.objectContaining({ name: "Δρ. Παπαδάκη", role: "admin", clinicId: CLINIC_ID })
    );
    expect(verifyToken(result.token)).toEqual(
      expect.objectContaining({ name: "Δρ. Παπαδάκη", role: "admin", clinicId: CLINIC_ID })
    );
  });

  it("returns null when the PIN does not match any user", async () => {
    await createTestTenant();
    await User.create({ name: "Δρ. Παπαδάκη", role: "admin", pinHash: await hashPin("4321"), isActive: true });

    await expect(loginWithPin(CLINIC_ID, "0000")).resolves.toBeNull();
  });

  it("ignores inactive users even with a matching PIN", async () => {
    await createTestTenant();
    await User.create({
      name: "Πρώην Συνεργάτης",
      role: "assistant",
      pinHash: await hashPin("9999"),
      isActive: false,
    });

    await expect(loginWithPin(CLINIC_ID, "9999")).resolves.toBeNull();
  });

  it("returns null when clinicId is missing", async () => {
    await expect(loginWithPin(undefined, "1234")).resolves.toBeNull();
    await expect(loginWithPin(null, "1234")).resolves.toBeNull();
  });

  it("returns null for an empty or missing PIN", async () => {
    await expect(loginWithPin(CLINIC_ID, "")).resolves.toBeNull();
    await expect(loginWithPin(CLINIC_ID, undefined)).resolves.toBeNull();
  });

  it("returns null when the clinic is not found or inactive", async () => {
    // Δεν υπάρχει Tenant record — πρέπει να επιστρέψει null
    await User.create({ name: "Δρ. Τεστ", role: "admin", pinHash: await hashPin("1111"), isActive: true });

    await expect(loginWithPin(CLINIC_ID, "1111")).resolves.toBeNull();
  });
});
