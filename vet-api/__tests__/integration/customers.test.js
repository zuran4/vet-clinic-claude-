import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";

import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/testDb.js";
import { buildTestApp } from "../helpers/testApp.js";
import Customer from "../../models/Customer.js";

let app;

beforeAll(async () => {
  await connectTestDb();
  app = buildTestApp();
}, 60_000);

afterAll(disconnectTestDb);

beforeEach(clearCollections);

describe("GET /api/customers", () => {
  it("returns a plain list when searching", async () => {
    await Customer.create([
      { name: "Γιάννης Παπαδόπουλος", phone: "6900000001" },
      { name: "Γιώργος Ιωάννου", phone: "6900000002" },
      { name: "Μαρία Νικολάου", phone: "6900000003" },
    ]);

    const res = await request(app).get("/api/customers").query({ search: "Γι" });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toEqual(
      expect.objectContaining({ name: expect.any(String), phone: expect.any(String) })
    );
  });

  it("ignores search terms shorter than 2 characters and falls back to pagination", async () => {
    await Customer.create({ name: "Νίκος Δ.", phone: "6911111111" });

    const res = await request(app).get("/api/customers").query({ search: "Ν" });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(false);
    expect(res.body).toEqual(
      expect.objectContaining({ data: expect.any(Array), total: 1 })
    );
  });

  it("paginates results and clamps pageSize to 50", async () => {
    const customers = Array.from({ length: 12 }, (_, i) => ({
      name: `Πελάτης ${i + 1}`,
      phone: `690000${String(i).padStart(4, "0")}`,
    }));
    await Customer.create(customers);

    const page1 = await request(app).get("/api/customers").query({ page: 1, pageSize: 5 });
    expect(page1.status).toBe(200);
    expect(page1.body.data).toHaveLength(5);
    expect(page1.body.total).toBe(12);
    expect(page1.body.totalPages).toBe(3);

    const clamped = await request(app).get("/api/customers").query({ page: 1, pageSize: 1000 });
    expect(clamped.body.pageSize).toBe(50);
    expect(clamped.body.data.length).toBeLessThanOrEqual(50);
  });
});

describe("POST /api/customers", () => {
  it("creates a customer and persists it", async () => {
    const res = await request(app)
      .post("/api/customers")
      .send({ name: "Ελένη Κωνσταντίνου", phone: "6922222222" });

    expect(res.status).toBe(201);

    const stored = await Customer.findOne({ phone: "6922222222" });
    expect(stored).not.toBeNull();
    expect(stored.name).toBe("Ελένη Κωνσταντίνου");
  });

  it("rejects a payload missing required fields with a validation error", async () => {
    const res = await request(app).post("/api/customers").send({ name: "Χωρίς τηλέφωνο" });

    expect(res.status).toBe(400);
    expect(await Customer.countDocuments({})).toBe(0);
  });
});

describe("GET /api/customers/:id", () => {
  it("returns 400 for a malformed id before hitting the database", async () => {
    const res = await request(app).get("/api/customers/not-a-valid-id");

    expect(res.status).toBe(400);
  });

  it("returns 404 for a well-formed id that does not exist", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/customers/${missingId}`);

    expect(res.status).toBe(404);
  });

  it("returns the customer for a valid existing id", async () => {
    const created = await Customer.create({ name: "Δημήτρης Άλφα", phone: "6933333333" });

    const res = await request(app).get(`/api/customers/${created._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Δημήτρης Άλφα");
  });
});
