import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";

import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/testDb.js";
import { buildAuthTestApp } from "../helpers/testApp.js";
import { hashPin } from "../../services/auth/pinCrypto.js";
import { signToken } from "../../utils/jwt.js";
import User from "../../models/User.js";

let app;

beforeAll(async () => {
  await connectTestDb();
  app = buildAuthTestApp();
}, 60_000);

afterAll(disconnectTestDb);
beforeEach(clearCollections);

describe("POST /api/auth/login", () => {
  it("returns a token and profile for a correct PIN", async () => {
    await User.create({ name: "Δρ. Παπαδάκη", role: "admin", pinHash: await hashPin("4321"), isActive: true });

    const res = await request(app).post("/api/auth/login").send({ pin: "4321" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({ token: expect.any(String), name: "Δρ. Παπαδάκη", role: "admin" })
    );
  });

  it("responds with 401 for a wrong PIN", async () => {
    await User.create({ name: "Δρ. Παπαδάκη", role: "admin", pinHash: await hashPin("4321"), isActive: true });

    const res = await request(app).post("/api/auth/login").send({ pin: "0000" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Μη έγκυρα στοιχεία" });
  });

  it("responds with 400 when the PIN fails validation (too short)", async () => {
    const res = await request(app).post("/api/auth/login").send({ pin: "12" });

    expect(res.status).toBe(400);
  });

  it("responds with 400 when the PIN is missing entirely", async () => {
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the authenticated user payload for a valid token", async () => {
    const token = signToken({ userId: "u1", name: "Δρ. Παπαδάκη", role: "admin" });

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ userId: "u1", name: "Δρ. Παπαδάκη", role: "admin" }));
  });

  it("responds with 401 when no token is provided", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
  });

  it("responds with 401 for an invalid token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer garbage-token");

    expect(res.status).toBe(401);
  });
});

describe("login → me end-to-end flow", () => {
  it("allows a freshly issued token to access the protected /me endpoint", async () => {
    await User.create({ name: "Νέος Χρήστης", role: "assistant", pinHash: await hashPin("5678"), isActive: true });

    const loginRes = await request(app).post("/api/auth/login").send({ pin: "5678" });
    expect(loginRes.status).toBe(200);

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body).toEqual(expect.objectContaining({ name: "Νέος Χρήστης", role: "assistant" }));
  });
});
