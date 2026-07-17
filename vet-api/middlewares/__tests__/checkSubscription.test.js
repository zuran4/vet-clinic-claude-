import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from "@jest/globals";
import mongoose from "mongoose";

import { connectTestDb, disconnectTestDb, clearCollections } from "../../__tests__/helpers/testDb.js";
import { _setForTest } from "../../services/adminConnection.js";
import { tenantSchema } from "../../models/Tenant.js";
import checkSubscription, { _clearTenantCache } from "../checkSubscription.js";

const CLINIC_ID = "test";
let Tenant;

beforeAll(async () => {
  await connectTestDb();
  Tenant = mongoose.models.Tenant ?? mongoose.model("Tenant", tenantSchema);
  _setForTest(mongoose.connection, Tenant);
}, 60_000);

afterAll(disconnectTestDb);

beforeEach(async () => {
  await clearCollections();
  _clearTenantCache();
});

function buildReq({ method = "GET" } = {}) {
  return { clinicId: CLINIC_ID, method };
}

async function run(req) {
  const next = jest.fn();
  await checkSubscription(req, {}, next);
  return next;
}

describe("checkSubscription middleware", () => {
  it("calls next() for an active clinic on a paid plan with no trialEndsAt", async () => {
    await Tenant.create({ clinicId: CLINIC_ID, clinicName: "Test", dbName: "vetClinic_test", isActive: true, plan: "basic" });

    const next = await run(buildReq());

    expect(next).toHaveBeenCalledWith();
  });

  it("calls next() for a trial clinic still within trialEndsAt", async () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    await Tenant.create({ clinicId: CLINIC_ID, clinicName: "Test", dbName: "vetClinic_test", isActive: true, plan: "trial", trialEndsAt: future });

    const next = await run(buildReq());

    expect(next).toHaveBeenCalledWith();
  });

  it("allows GET requests during the grace period after trial expiry", async () => {
    const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 μέρες πριν, εντός 5-day grace
    await Tenant.create({ clinicId: CLINIC_ID, clinicName: "Test", dbName: "vetClinic_test", isActive: true, plan: "trial", trialEndsAt: past });

    const next = await run(buildReq({ method: "GET" }));

    expect(next).toHaveBeenCalledWith();
  });

  it("blocks mutating requests during the grace period after trial expiry", async () => {
    const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await Tenant.create({ clinicId: CLINIC_ID, clinicName: "Test", dbName: "vetClinic_test", isActive: true, plan: "trial", trialEndsAt: past });

    const next = await run(buildReq({ method: "POST" }));

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("SUBSCRIPTION_GRACE_PERIOD");
  });

  it("blocks everything once the grace period has fully elapsed", async () => {
    const longPast = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 μέρες πριν, εκτός 5-day grace
    await Tenant.create({ clinicId: CLINIC_ID, clinicName: "Test", dbName: "vetClinic_test", isActive: true, plan: "trial", trialEndsAt: longPast });

    const next = await run(buildReq({ method: "GET" }));

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("SUBSCRIPTION_EXPIRED");
  });

  it("blocks an inactive clinic regardless of plan or grace period", async () => {
    await Tenant.create({ clinicId: CLINIC_ID, clinicName: "Test", dbName: "vetClinic_test", isActive: false, plan: "pro" });

    const next = await run(buildReq());

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("TENANT_INACTIVE");
  });

  it("blocks when the tenant record cannot be found", async () => {
    const next = await run(buildReq());

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("TENANT_NOT_FOUND");
  });

  it("returns 401 when req.clinicId is missing", async () => {
    const next = await run({ method: "GET" });

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });
});
