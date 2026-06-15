import { describe, it, expect, jest } from "@jest/globals";

import requireRole from "../requireRole.js";

describe("requireRole middleware", () => {
  it("calls next() when req.user.role is in the allowed list", () => {
    const req = { user: { role: "admin" } };
    const next = jest.fn();

    requireRole("admin")(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("calls next(error) with 403 when the role is not allowed", () => {
    const req = { user: { role: "assistant" } };
    const next = jest.fn();

    requireRole("admin")(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  it("calls next(error) with 403 when req.user is missing", () => {
    const req = {};
    const next = jest.fn();

    requireRole("admin")(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it("supports multiple allowed roles", () => {
    const req = { user: { role: "assistant" } };
    const next = jest.fn();

    requireRole("admin", "assistant")(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });
});
