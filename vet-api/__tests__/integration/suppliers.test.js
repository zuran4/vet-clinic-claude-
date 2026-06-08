import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";

import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/testDb.js";
import { buildTestApp } from "../helpers/testApp.js";
import Supplier from "../../models/Supplier.js";

let app;

beforeAll(async () => {
  await connectTestDb();
  app = buildTestApp();
}, 60_000);

afterAll(disconnectTestDb);
beforeEach(clearCollections);

describe("GET /api/suppliers", () => {
  it("returns suppliers sorted by name", async () => {
    await Supplier.create([{ name: "Ζήτα Α.Ε." }, { name: "Άλφα Α.Ε." }, { name: "Βήτα Α.Ε." }]);

    const res = await request(app).get("/api/suppliers");

    expect(res.status).toBe(200);
    expect(res.body.map((s) => s.name)).toEqual(["Άλφα Α.Ε.", "Βήτα Α.Ε.", "Ζήτα Α.Ε."]);
  });
});

describe("POST /api/suppliers", () => {
  it("creates a supplier keeping only allowed fields", async () => {
    const res = await request(app).post("/api/suppliers").send({
      name: "Προμηθευτής Α",
      contact: "Νίκος",
      phone: "2101234567",
      email: "info@supplier.gr",
      website: "https://supplier.gr",
      address: "Αθήνα",
      notes: "Αξιόπιστος",
      role: "admin", // δεν είναι στη λίστα ALLOWED — δεν πρέπει να περάσει (mass-assignment)
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({ name: "Προμηθευτής Α", contact: "Νίκος", phone: "2101234567" })
    );
    expect(res.body.role).toBeUndefined();

    const stored = await Supplier.findOne({ name: "Προμηθευτής Α" });
    expect(stored).not.toBeNull();
    expect(stored.toObject().role).toBeUndefined();
  });

  it("rejects a payload without a name", async () => {
    const res = await request(app).post("/api/suppliers").send({ contact: "Χωρίς όνομα" });

    expect(res.status).toBe(400);
    expect(await Supplier.countDocuments({})).toBe(0);
  });
});

describe("POST /api/suppliers/import", () => {
  it("bulk-imports valid rows and reports errors for invalid ones", async () => {
    const res = await request(app)
      .post("/api/suppliers/import")
      .send({
        suppliers: [
          { name: "Καλός Προμηθευτής", phone: "2101111111" },
          { contact: "Χωρίς όνομα" },
          { name: "Άλλος Προμηθευτής", email: "b@example.com" },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.inserted).toBe(2);
    expect(res.body.errors).toHaveLength(1);
    expect(await Supplier.countDocuments({})).toBe(2);
  });

  it("rejects an empty or missing list", async () => {
    const res = await request(app).post("/api/suppliers/import").send({ suppliers: [] });

    expect(res.status).toBe(400);
  });
});

describe("PUT /api/suppliers/:id", () => {
  it("updates an existing supplier", async () => {
    const supplier = await Supplier.create({ name: "Παλιό Όνομα" });

    const res = await request(app)
      .put(`/api/suppliers/${supplier._id.toString()}`)
      .send({ name: "Νέο Όνομα", phone: "2109999999" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Νέο Όνομα");
    expect(res.body.phone).toBe("2109999999");
  });

  it("returns 404 when the supplier does not exist", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).put(`/api/suppliers/${missingId}`).send({ name: "Φάντασμα" });

    expect(res.status).toBe(404);
  });

  it("rejects an update without a name", async () => {
    const supplier = await Supplier.create({ name: "Έχει Όνομα" });

    const res = await request(app)
      .put(`/api/suppliers/${supplier._id.toString()}`)
      .send({ name: "" });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/suppliers/:id", () => {
  it("deletes an existing supplier", async () => {
    const supplier = await Supplier.create({ name: "Προς Διαγραφή" });

    const res = await request(app).delete(`/api/suppliers/${supplier._id.toString()}`);

    expect(res.status).toBe(200);
    expect(await Supplier.findById(supplier._id)).toBeNull();
  });
});
