import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";

import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/testDb.js";
import { buildTestApp } from "../helpers/testApp.js";
import Customer from "../../models/Customer.js";
import Pet from "../../models/Pet.js";
import Prescription from "../../models/Prescription.js";

let app;

beforeAll(async () => {
  await connectTestDb();
  app = buildTestApp();
}, 60_000);

afterAll(disconnectTestDb);
beforeEach(clearCollections);

async function createPet() {
  const owner = await Customer.create({ name: "Ιδιοκτήτης Συνταγής", phone: "6900007777" });
  return Pet.create({ owner: owner._id, name: "Ασθενής", species: "Σκύλος", gender: "Αρσενικό" });
}

describe("POST /api/prescriptions", () => {
  it("creates a prescription for an existing pet", async () => {
    const pet = await createPet();

    const res = await request(app).post("/api/prescriptions").send({
      animalId: pet._id.toString(),
      animalName: pet.name,
      clientName: "Ιδιοκτήτης Συνταγής",
      medicines: ["Augmentin", "Prednisolone"],
      dosage: "1 ανά 12ωρο",
    });

    expect(res.status).toBe(201);
    expect(res.body.medicines).toEqual(["Augmentin", "Prednisolone"]);

    const stored = await Prescription.findOne({ animalId: pet._id });
    expect(stored).not.toBeNull();
    expect(stored.clientName).toBe("Ιδιοκτήτης Συνταγής");
  });

  it("rejects a payload missing animalId or animalName", async () => {
    const res = await request(app).post("/api/prescriptions").send({ clientName: "Χωρίς ζώο" });

    expect(res.status).toBe(400);
    expect(await Prescription.countDocuments({})).toBe(0);
  });

  it("rejects a payload missing the required clientName", async () => {
    const pet = await createPet();

    const res = await request(app).post("/api/prescriptions").send({
      animalId: pet._id.toString(),
      animalName: pet.name,
      medicines: ["Augmentin"],
    });

    expect(res.status).toBe(400);
    expect(await Prescription.countDocuments({})).toBe(0);
  });
});

describe("GET /api/prescriptions", () => {
  it("returns all prescriptions sorted by most recent first", async () => {
    const pet = await createPet();

    await Prescription.create([
      { animalId: pet._id, animalName: pet.name, clientName: "Πελάτης", medicines: ["A"], createdAt: new Date("2026-01-01") },
      { animalId: pet._id, animalName: pet.name, clientName: "Πελάτης", medicines: ["B"], createdAt: new Date("2026-06-01") },
    ]);

    const res = await request(app).get("/api/prescriptions");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].medicines).toEqual(["B"]);
  });
});

describe("GET /api/prescriptions/by-animal/:animalId", () => {
  it("returns only prescriptions for the given animal", async () => {
    const petA = await createPet();
    const ownerB = await Customer.create({ name: "Άλλος Ιδιοκτήτης", phone: "6900008888" });
    const petB = await Pet.create({ owner: ownerB._id, name: "Άλλο Ζώο", species: "Γάτα", gender: "Θηλυκό" });

    await Prescription.create([
      { animalId: petA._id, animalName: petA.name, clientName: "Α", medicines: ["A"] },
      { animalId: petB._id, animalName: petB.name, clientName: "Β", medicines: ["B"] },
    ]);

    const res = await request(app).get(`/api/prescriptions/by-animal/${petA._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].medicines).toEqual(["A"]);
  });
});
