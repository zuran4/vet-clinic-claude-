import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";

import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/testDb.js";
import { buildTestApp } from "../helpers/testApp.js";
import Customer from "../../models/Customer.js";
import Pet from "../../models/Pet.js";

let app;

beforeAll(async () => {
  await connectTestDb();
  app = buildTestApp();
}, 60_000);

afterAll(disconnectTestDb);

beforeEach(clearCollections);

async function createOwner(overrides = {}) {
  return Customer.create({ name: "Ιδιοκτήτης Δ.", phone: "6900000099", ...overrides });
}

describe("POST /api/pets", () => {
  it("creates a pet linked to its owner", async () => {
    const owner = await createOwner();

    const res = await request(app).post("/api/pets").send({
      owner: owner._id.toString(),
      name: "Ρεξ",
      species: "Σκύλος",
      gender: "Αρσενικό",
    });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Ρεξ");

    const stored = await Pet.findOne({ name: "Ρεξ" });
    expect(stored).not.toBeNull();
    expect(stored.owner.toString()).toBe(owner._id.toString());
  });

  it("rejects a payload missing required fields", async () => {
    const res = await request(app).post("/api/pets").send({ name: "Χωρίς ιδιοκτήτη" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(await Pet.countDocuments({})).toBe(0);
  });
});

describe("GET /api/pets/:id", () => {
  it("returns 400 for a malformed id", async () => {
    const res = await request(app).get("/api/pets/not-an-id");

    expect(res.status).toBe(400);
  });

  it("returns 404 for a well-formed id that does not exist", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/pets/${missingId}`);

    expect(res.status).toBe(404);
  });

  it("returns the pet with its populated owner", async () => {
    const owner = await createOwner({ name: "Κατερίνα Ξ." });
    const pet = await Pet.create({ owner: owner._id, name: "Μίλο", species: "Γάτα", gender: "Θηλυκό" });

    const res = await request(app).get(`/api/pets/${pet._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Μίλο");
    expect(res.body.owner).toEqual(expect.objectContaining({ name: "Κατερίνα Ξ." }));
  });
});

describe("GET /api/pets/by-owner/:ownerId", () => {
  it("lists only pets belonging to the given owner", async () => {
    const ownerA = await createOwner({ name: "Owner A", phone: "6911111111" });
    const ownerB = await createOwner({ name: "Owner B", phone: "6922222222" });

    await Pet.create([
      { owner: ownerA._id, name: "Α-Σκύλος", species: "Σκύλος", gender: "Αρσενικό" },
      { owner: ownerA._id, name: "Α-Γάτα", species: "Γάτα", gender: "Θηλυκό" },
      { owner: ownerB._id, name: "Β-Κουνέλι", species: "Κουνέλι", gender: "Αρσενικό" },
    ]);

    const res = await request(app).get(`/api/pets/by-owner/${ownerA._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((p) => p.name).sort()).toEqual(["Α-Γάτα", "Α-Σκύλος"]);
  });
});

describe("PUT /api/pets/:id", () => {
  it("updates an existing pet", async () => {
    const owner = await createOwner();
    const pet = await Pet.create({ owner: owner._id, name: "Παλιό Όνομα", species: "Σκύλος", gender: "Αρσενικό" });

    const res = await request(app)
      .put(`/api/pets/${pet._id.toString()}`)
      .send({ name: "Νέο Όνομα" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Νέο Όνομα");
  });

  it("returns 404 when updating a pet that does not exist", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).put(`/api/pets/${missingId}`).send({ name: "Φάντασμα" });

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/pets/:id/updateOwner", () => {
  it("transfers a pet to a new owner", async () => {
    const oldOwner = await createOwner({ name: "Παλιός Ιδιοκτήτης", phone: "6933333333" });
    const newOwner = await createOwner({ name: "Νέος Ιδιοκτήτης", phone: "6944444444" });
    const pet = await Pet.create({ owner: oldOwner._id, name: "Ταξιδιάρης", species: "Σκύλος", gender: "Αρσενικό" });

    const res = await request(app)
      .put(`/api/pets/${pet._id.toString()}/updateOwner`)
      .send({ newOwnerId: newOwner._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.pet.owner).toEqual(expect.objectContaining({ name: "Νέος Ιδιοκτήτης" }));

    const reloaded = await Pet.findById(pet._id);
    expect(reloaded.owner.toString()).toBe(newOwner._id.toString());
  });

  it("returns 404 when the new owner does not exist", async () => {
    const owner = await createOwner();
    const pet = await Pet.create({ owner: owner._id, name: "Χαμένος", species: "Γάτα", gender: "Θηλυκό" });
    const missingOwnerId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .put(`/api/pets/${pet._id.toString()}/updateOwner`)
      .send({ newOwnerId: missingOwnerId });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/pets/:id", () => {
  it("deletes an existing pet", async () => {
    const owner = await createOwner();
    const pet = await Pet.create({ owner: owner._id, name: "Προς Διαγραφή", species: "Σκύλος", gender: "Θηλυκό" });

    const res = await request(app).delete(`/api/pets/${pet._id.toString()}`);

    expect(res.status).toBe(200);
    expect(await Pet.findById(pet._id)).toBeNull();
  });

  it("returns 404 when deleting a pet that does not exist", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).delete(`/api/pets/${missingId}`);

    expect(res.status).toBe(404);
  });
});

describe("pet history", () => {
  it("adds, lists and deletes history entries", async () => {
    const owner = await createOwner();
    const pet = await Pet.create({ owner: owner._id, name: "Ιστορικός", species: "Σκύλος", gender: "Αρσενικό" });

    const addRes = await request(app)
      .post(`/api/pets/${pet._id.toString()}/history`)
      .send({ reason: "Εμβολιασμός", result: "Ολοκληρώθηκε" });

    expect(addRes.status).toBe(201);
    expect(addRes.body.history).toHaveLength(1);
    const entryId = addRes.body.history[0]._id;

    const listRes = await request(app).get(`/api/pets/${pet._id.toString()}/history`);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0]).toEqual(expect.objectContaining({ reason: "Εμβολιασμός" }));

    const deleteRes = await request(app).delete(`/api/pets/${pet._id.toString()}/history/${entryId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.history).toHaveLength(0);
  });

  it("returns 404 when adding history to a pet that does not exist", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post(`/api/pets/${missingId}/history`)
      .send({ reason: "Εξέταση" });

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/pets/snapshot/:microchip", () => {
  it("stores a registry snapshot and syncs vaccinated/neutered flags", async () => {
    const owner = await createOwner();
    const pet = await Pet.create({
      owner: owner._id,
      name: "Τσιπαρισμένος",
      species: "Σκύλος",
      gender: "Αρσενικό",
      microchip: "987654321012345",
    });

    const res = await request(app)
      .patch(`/api/pets/snapshot/${pet.microchip}`)
      .send({ snapshot: { isVaccinated: true, isSterilized: true, source: "registry" } });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ ok: true, petId: pet._id.toString() }));

    const reloaded = await Pet.findById(pet._id);
    expect(reloaded.vaccinated).toBe(true);
    expect(reloaded.neutered).toBe(true);
    expect(reloaded.registrySnapshot).toEqual(expect.objectContaining({ source: "registry" }));
  });

  it("returns 404 for an unknown microchip", async () => {
    const res = await request(app)
      .patch("/api/pets/snapshot/000000000000000")
      .send({ snapshot: { isVaccinated: true } });

    expect(res.status).toBe(404);
  });

  it("returns 400 when the snapshot payload is missing", async () => {
    const res = await request(app).patch("/api/pets/snapshot/123456789012345").send({});

    expect(res.status).toBe(400);
  });
});
