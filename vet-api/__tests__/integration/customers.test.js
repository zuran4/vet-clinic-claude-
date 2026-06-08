import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";

import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/testDb.js";
import { buildTestApp } from "../helpers/testApp.js";
import Customer from "../../models/Customer.js";
import Product from "../../models/Product.js";

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

describe("POST /api/customers/:id/purchases", () => {
  it("consumes batches via FIFO regardless of product category (not just 'Τροφή')", async () => {
    // Regression: η λογική παλαιότερα εφάρμοζε FIFO μόνο για κατηγορία "Τροφή",
    // αλλιώς μείωνε απευθείας το product.quantity — τιμή που το pre("save") hook
    // του Product την αντικαθιστά πάντα με το άθροισμα των batches, αν υπάρχουν.
    // Αποτέλεσμα: για προϊόντα άλλης κατηγορίας με batches, το απόθεμα ποτέ δεν μειωνόταν.
    const customer = await Customer.create({ name: "Αγοραστής Δ.", phone: "6900009999" });
    const product = await Product.create({
      name: "Αντιβιοτικό Σκύλου",
      category: "Φάρμακο",
      batches: [
        { batchNumber: "B1", quantity: 10, expirationDate: new Date("2026-01-01") },
        { batchNumber: "B2", quantity: 10, expirationDate: new Date("2026-06-01") },
      ],
    });

    const res = await request(app)
      .post(`/api/customers/${customer._id.toString()}/purchases`)
      .send({ products: [{ product: product._id.toString(), quantity: 6 }] });

    expect(res.status).toBe(201);

    const reloaded = await Product.findById(product._id);
    expect(reloaded.quantity).toBe(14);
    expect(reloaded.batches[0].quantity).toBe(4);
    expect(reloaded.batches[1].quantity).toBe(10);
  });

  it("rejects the purchase when stock is insufficient", async () => {
    const customer = await Customer.create({ name: "Αγοραστής Ε.", phone: "6900001212" });
    const product = await Product.create({ name: "Σπάνιο Φάρμακο", category: "Φάρμακο", quantity: 2 });

    const res = await request(app)
      .post(`/api/customers/${customer._id.toString()}/purchases`)
      .send({ products: [{ product: product._id.toString(), quantity: 5 }] });

    expect(res.status).toBe(409);

    const reloaded = await Product.findById(product._id);
    expect(reloaded.quantity).toBe(2);
  });
});
