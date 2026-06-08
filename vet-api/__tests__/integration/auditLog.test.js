import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";

import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/testDb.js";
import { buildTestApp } from "../helpers/testApp.js";
import AuditLog from "../../models/AuditLog.js";
import Customer from "../../models/Customer.js";

let adminApp;
let vetApp;

beforeAll(async () => {
  await connectTestDb();
  adminApp = buildTestApp();
  vetApp = buildTestApp({ user: { userId: "vet-1", role: "vet", name: "Dr. Vet" } });
}, 60_000);

afterAll(disconnectTestDb);

beforeEach(clearCollections);

// Το recordAudit είναι fire-and-forget (δεν γίνεται await μέσα στο middleware),
// οπότε η εγγραφή στη DB μπορεί να ολοκληρωθεί λίγο μετά την HTTP απάντηση.
async function waitForAuditLog(query, { timeoutMs = 2000, intervalMs = 25 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const found = await AuditLog.findOne(query).lean();
    if (found) return found;
    if (Date.now() > deadline) return null;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

describe("audit trail (end-to-end)", () => {
  it("persists a CREATE entry with request metadata when a customer is created", async () => {
    const res = await request(adminApp)
      .post("/api/customers")
      .send({ name: "Νίκος Αυδιτόρ", phone: "6944444444" });

    expect(res.status).toBe(201);

    const entry = await waitForAuditLog({ action: "CREATE", resource: "customers" });

    expect(entry).not.toBeNull();
    expect(entry).toEqual(
      expect.objectContaining({
        action: "CREATE",
        resource: "customers",
        method: "POST",
        statusCode: 201,
        userId: "tester",
        userRole: "admin",
      })
    );
  });

  it("does not persist an entry for a failed (validation) request", async () => {
    const res = await request(adminApp).post("/api/customers").send({ name: "Χωρίς τηλέφωνο" });

    expect(res.status).toBe(400);

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(await AuditLog.countDocuments({ resource: "customers" })).toBe(0);
  });

  it("does not persist an entry for read-only GET requests", async () => {
    await Customer.create({ name: "Σταύρος Μ.", phone: "6955555555" });

    const res = await request(adminApp).get("/api/customers");
    expect(res.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(await AuditLog.countDocuments({ resource: "customers", action: "GET" })).toBe(0);
  });

  it("records the resourceId for an UPDATE on a specific document", async () => {
    const created = await Customer.create({ name: "Ελένη Β.", phone: "6966666666" });

    const res = await request(adminApp)
      .put(`/api/customers/${created._id.toString()}`)
      .send({ name: "Ελένη Β. Ενημερωμένη" });

    expect(res.status).toBe(200);

    const entry = await waitForAuditLog({ action: "UPDATE", resourceId: created._id.toString() });

    expect(entry).not.toBeNull();
    expect(entry).toEqual(
      expect.objectContaining({
        action: "UPDATE",
        resource: "customers",
        resourceId: created._id.toString(),
      })
    );
  });
});

describe("GET /api/audit", () => {
  it("returns 403 for non-admin users", async () => {
    const res = await request(vetApp).get("/api/audit");

    expect(res.status).toBe(403);
  });

  it("returns a paginated list of entries for admins", async () => {
    await AuditLog.create([
      { action: "CREATE", resource: "customers", statusCode: 201 },
      { action: "UPDATE", resource: "appointments", statusCode: 200 },
      { action: "DELETE", resource: "products", statusCode: 200 },
    ]);

    const res = await request(adminApp).get("/api/audit").query({ page: 1, pageSize: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(3);
    expect(res.body.totalPages).toBe(2);
  });

  it("filters entries by action and resource", async () => {
    await AuditLog.create([
      { action: "CREATE", resource: "customers", statusCode: 201 },
      { action: "CREATE", resource: "appointments", statusCode: 201 },
      { action: "DELETE", resource: "customers", statusCode: 200 },
    ]);

    const res = await request(adminApp)
      .get("/api/audit")
      .query({ action: "CREATE", resource: "customers" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toEqual(
      expect.objectContaining({ action: "CREATE", resource: "customers" })
    );
  });
});
