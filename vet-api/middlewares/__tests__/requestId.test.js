import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";

import { connectTestDb, disconnectTestDb } from "../../__tests__/helpers/testDb.js";
import { buildTestApp } from "../../__tests__/helpers/testApp.js";

let app;

beforeAll(async () => {
  await connectTestDb();
  app = buildTestApp();
}, 60_000);

afterAll(disconnectTestDb);

describe("attachRequestId middleware", () => {
  it("sets x-request-id response header on every request", async () => {
    const res = await request(app).get("/api/health");

    expect(res.headers["x-request-id"]).toBeTruthy();
  });

  it("echoes a client-provided x-request-id back unchanged", async () => {
    const clientId = "test-correlation-id-abc123";

    const res = await request(app)
      .get("/api/health")
      .set("x-request-id", clientId);

    expect(res.headers["x-request-id"]).toBe(clientId);
  });

  it("generates a UUID when no x-request-id header is sent", async () => {
    const res = await request(app).get("/api/health");

    const id = res.headers["x-request-id"];
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("includes requestId in error responses", async () => {
    const clientId = "err-trace-xyz";

    const res = await request(app)
      .get("/api/customers/not-a-valid-id")
      .set("x-request-id", clientId);

    expect(res.status).toBe(400);
    expect(res.body.error.requestId).toBe(clientId);
  });
});
