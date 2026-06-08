import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";

import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/testDb.js";
import { buildTestApp } from "../helpers/testApp.js";
import Customer from "../../models/Customer.js";
import Product from "../../models/Product.js";
import Purchase from "../../models/Purchase.js";

let app;

beforeAll(async () => {
  await connectTestDb();
  app = buildTestApp();
}, 60_000);

afterAll(disconnectTestDb);
beforeEach(clearCollections);

describe("POST /api/purchases", () => {
  it("decrements stock and records the purchase", async () => {
    const customer = await Customer.create({ name: "Αγοραστής Α.", phone: "6900004444" });
    const product = await Product.create({ name: "Τροφή Σκύλου", category: "Τροφή", quantity: 20 });

    const res = await request(app)
      .post("/api/purchases")
      .send({ customerId: customer._id.toString(), items: [{ productId: product._id.toString(), quantity: 5 }] });

    expect(res.status).toBe(200);
    expect(res.body.purchase).toEqual(
      expect.objectContaining({ customer: customer._id.toString() })
    );

    const reloadedProduct = await Product.findById(product._id);
    expect(reloadedProduct.quantity).toBe(15);

    const stored = await Purchase.findOne({ customer: customer._id });
    expect(stored).not.toBeNull();
    expect(stored.items).toHaveLength(1);
    expect(stored.items[0]).toEqual(expect.objectContaining({ name: "Τροφή Σκύλου", quantity: 5 }));
  });

  it("rejects a payload missing customerId or items", async () => {
    const res = await request(app).post("/api/purchases").send({ items: [] });

    expect(res.status).toBe(400);
    expect(await Purchase.countDocuments({})).toBe(0);
  });

  it("returns 404 when the customer does not exist", async () => {
    const product = await Product.create({ name: "Σαμπουάν", category: "Αξεσουάρ", quantity: 10 });
    const missingCustomerId = "64b000000000000000000000";

    const res = await request(app)
      .post("/api/purchases")
      .send({ customerId: missingCustomerId, items: [{ productId: product._id.toString(), quantity: 1 }] });

    expect(res.status).toBe(404);
    expect(await Purchase.countDocuments({})).toBe(0);
  });

  it("returns 404 when a product in the items list does not exist", async () => {
    const customer = await Customer.create({ name: "Αγοραστής Β.", phone: "6900005555" });
    const missingProductId = "64b000000000000000000000";

    const res = await request(app)
      .post("/api/purchases")
      .send({ customerId: customer._id.toString(), items: [{ productId: missingProductId, quantity: 1 }] });

    expect(res.status).toBe(404);
    expect(await Purchase.countDocuments({})).toBe(0);
  });

  it("rejects the purchase when stock is insufficient and leaves quantity unchanged", async () => {
    const customer = await Customer.create({ name: "Αγοραστής Γ.", phone: "6900006666" });
    const product = await Product.create({ name: "Σπάνιο Φάρμακο", category: "Φάρμακο", quantity: 2 });

    const res = await request(app)
      .post("/api/purchases")
      .send({ customerId: customer._id.toString(), items: [{ productId: product._id.toString(), quantity: 5 }] });

    expect(res.status).toBe(400);

    const reloaded = await Product.findById(product._id);
    expect(reloaded.quantity).toBe(2);
    expect(await Purchase.countDocuments({})).toBe(0);
  });
});
