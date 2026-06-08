import { describe, it, expect, jest } from "@jest/globals";
import mongoose from "mongoose";

import validateObjectId from "../validateObjectId.js";

const buildRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("validateObjectId middleware", () => {
  const validId = new mongoose.Types.ObjectId().toString();

  it.each(["id", "customerId", "petId", "purchaseId"])(
    "calls next() when req.params.%s is a valid ObjectId",
    (paramName) => {
      const req = { params: { [paramName]: validId } };
      const res = buildRes();
      const next = jest.fn();

      validateObjectId(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    }
  );

  it("responds with 400 when no recognised id param is present", () => {
    const req = { params: {} };
    const res = buildRes();
    const next = jest.fn();

    validateObjectId(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "❌ Μη έγκυρο ID" });
  });

  it("responds with 400 when the id is not a valid ObjectId", () => {
    const req = { params: { id: "not-an-object-id" } };
    const res = buildRes();
    const next = jest.fn();

    validateObjectId(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "❌ Μη έγκυρο ID" });
  });
});
