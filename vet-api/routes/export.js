import express from "express";
import Customer from "../models/Customer.js";
import Pet from "../models/Pet.js";
import Appointment from "../models/appointmentModel.js";
import requirePermission from "../middlewares/auth/requirePermission.js";

const router = express.Router();

function toCsv(headers, rows) {
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [headers.join(","), ...rows.map((r) => r.map(escape).join(","))];
  return lines.join("\r\n");
}

// GET /api/export/customers
router.get("/customers", requirePermission("customers:read"), async (req, res) => {
  try {
    const customers = await Customer.find().lean();
    const headers = ["Όνομα", "Τηλέφωνο", "Email", "Διεύθυνση", "Πόλη", "ΑΦΜ", "Σημειώσεις"];
    const rows = customers.map((c) => [c.name, c.phone, c.email, c.address, c.city, c.afm, c.notes]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="customers.csv"');
    res.send("﻿" + toCsv(headers, rows)); // BOM για σωστά ελληνικά στο Excel
  } catch (err) {
    res.status(500).json({ error: "Σφάλμα εξαγωγής πελατών." });
  }
});

// GET /api/export/pets
router.get("/pets", requirePermission("pets:read"), async (req, res) => {
  try {
    const pets = await Pet.find().populate("owner", "name phone").lean();
    const headers = ["Όνομα", "Είδος", "Φύλο", "Ράτσα", "Microchip", "Ιδιοκτήτης", "Τηλέφωνο Ιδιοκτήτη", "Στειρωμένο", "Εμβολιασμένο"];
    const rows = pets.map((p) => [
      p.name,
      p.species,
      p.gender || "",
      p.breed || "",
      p.microchip || "",
      p.owner?.name || "",
      p.owner?.phone || "",
      p.neutered ? "Ναι" : "Όχι",
      p.vaccinated ? "Ναι" : "Όχι",
    ]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="pets.csv"');
    res.send("﻿" + toCsv(headers, rows));
  } catch (err) {
    res.status(500).json({ error: "Σφάλμα εξαγωγής κατοικίδιων." });
  }
});

// GET /api/export/appointments
router.get("/appointments", requirePermission("appointments:read"), async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from) filter.date = { ...filter.date, $gte: from };
    if (to)   filter.date = { ...filter.date, $lte: to };

    const appointments = await Appointment.find(filter).sort({ date: 1, time: 1 }).lean();
    const headers = ["Ημερομηνία", "Ώρα", "Ζώο", "Ιδιοκτήτης", "Τηλέφωνο", "Τύπος", "Διάρκεια (λεπτά)", "Ιατρός", "Σημειώσεις"];
    const rows = appointments.map((a) => [
      a.date,
      a.time,
      a.animalName,
      a.clientName,
      a.phone || "",
      a.type,
      a.duration,
      a.doctor || "Ιατρείο",
      a.notes || "",
    ]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="appointments.csv"');
    res.send("﻿" + toCsv(headers, rows));
  } catch (err) {
    res.status(500).json({ error: "Σφάλμα εξαγωγής ραντεβού." });
  }
});

export default router;
