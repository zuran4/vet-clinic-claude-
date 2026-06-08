import { describe, it, expect, jest } from "@jest/globals";

import validateAppointmentBody from "../validateBody.js";

const buildRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const validBody = () => ({
  date: "2026-06-10",
  time: "10:00",
  clientName: "Γιώργος Παπαδόπουλος",
  animalName: "Ρεξ",
  type: "Εμβολιασμός",
  duration: "30",
});

describe("validateAppointmentBody middleware", () => {
  it("calls next() for a valid payload and normalises it", () => {
    const req = { body: validBody() };
    const res = buildRes();
    const next = jest.fn();

    validateAppointmentBody(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.body.duration).toBe(30); // string -> number
    expect(req.body.doctor).toBe("Ιατρείο"); // default applied
  });

  it.each(["date", "time", "clientName", "animalName", "type", "duration"])(
    "responds with 400 when required field '%s' is missing",
    (field) => {
      const body = validBody();
      delete body[field];
      const req = { body };
      const res = buildRes();
      const next = jest.fn();

      validateAppointmentBody(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: `Το πεδίο "${field}" είναι υποχρεωτικό.` });
    }
  );

  it("rejects a malformed date", () => {
    const req = { body: { ...validBody(), date: "10-06-2026" } };
    const res = buildRes();
    const next = jest.fn();

    validateAppointmentBody(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Το "date" πρέπει να είναι σε μορφή YYYY-MM-DD.' });
  });

  it("rejects a malformed time", () => {
    const req = { body: { ...validBody(), time: "25:99" } };
    const res = buildRes();
    const next = jest.fn();

    validateAppointmentBody(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Το "time" πρέπει να είναι σε μορφή HH:mm.' });
  });

  it("rejects a non-positive or non-numeric duration", () => {
    for (const bad of ["0", "-15", "abc"]) {
      const req = { body: { ...validBody(), duration: bad } };
      const res = buildRes();
      const next = jest.fn();

      validateAppointmentBody(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Η διάρκεια πρέπει να είναι θετικός ακέραιος." });
    }
  });

  it("rejects an owner that is not a valid 24-hex ObjectId", () => {
    const req = { body: { ...validBody(), owner: "not-an-object-id" } };
    const res = buildRes();
    const next = jest.fn();

    validateAppointmentBody(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Το "owner" δεν είναι έγκυρο ObjectId.' });
  });

  it("accepts a valid owner ObjectId and trims optional fields", () => {
    const req = {
      body: {
        ...validBody(),
        owner: "60f1f7a2c2a4f5b1d8e2a111",
        phone: "  6900000000  ",
        notes: "  σημείωση  ",
        doctor: "  Δρ. Παπαδάκη  ",
      },
    };
    const res = buildRes();
    const next = jest.fn();

    validateAppointmentBody(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body.phone).toBe("6900000000");
    expect(req.body.notes).toBe("σημείωση");
    expect(req.body.doctor).toBe("Δρ. Παπαδάκη");
  });
});
