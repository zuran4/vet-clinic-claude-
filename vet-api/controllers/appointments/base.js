// controllers/appointments/base.js
import {
  findAll,
  create as createOne,
  update as updateOne,
  remove as removeOne,
} from "../../services/appointments/service.js";

/**
 * 📅 Λήψη όλων των ραντεβού
 */
export const getAllAppointments = async (req, res, next) => {
  try {
    const items = await findAll();
    res.json(items);
  } catch (error) {
    next(error);
  }
};

/**
 * ➕ Δημιουργία νέου ραντεβού
 * Προϋπόθεση: έχουν ήδη τρέξει validator και overlap middleware
 */
export const createAppointment = async (req, res, next) => {
  try {
    const payload = {
      date: req.body.date,
      time: req.body.time,
      clientName: req.body.clientName,
      phone: req.body.phone,
      animalName: req.body.animalName,
      type: req.body.type,
      duration: Number(req.body.duration),
      notes: req.body.notes,
      doctor: req.body.doctor || "Ιατρείο",
      owner: req.body.owner,
    };

    const saved = await createOne(payload);
    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
};

/**
 * ✏️ Ενημέρωση ραντεβού
 * Προϋπόθεση: έχουν ήδη τρέξει validator και overlap middleware
 */
export const updateAppointment = async (req, res, next) => {
  try {
    const payload = {
      date: req.body.date,
      time: req.body.time,
      clientName: req.body.clientName,
      phone: req.body.phone,
      animalName: req.body.animalName,
      type: req.body.type,
      duration: Number(req.body.duration),
      notes: req.body.notes,
      doctor: req.body.doctor || "Ιατρείο",
      owner: req.body.owner,
    };

    const updated = await updateOne(req.params.id, payload);
    if (!updated) {
      return res.status(404).json({ message: "❌ Το ραντεβού δεν βρέθηκε." });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * 🗑️ Διαγραφή ραντεβού
 */
export const deleteAppointment = async (req, res, next) => {
  try {
    const deleted = await removeOne(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "❌ Ραντεβού δεν βρέθηκε." });
    }
    res.json({ message: "✅ Διαγράφηκε επιτυχώς!" });
  } catch (error) {
    next(error);
  }
};
