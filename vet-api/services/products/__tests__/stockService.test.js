import { describe, it, expect } from "@jest/globals";

import { getProductQuantity, applyFIFO } from "../stockService.js";

describe("getProductQuantity", () => {
  it("sums batch quantities when batches exist", () => {
    const product = { quantity: 999, batches: [{ quantity: 5 }, { quantity: 3 }] };

    expect(getProductQuantity(product)).toBe(8);
  });

  it("falls back to product.quantity when there are no batches", () => {
    expect(getProductQuantity({ quantity: 12, batches: [] })).toBe(12);
    expect(getProductQuantity({ quantity: 7 })).toBe(7);
  });

  it("treats missing/non-numeric quantity as zero", () => {
    expect(getProductQuantity({})).toBe(0);
    expect(getProductQuantity({ quantity: "abc" })).toBe(0);
  });
});

describe("applyFIFO", () => {
  const batch = (batchNumber, quantity, expirationDate) => ({ batchNumber, quantity, expirationDate });

  it("consumes from the earliest-expiring batch first", () => {
    const product = {
      batches: [
        batch("B-LATE", 10, "2027-01-01"),
        batch("B-EARLY", 10, "2026-01-01"),
      ],
    };

    applyFIFO(product, 4);

    const early = product.batches.find((b) => b.batchNumber === "B-EARLY");
    const late = product.batches.find((b) => b.batchNumber === "B-LATE");
    expect(early.quantity).toBe(6);
    expect(late.quantity).toBe(10);
  });

  it("spills over into the next batch once the earliest one is exhausted", () => {
    const product = {
      batches: [
        batch("B-EARLY", 5, "2026-01-01"),
        batch("B-LATE", 10, "2027-01-01"),
      ],
    };

    applyFIFO(product, 8);

    expect(product.batches.find((b) => b.batchNumber === "B-EARLY")).toBeUndefined(); // exhausted -> filtered out
    expect(product.batches.find((b) => b.batchNumber === "B-LATE").quantity).toBe(7);
  });

  it("removes batches that reach zero quantity", () => {
    const product = { batches: [batch("B-EARLY", 5, "2026-01-01"), batch("B-LATE", 5, "2027-01-01")] };

    applyFIFO(product, 5);

    expect(product.batches).toHaveLength(1);
    expect(product.batches[0].batchNumber).toBe("B-LATE");
  });

  it("treats batches without an expiration date as expiring last", () => {
    const product = {
      batches: [
        batch("B-NO-EXPIRY", 10, undefined),
        batch("B-EXPIRES-SOON", 10, "2026-01-01"),
      ],
    };

    applyFIFO(product, 4);

    expect(product.batches.find((b) => b.batchNumber === "B-EXPIRES-SOON").quantity).toBe(6);
    expect(product.batches.find((b) => b.batchNumber === "B-NO-EXPIRY").quantity).toBe(10);
  });

  it("throws a 409 error and leaves nothing oversold when stock is insufficient", () => {
    const product = { batches: [batch("B1", 3, "2026-01-01")] };

    expect(() => applyFIFO(product, 5)).toThrow("Insufficient stock after FIFO");
    try {
      applyFIFO({ batches: [batch("B1", 3, "2026-01-01")] }, 5);
    } catch (err) {
      expect(err.code).toBe(409);
    }
  });
});
