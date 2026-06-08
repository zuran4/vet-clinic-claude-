import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";

import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/testDb.js";
import { buildTestApp } from "../helpers/testApp.js";
import Appointment from "../../models/appointmentModel.js";

let app;

beforeAll(async () => {
  await connectTestDb();
  app = buildTestApp();
}, 60_000);

afterAll(disconnectTestDb);
beforeEach(clearCollections);

const baseAppointment = (overrides = {}) => ({
  date: "2026-06-10",
  time: "10:00",
  clientName: "Γιώργος Παπαδόπουλος",
  animalName: "Ρεξ",
  type: "Εμβολιασμός",
  duration: 30,
  ...overrides,
});

describe("GET /api/appointments", () => {
  it("returns appointments sorted by date and time", async () => {
    await Appointment.create([
      baseAppointment({ time: "14:00", clientName: "Β" }),
      baseAppointment({ time: "09:00", clientName: "Α" }),
    ]);

    const res = await request(app).get("/api/appointments");

    expect(res.status).toBe(200);
    expect(res.body.map((a) => a.clientName)).toEqual(["Α", "Β"]);
  });
});

describe("POST /api/appointments", () => {
  it("creates an appointment when there is no conflict", async () => {
    const res = await request(app).post("/api/appointments").send(baseAppointment());

    expect(res.status).toBe(201);
    expect(await Appointment.countDocuments({})).toBe(1);
  });

  it("rejects payloads that fail validation before checking for conflicts", async () => {
    const res = await request(app).post("/api/appointments").send(baseAppointment({ time: "99:99" }));

    expect(res.status).toBe(400);
    expect(await Appointment.countDocuments({})).toBe(0);
  });

  it("rejects a new appointment that overlaps an existing one for the same doctor", async () => {
    await Appointment.create(baseAppointment({ time: "10:00", duration: 30, doctor: "Δρ. Παπαδάκη" }));

    const res = await request(app)
      .post("/api/appointments")
      .send(baseAppointment({ time: "10:15", duration: 30, doctor: "Δρ. Παπαδάκη" }));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/σύγκρουση/i);
    expect(await Appointment.countDocuments({})).toBe(1);
  });

  it("allows an overlapping time slot for a different doctor", async () => {
    await Appointment.create(baseAppointment({ time: "10:00", duration: 30, doctor: "Δρ. Παπαδάκη" }));

    const res = await request(app)
      .post("/api/appointments")
      .send(baseAppointment({ time: "10:00", duration: 30, doctor: "Δρ. Νικολάου" }));

    expect(res.status).toBe(201);
    expect(await Appointment.countDocuments({})).toBe(2);
  });

  it("allows a back-to-back appointment that starts exactly when the previous one ends", async () => {
    await Appointment.create(baseAppointment({ time: "10:00", duration: 30, doctor: "Δρ. Παπαδάκη" }));

    const res = await request(app)
      .post("/api/appointments")
      .send(baseAppointment({ time: "10:30", duration: 30, doctor: "Δρ. Παπαδάκη" }));

    expect(res.status).toBe(201);
  });
});

describe("PUT /api/appointments/:id", () => {
  it("updates an appointment without conflicting with itself", async () => {
    const appt = await Appointment.create(
      baseAppointment({ time: "10:00", duration: 30, doctor: "Δρ. Παπαδάκη", notes: "αρχικές σημειώσεις" })
    );

    const res = await request(app)
      .put(`/api/appointments/${appt._id.toString()}`)
      .send(baseAppointment({ time: "10:00", duration: 30, doctor: "Δρ. Παπαδάκη", notes: "ενημερωμένες σημειώσεις" }));

    expect(res.status).toBe(200);
    expect(res.body.notes).toBe("ενημερωμένες σημειώσεις");
  });

  it("rejects an update that would now overlap a different existing appointment", async () => {
    await Appointment.create(baseAppointment({ time: "09:00", duration: 30, doctor: "Δρ. Παπαδάκη" }));
    const moving = await Appointment.create(baseAppointment({ time: "12:00", duration: 30, doctor: "Δρ. Παπαδάκη" }));

    const res = await request(app)
      .put(`/api/appointments/${moving._id.toString()}`)
      .send(baseAppointment({ time: "09:15", duration: 30, doctor: "Δρ. Παπαδάκη" }));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/σύγκρουση/i);
  });

  it("returns 404 when updating an appointment that does not exist", async () => {
    const missingId = "60f1f7a2c2a4f5b1d8e2a111";

    const res = await request(app).put(`/api/appointments/${missingId}`).send(baseAppointment());

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/appointments/:id", () => {
  it("deletes an existing appointment", async () => {
    const appt = await Appointment.create(baseAppointment());

    const res = await request(app).delete(`/api/appointments/${appt._id.toString()}`);

    expect(res.status).toBe(200);
    expect(await Appointment.findById(appt._id)).toBeNull();
  });

  it("returns 404 when deleting an appointment that does not exist", async () => {
    const missingId = "60f1f7a2c2a4f5b1d8e2a111";

    const res = await request(app).delete(`/api/appointments/${missingId}`);

    expect(res.status).toBe(404);
  });
});
