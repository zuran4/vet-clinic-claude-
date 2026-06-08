import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";

import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/testDb.js";
import { buildTestApp } from "../helpers/testApp.js";
import Product from "../../models/Product.js";

let app;

beforeAll(async () => {
  await connectTestDb();
  app = buildTestApp();
}, 60_000);

afterAll(disconnectTestDb);
beforeEach(clearCollections);

// ─── CRUD ────────────────────────────────────────────────────────────────────

describe("GET /api/products", () => {
  it("returns all products sorted by name", async () => {
    await Product.create([
      { name: "Ωμέγα-3", category: "Άλλο", quantity: 5 },
      { name: "Αμοξικιλλίνη", category: "Φάρμακο", quantity: 10 },
    ]);

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body.map((p) => p.name)).toEqual(["Αμοξικιλλίνη", "Ωμέγα-3"]);
  });

  it("filters by search term (name, category, barcode)", async () => {
    await Product.create([
      { name: "Φάρμακο Α", category: "Φάρμακο" },
      { name: "Τροφή Β", category: "Τροφή" },
    ]);

    const res = await request(app).get("/api/products").query({ search: "Τροφή" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Τροφή Β");
  });
});

describe("GET /api/products/:id", () => {
  it("returns the product for a valid existing id", async () => {
    const product = await Product.create({ name: "Βιταμίνη D3", category: "Άλλο", quantity: 8 });

    const res = await request(app).get(`/api/products/${product._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Βιταμίνη D3");
    expect(res.body.quantity).toBe(8);
  });

  it("returns 404 for a well-formed but non-existent id", async () => {
    const res = await request(app).get("/api/products/64b000000000000000000000");

    expect(res.status).toBe(404);
  });

  it("returns 400 for a malformed id", async () => {
    const res = await request(app).get("/api/products/not-an-id");

    expect(res.status).toBe(400);
  });
});

describe("POST /api/products", () => {
  it("creates a product and persists it", async () => {
    const res = await request(app).post("/api/products").send({
      name: "Prednisolone 5mg",
      category: "Φάρμακο",
      quantity: 50,
      threshold: 10,
      retailPrice: 4.5,
    });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Prednisolone 5mg");
    expect(await Product.countDocuments({})).toBe(1);
  });

  it("rejects a payload missing the required name", async () => {
    const res = await request(app).post("/api/products").send({ category: "Φάρμακο" });

    expect(res.status).toBe(400);
    expect(await Product.countDocuments({})).toBe(0);
  });

  it("rejects a payload with an invalid category", async () => {
    const res = await request(app).post("/api/products").send({ name: "Τεστ", category: "ΆκυρηΚατηγορία" });

    expect(res.status).toBe(400);
  });
});

describe("PUT /api/products/:id", () => {
  it("updates a product and returns the updated document", async () => {
    const product = await Product.create({ name: "Τροφή Α", category: "Τροφή", quantity: 20 });

    const res = await request(app)
      .put(`/api/products/${product._id.toString()}`)
      .send({ name: "Τροφή Α Premium", quantity: 25 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Τροφή Α Premium");
    expect(res.body.quantity).toBe(25);
  });

  it("returns 404 when the product does not exist", async () => {
    const res = await request(app)
      .put("/api/products/64b000000000000000000000")
      .send({ name: "Δεν Υπάρχω" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/products/:id", () => {
  it("deletes an existing product", async () => {
    const product = await Product.create({ name: "Προς Διαγραφή", category: "Άλλο" });

    const res = await request(app).delete(`/api/products/${product._id.toString()}`);

    expect(res.status).toBe(200);
    expect(await Product.findById(product._id)).toBeNull();
  });

  it("returns 404 when the product does not exist", async () => {
    const res = await request(app).delete("/api/products/64b000000000000000000000");

    expect(res.status).toBe(404);
  });
});

// ─── Bulk import ─────────────────────────────────────────────────────────────

describe("POST /api/products/import", () => {
  it("inserts valid rows and reports errors for invalid ones", async () => {
    const res = await request(app).post("/api/products/import").send({
      products: [
        { name: "Amoxicillin 250mg", category: "Φάρμακο", quantity: "20", threshold: "5" },
        { name: "X", category: "Φάρμακο" },
        { name: "Τροφή Premium", category: "τροφή" },
      ],
    });

    expect(res.status).toBe(200);
    expect(res.body.inserted).toBe(2);
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].reason).toMatch(/όνομα/i);

    const products = await Product.find({}).lean();
    expect(products).toHaveLength(2);
    // category normalisation: "τροφή" → "Τροφή"
    expect(products.find((p) => p.name === "Τροφή Premium").category).toBe("Τροφή");
  });

  it("returns 400 when the products array is missing or empty", async () => {
    const res = await request(app).post("/api/products/import").send({});

    expect(res.status).toBe(400);
  });
});

// ─── Batch operations ────────────────────────────────────────────────────────

describe("GET /api/products/:id/batches", () => {
  it("returns the batches array for a product", async () => {
    const product = await Product.create({
      name: "Παρακεταμόλη",
      category: "Φάρμακο",
      batches: [{ batchNumber: "B1", quantity: 10 }],
    });

    const res = await request(app).get(`/api/products/${product._id.toString()}/batches`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].batchNumber).toBe("B1");
  });
});

describe("PUT /api/products/:id/batches (add)", () => {
  it("adds a new batch and recalculates quantity via the pre-save hook", async () => {
    const product = await Product.create({ name: "Αντιβιοτικό", category: "Φάρμακο", quantity: 0 });

    const res = await request(app)
      .put(`/api/products/${product._id.toString()}/batches`)
      .send({ action: "add", batch: { batchNumber: "LOT-1", quantity: 15 } });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(15);
    expect(res.body.batches).toHaveLength(1);
    expect(res.body.batches[0].batchNumber).toBe("LOT-1");

    const reloaded = await Product.findById(product._id);
    expect(reloaded.quantity).toBe(15);
  });
});

describe("PUT /api/products/:id/batches (update)", () => {
  it("updates a batch quantity and recalculates the product total", async () => {
    const product = await Product.create({
      name: "Σαμπουάν",
      category: "Αξεσουάρ",
      batches: [
        { batchNumber: "B1", quantity: 10 },
        { batchNumber: "B2", quantity: 5 },
      ],
    });
    const batchId = product.batches[0]._id.toString();

    const res = await request(app)
      .put(`/api/products/${product._id.toString()}/batches`)
      .send({ action: "update", batchId, patch: { quantity: 20 } });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(25);
    expect(res.body.batches.find((b) => b._id === batchId).quantity).toBe(20);
  });
});

describe("PUT /api/products/:id/batches (remove)", () => {
  it("removes a batch and recalculates the product total", async () => {
    const product = await Product.create({
      name: "Τροφή Γατών",
      category: "Τροφή",
      batches: [
        { batchNumber: "B1", quantity: 8 },
        { batchNumber: "B2", quantity: 4 },
      ],
    });
    const batchId = product.batches[0]._id.toString();

    const res = await request(app)
      .put(`/api/products/${product._id.toString()}/batches`)
      .send({ action: "remove", batchId });

    expect(res.status).toBe(200);
    expect(res.body.batches).toHaveLength(1);
    expect(res.body.batches[0].batchNumber).toBe("B2");
    expect(res.body.quantity).toBe(4);
  });
});
