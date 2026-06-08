import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";

import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/testDb.js";
import { buildTestApp } from "../helpers/testApp.js";
import Customer from "../../models/Customer.js";
import Reminder from "../../models/Reminder.js";

let app;

beforeAll(async () => {
  await connectTestDb();
  app = buildTestApp();
}, 60_000);

afterAll(disconnectTestDb);
beforeEach(clearCollections);

describe("POST /api/reminders", () => {
  it("creates a reminder linked to an existing customer", async () => {
    const customer = await Customer.create({ name: "Πελάτης Υ.", phone: "6900001111" });

    const res = await request(app).post("/api/reminders").send({
      customerId: customer._id.toString(),
      reminderDate: "2026-12-01",
      note: "Επανάληψη εμβολίου",
      productNames: ["Εμβόλιο Λύσσας"],
    });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.reminder).toEqual(expect.objectContaining({ note: "Επανάληψη εμβολίου" }));

    const stored = await Reminder.findOne({ customer: customer._id });
    expect(stored).not.toBeNull();
    expect(stored.productNames).toEqual(["Εμβόλιο Λύσσας"]);
  });

  it("rejects a payload missing customerId or reminderDate", async () => {
    const res = await request(app).post("/api/reminders").send({ note: "Χωρίς πελάτη" });

    expect(res.status).toBe(400);
    expect(await Reminder.countDocuments({})).toBe(0);
  });

  it("returns 404 when the customer does not exist", async () => {
    const missingId = "64b000000000000000000000";

    const res = await request(app)
      .post("/api/reminders")
      .send({ customerId: missingId, reminderDate: "2026-12-01" });

    expect(res.status).toBe(404);
  });
});

describe("GET /api/reminders", () => {
  it("returns reminders sorted by date with the customer populated", async () => {
    const customer = await Customer.create({ name: "Πελάτης Ζ.", phone: "6900002222" });

    await Reminder.create([
      { customer: customer._id, reminderDate: new Date("2026-12-10"), note: "Δεύτερο" },
      { customer: customer._id, reminderDate: new Date("2026-11-01"), note: "Πρώτο" },
    ]);

    const res = await request(app).get("/api/reminders");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((r) => r.note)).toEqual(["Πρώτο", "Δεύτερο"]);
    expect(res.body[0].customer).toEqual(expect.objectContaining({ name: "Πελάτης Ζ." }));
  });
});

describe("DELETE /api/reminders/:id", () => {
  it("deletes an existing reminder", async () => {
    const customer = await Customer.create({ name: "Πελάτης Χ.", phone: "6900003333" });
    const reminder = await Reminder.create({ customer: customer._id, reminderDate: new Date("2026-12-01") });

    const res = await request(app).delete(`/api/reminders/${reminder._id.toString()}`);

    expect(res.status).toBe(200);
    expect(await Reminder.findById(reminder._id)).toBeNull();
  });
});
