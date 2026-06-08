import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";

import { connectTestDb, disconnectTestDb } from "../helpers/testDb.js";
import { buildTestApp } from "../helpers/testApp.js";

let app;

beforeAll(async () => {
  await connectTestDb();
  app = buildTestApp();
}, 60_000);

afterAll(disconnectTestDb);

describe("GET /api/health", () => {
  it("returns 200 with status ok when the database is connected", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.checks.db).toBe("connected");
  });

  it("includes version, uptime and timestamp in the response", async () => {
    const res = await request(app).get("/api/health");

    expect(res.body.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(typeof res.body.uptime).toBe("number");
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
  });

  it("does not require an Authorization header", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).not.toBe(401);
  });
});
