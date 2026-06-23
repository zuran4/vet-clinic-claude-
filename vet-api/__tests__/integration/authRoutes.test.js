import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";

import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/testDb.js";
import { buildAuthTestApp } from "../helpers/testApp.js";
import { signToken } from "../../utils/jwt.js";

let app;

beforeAll(async () => {
  await connectTestDb();
  app = buildAuthTestApp();
}, 60_000);

afterAll(disconnectTestDb);
beforeEach(clearCollections);

// Το full login flow απαιτεί admin DB (Tenant model) + tenant connection.
// Στα unit tests χρησιμοποιούμε MongoMemoryServer χωρίς admin DB,
// οπότε ελέγχουμε μόνο τη συμπεριφορά του controller για άκυρα inputs.

describe("POST /api/auth/login — validation", () => {
  it("returns 400 when clinicId is missing", async () => {
    const res = await request(app).post("/api/auth/login").send({ pin: "1234" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when pin is missing", async () => {
    const res = await request(app).post("/api/auth/login").send({ clinicId: "test" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when both fields are missing", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the authenticated user payload for a valid token", async () => {
    const token = signToken({ userId: "u1", name: "Δρ. Παπαδάκη", role: "admin", clinicId: "test" });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ userId: "u1", name: "Δρ. Παπαδάκη", role: "admin" }));
  });

  it("responds with 401 when no token is provided", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("responds with 401 for an invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer garbage-token");
    expect(res.status).toBe(401);
  });
});
