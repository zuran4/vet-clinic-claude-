import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";

import { connectTestDb, disconnectTestDb, clearCollections } from "../../__tests__/helpers/testDb.js";
import Product from "../Product.js";

beforeAll(connectTestDb, 60_000);
afterAll(disconnectTestDb);
beforeEach(clearCollections);

describe("Product model", () => {
  it("calculatedQuantity falls back to `quantity` when there are no batches", async () => {
    const product = await Product.create({ name: "Σαμπουάν", category: "Άλλο", quantity: 12 });

    expect(product.calculatedQuantity).toBe(12);
  });

  it("calculatedQuantity sums batch quantities when batches exist", async () => {
    const product = await Product.create({
      name: "Αμοξικιλλίνη",
      category: "Φάρμακο",
      quantity: 0,
      batches: [
        { batchNumber: "A1", quantity: 10 },
        { batchNumber: "A2", quantity: 5 },
      ],
    });

    expect(product.calculatedQuantity).toBe(15);
  });

  it("syncs `quantity` from batch totals on save", async () => {
    const product = await Product.create({
      name: "Τροφή σκύλου",
      category: "Τροφή",
      quantity: 999, // intentionally wrong — should be overwritten by the pre-save hook
      batches: [{ batchNumber: "B1", quantity: 7 }, { batchNumber: "B2", quantity: 3 }],
    });

    expect(product.quantity).toBe(10);

    const reloaded = await Product.findById(product._id);
    expect(reloaded.quantity).toBe(10);
  });

  it("re-syncs `quantity` after findOneAndUpdate changes the batches", async () => {
    const product = await Product.create({
      name: "Βιταμίνες",
      category: "Φάρμακο",
      batches: [{ batchNumber: "V1", quantity: 20 }],
    });
    expect(product.quantity).toBe(20);

    await Product.findOneAndUpdate(
      { _id: product._id },
      { $set: { "batches.0.quantity": 6 } },
      { new: true }
    );

    const reloaded = await Product.findById(product._id);
    expect(reloaded.quantity).toBe(6);
  });

  it("includes virtuals when serialised to JSON", async () => {
    const product = await Product.create({ name: "Λουρί", category: "Αξεσουάρ", quantity: 4 });

    const json = product.toJSON();

    expect(json.calculatedQuantity).toBe(4);
  });
});
