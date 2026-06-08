import { describe, it, expect, jest } from "@jest/globals";

import requireAuth from "../requireAuth.js";
import { signToken } from "../../../utils/jwt.js";

const buildRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("requireAuth middleware", () => {
  it("calls next() and attaches req.user for a valid bearer token", () => {
    const token = signToken({ userId: "u1", name: "Άρης", role: "admin" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = buildRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(expect.objectContaining({ userId: "u1", name: "Άρης", role: "admin" }));
    expect(res.status).not.toHaveBeenCalled();
  });

  it("responds with 401 when no Authorization header is present", () => {
    const req = { headers: {} };
    const res = buildRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Απαιτείται σύνδεση" });
  });

  it("responds with 401 for a malformed Authorization header", () => {
    const req = { headers: { authorization: "Token abc.def" } };
    const res = buildRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("responds with 401 for an invalid or expired token", () => {
    const req = { headers: { authorization: "Bearer not-a-real-token" } };
    const res = buildRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Μη έγκυρο ή ληγμένο token" });
  });
});
