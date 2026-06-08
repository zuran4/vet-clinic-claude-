import { describe, it, expect } from "@jest/globals";

import ApiError from "../apiError.js";

describe("ApiError", () => {
  it("sets statusCode, status alias and defaults", () => {
    const err = new ApiError(500, "Κάτι πήγε στραβά");

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ApiError");
    expect(err.statusCode).toBe(500);
    expect(err.status).toBe(500);
    expect(err.message).toBe("Κάτι πήγε στραβά");
    expect(err.code).toBe("API_ERROR");
    expect(err.isOperational).toBe(true);
  });

  it("does not expose the message to clients by default", () => {
    const err = new ApiError(500, "internal details");

    expect(err.expose).toBe(false);
  });

  it("exposes the message only when explicitly requested", () => {
    const err = new ApiError(400, "invalid email", { expose: true });

    expect(err.expose).toBe(true);
  });

  it("carries an optional details payload", () => {
    const details = { field: "email" };
    const err = new ApiError(400, "invalid", { details });

    expect(err.details).toBe(details);
  });

  describe("static factory helpers", () => {
    it.each([
      ["badRequest", 400, "BAD_REQUEST", "Bad request"],
      ["unauthorized", 401, "UNAUTHORIZED", "Unauthorized"],
      ["forbidden", 403, "FORBIDDEN", "Forbidden"],
      ["notFound", 404, "NOT_FOUND", "Not found"],
      ["conflict", 409, "CONFLICT", "Conflict"],
    ])("%s() builds an exposable %i ApiError with code %s", (factory, statusCode, code, defaultMessage) => {
      const err = ApiError[factory]();

      expect(err.statusCode).toBe(statusCode);
      expect(err.code).toBe(code);
      expect(err.message).toBe(defaultMessage);
      expect(err.expose).toBe(true);
    });

    it("allows overriding the message on factory helpers", () => {
      const err = ApiError.notFound("Ο πελάτης δεν βρέθηκε");

      expect(err.message).toBe("Ο πελάτης δεν βρέθηκε");
      expect(err.statusCode).toBe(404);
    });

    it("forwards details on badRequest and conflict", () => {
      const details = { field: "phone" };

      expect(ApiError.badRequest("invalid", details).details).toBe(details);
      expect(ApiError.conflict("duplicate", details).details).toBe(details);
    });
  });
});
