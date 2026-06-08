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

describe("POST /api/products/export", () => {
  it("consumes stock FIFO across batches and persists the result", async () => {
    const product = await Product.create({
      name: "Παρακεταμόλη",
      category: "Φάρμακο",
      batches: [
        { batchNumber: "LATE", quantity: 10, expirationDate: "2027-01-01" },
        { batchNumber: "EARLY", quantity: 6, expirationDate: "2026-01-01" },
      ],
    });
    expect(product.quantity).toBe(16);

    const res = await request(app)
      .post("/api/products/export")
      .send({ productId: product._id.toString(), quantity: 8 });

    expect(res.status).toBe(200);
    expect(res.body.product.quantity).toBe(8);

    const reloaded = await Product.findById(product._id);
    expect(reloaded.quantity).toBe(8);
    // EARLY (closer expiration) should be exhausted and removed first, LATE keeps the remainder
    expect(reloaded.batches).toHaveLength(1);
    expect(reloaded.batches[0].batchNumber).toBe("LATE");
    expect(reloaded.batches[0].quantity).toBe(8);
  });

  it("decrements `quantity` directly when the product has no batches", async () => {
    const product = await Product.create({ name: "Σαμπουάν", category: "Άλλο", quantity: 20 });

    const res = await request(app)
      .post("/api/products/export")
      .send({ productId: product._id.toString(), quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.product.quantity).toBe(15);
  });

  it("rejects an export that exceeds available stock with 409 and changes nothing", async () => {
    const product = await Product.create({
      name: "Αντιπαρασιτικό",
      category: "Φάρμακο",
      batches: [{ batchNumber: "X1", quantity: 3, expirationDate: "2026-01-01" }],
    });

    const res = await request(app)
      .post("/api/products/export")
      .send({ productId: product._id.toString(), quantity: 5 });

    expect(res.status).toBe(409);

    const reloaded = await Product.findById(product._id);
    expect(reloaded.quantity).toBe(3);
    expect(reloaded.batches).toHaveLength(1);
    expect(reloaded.batches[0].quantity).toBe(3);
  });

  it("returns 400 for a malformed payload (missing quantity)", async () => {
    const product = await Product.create({ name: "Γάντια", category: "Άλλο", quantity: 10 });

    const res = await request(app).post("/api/products/export").send({ productId: product._id.toString() });

    expect(res.status).toBe(400);
  });

  it("returns 404 for a well-formed but non-existent productId", async () => {
    const res = await request(app)
      .post("/api/products/export")
      .send({ productId: "60f1f7a2c2a4f5b1d8e2a111", quantity: 1 });

    expect(res.status).toBe(404);
  });
});
