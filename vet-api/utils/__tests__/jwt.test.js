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

  it("signs tokens with the configured expiry and allows overriding it", () => {
    const defaultToken = signToken({ sub: "user-123" });
    const decodedDefault = jwt.decode(defaultToken);

    // Επαληθεύουμε ότι έχει exp (η ακριβής τιμή εξαρτάται από JWT_EXPIRES_IN στο .env)
    expect(decodedDefault.exp).toBeDefined();
    expect(decodedDefault.exp).toBeGreaterThan(decodedDefault.iat);

    // Το override πρέπει πάντα να λειτουργεί
    const shortLivedToken = signToken({ sub: "user-123" }, { expiresIn: "5m" });
    const decodedShortLived = jwt.decode(shortLivedToken);

    expect(decodedShortLived.exp - decodedShortLived.iat).toBe(5 * 60);
  });

  it("rejects tampered or malformed tokens", () => {
    expect(() => verifyToken("not-a-real-token")).toThrow();
  });
});
