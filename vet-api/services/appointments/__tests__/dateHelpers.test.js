import { describe, it, expect } from "@jest/globals";
import dayjs from "dayjs";

import { calculateEndTime, toDateRange } from "../service.js";

describe("calculateEndTime", () => {
  it("adds the duration in minutes to the start time", () => {
    const start = dayjs("2026-06-10T10:00");

    const end = calculateEndTime(start, 30);

    expect(end.format("HH:mm")).toBe("10:30");
  });

  it("rolls over to the next hour correctly", () => {
    const start = dayjs("2026-06-10T10:45");

    const end = calculateEndTime(start, 30);

    expect(end.format("YYYY-MM-DD HH:mm")).toBe("2026-06-10 11:15");
  });

  it("returns null when start or duration is missing", () => {
    expect(calculateEndTime(null, 30)).toBeNull();
    expect(calculateEndTime(dayjs("2026-06-10T10:00"), null)).toBeNull();
    expect(calculateEndTime(dayjs("2026-06-10T10:00"), 0)).toBeNull();
  });
});

describe("toDateRange", () => {
  it("builds a { start, end } dayjs range from date, time and duration", () => {
    const { start, end } = toDateRange("2026-06-10", "10:00", 45);

    expect(start.format("YYYY-MM-DD HH:mm")).toBe("2026-06-10 10:00");
    expect(end.format("YYYY-MM-DD HH:mm")).toBe("2026-06-10 10:45");
  });

  it("coerces a string duration to a number", () => {
    const { start, end } = toDateRange("2026-06-10", "09:00", "30");

    expect(end.diff(start, "minute")).toBe(30);
  });
});
