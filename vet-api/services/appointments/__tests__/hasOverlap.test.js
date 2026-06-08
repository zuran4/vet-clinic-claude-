import { describe, it, expect } from "@jest/globals";

import { hasOverlap, toDateRange } from "../service.js";

const range = (time, duration) => toDateRange("2026-06-10", time, duration);

describe("hasOverlap", () => {
  it("returns false when there are no existing appointments", () => {
    const { start, end } = range("10:00", 30);

    expect(hasOverlap([], start, end)).toBe(false);
  });

  it("detects a fully overlapping appointment", () => {
    const existing = [{ date: "2026-06-10", time: "10:00", duration: 30 }];
    const { start, end } = range("10:00", 30);

    expect(hasOverlap(existing, start, end)).toBe(true);
  });

  it("detects a partially overlapping appointment (new one starts mid-way through existing)", () => {
    const existing = [{ date: "2026-06-10", time: "10:00", duration: 30 }];
    const { start, end } = range("10:15", 30); // 10:15–10:45 overlaps 10:00–10:30

    expect(hasOverlap(existing, start, end)).toBe(true);
  });

  it("detects a partially overlapping appointment (new one ends mid-way through existing)", () => {
    const existing = [{ date: "2026-06-10", time: "10:15", duration: 30 }];
    const { start, end } = range("10:00", 30); // 10:00–10:30 overlaps 10:15–10:45

    expect(hasOverlap(existing, start, end)).toBe(true);
  });

  it("does NOT flag back-to-back appointments as overlapping (end == next start)", () => {
    const existing = [{ date: "2026-06-10", time: "10:00", duration: 30 }];
    const { start, end } = range("10:30", 30); // starts exactly when the previous one ends

    expect(hasOverlap(existing, start, end)).toBe(false);
  });

  it("returns false for appointments on completely different times", () => {
    const existing = [{ date: "2026-06-10", time: "08:00", duration: 30 }];
    const { start, end } = range("14:00", 60);

    expect(hasOverlap(existing, start, end)).toBe(false);
  });

  it("checks against multiple existing appointments and flags if any overlaps", () => {
    const existing = [
      { date: "2026-06-10", time: "08:00", duration: 30 },
      { date: "2026-06-10", time: "11:00", duration: 30 },
      { date: "2026-06-10", time: "10:00", duration: 30 },
    ];
    const { start, end } = range("10:10", 15); // overlaps the 10:00 slot only

    expect(hasOverlap(existing, start, end)).toBe(true);
  });

  it("returns false when given invalid input instead of throwing", () => {
    expect(hasOverlap(null, undefined, undefined)).toBe(false);
    expect(hasOverlap([{ date: "2026-06-10", time: "10:00", duration: 30 }], null, null)).toBe(false);
  });
});
