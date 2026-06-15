import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";

import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/testDb.js";
import { buildTestApp } from "../helpers/testApp.js";
import Settings from "../../models/Settings.js";

let app;

beforeAll(async () => {
  await connectTestDb();
  app = buildTestApp();
}, 60_000);

afterAll(disconnectTestDb);
beforeEach(clearCollections);

describe("GET /api/settings", () => {
  it("δεν επιστρέφει ποτέ το πραγματικό SMTP password", async () => {
    await Settings.create({
      emailConfig: { host: "smtp.gmail.com", user: "clinic@gmail.com", password: "super-secret" },
    });

    const res = await request(app).get("/api/settings");

    expect(res.status).toBe(200);
    expect(res.body.emailConfig.password).toBe("");
    expect(res.body.emailConfig.user).toBe("clinic@gmail.com");
  });
});

describe("PUT /api/settings", () => {
  it("διατηρεί το αποθηκευμένο password όταν ο client στείλει κενό", async () => {
    await Settings.create({
      emailConfig: { host: "smtp.gmail.com", user: "clinic@gmail.com", password: "super-secret" },
    });

    const res = await request(app)
      .put("/api/settings")
      .send({ emailConfig: { host: "smtp.gmail.com", user: "clinic@gmail.com", password: "" } });

    expect(res.status).toBe(200);
    expect(res.body.emailConfig.password).toBe(""); // δεν επιστρέφεται ποτέ στον client

    const stored = await Settings.findOne();
    expect(stored.emailConfig.password).toBe("super-secret"); // αλλά παραμένει στη DB
  });

  it("ενημερώνει το password όταν ο client στείλει νέη τιμή", async () => {
    await Settings.create({
      emailConfig: { host: "smtp.gmail.com", user: "clinic@gmail.com", password: "old-secret" },
    });

    const res = await request(app)
      .put("/api/settings")
      .send({ emailConfig: { host: "smtp.gmail.com", user: "clinic@gmail.com", password: "new-secret" } });

    expect(res.status).toBe(200);
    expect(res.body.emailConfig.password).toBe("");

    const stored = await Settings.findOne();
    expect(stored.emailConfig.password).toBe("new-secret");
  });
});
