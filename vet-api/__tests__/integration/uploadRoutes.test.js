import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";

import { connectTestDb, disconnectTestDb } from "../helpers/testDb.js";
import { buildTestApp } from "../helpers/testApp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../../uploads");

let app;
let createdFiles = [];

beforeAll(async () => {
  await connectTestDb();
  app = buildTestApp();
}, 60_000);

afterAll(disconnectTestDb);

afterEach(() => {
  for (const name of createdFiles) {
    const p = path.join(uploadsDir, name);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  createdFiles = [];
});

afterAll(() => {
  // Καθαρισμός τυχόν αρχείων που "διέφυγαν" εκτός του uploads/ (path traversal regression)
  const escaped = path.join(uploadsDir, "..", "evil.png");
  if (fs.existsSync(escaped)) fs.unlinkSync(escaped);
});

function filenameFromUrl(url) {
  return url.split("/uploads/")[1];
}

describe("POST /api/upload/logo", () => {
  it("δέχεται έγκυρη εικόνα PNG και την αποθηκεύει με ασφαλές όνομα", async () => {
    const res = await request(app)
      .post("/api/upload/logo")
      .attach("logo", Buffer.from("fake-png-content"), {
        filename: "my logo.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/\/uploads\/.+\.png$/);

    const savedName = filenameFromUrl(res.body.url);
    createdFiles.push(savedName);

    expect(savedName).not.toContain("..");
    expect(savedName).not.toContain("/");
    expect(fs.existsSync(path.join(uploadsDir, savedName))).toBe(true);
  });

  it("απορρίπτει αρχεία με μη επιτρεπτό τύπο (π.χ. SVG)", async () => {
    const res = await request(app)
      .post("/api/upload/logo")
      .attach("logo", Buffer.from("<svg onload='alert(1)'></svg>"), {
        filename: "logo.svg",
        contentType: "image/svg+xml",
      });

    expect(res.status).toBe(400);
    expect(fs.existsSync(path.join(uploadsDir, "logo.svg"))).toBe(false);
  });

  it("αγνοεί path traversal στο originalname και δεν γράφει εκτός uploads/", async () => {
    const res = await request(app)
      .post("/api/upload/logo")
      .attach("logo", Buffer.from("fake-png-content"), {
        filename: "../../../../evil.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(200);

    const savedName = filenameFromUrl(res.body.url);
    createdFiles.push(savedName);

    expect(savedName).not.toContain("..");
    expect(fs.existsSync(path.join(uploadsDir, "..", "evil.png"))).toBe(false);
    expect(fs.existsSync(path.join(uploadsDir, savedName))).toBe(true);
  });

  it("επιστρέφει 400 όταν δεν στέλνεται αρχείο", async () => {
    const res = await request(app).post("/api/upload/logo");

    expect(res.status).toBe(400);
  });
});
