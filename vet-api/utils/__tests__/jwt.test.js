import { describe, it, expect } from "@jest/globals";
import jwt from "jsonwebtoken";

import { signToken, verifyToken } from "../jwt.js";
import config from "../../config/index.js";

describe("jwt utils", () => {
  it("signs a token that can be verified back to the original payload", () => {
    const payload = { sub: "user-123", role: "vet" };

    const token = signToken(payload);
    const decoded = verifyToken(token);

    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.role).toBe(payload.role);
  });

  it("signs tokens using the configured secret", () => {
    const token = signToken({ sub: "user-123" });

    expect(() => jwt.verify(token, config.jwtSecret)).not.toThrow();
    expect(() => jwt.verify(token, "wrong-secret")).toThrow();
  });

  it("defaults to a 12h expiry but allows overriding it", () => {
    const defaultToken = signToken({ sub: "user-123" });
    const decodedDefault = jwt.decode(defaultToken);
    const expectedDefaultTtl = 12 * 60 * 60;

    expect(decodedDefault.exp - decodedDefault.iat).toBe(expectedDefaultTtl);

    const shortLivedToken = signToken({ sub: "user-123" }, { expiresIn: "5m" });
    const decodedShortLived = jwt.decode(shortLivedToken);

    expect(decodedShortLived.exp - decodedShortLived.iat).toBe(5 * 60);
  });

  it("rejects tampered or malformed tokens", () => {
    expect(() => verifyToken("not-a-real-token")).toThrow();
  });
});
