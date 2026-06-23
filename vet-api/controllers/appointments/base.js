import {
  findAll,
  create as createOne,
  update as updateOne,
  remove as removeOne,
  search as searchAppointments,
} from "../../services/appointments/service.js";
import { emitChange } from "../../utils/realtime.js";

export const searchAppointmentsHandler = async (req, res, next) => {
  try {
    const { q, from, to, doctor, page = 1, limit = 15 } = req.query;
    const data = await searchAppointments(
      { q, from, to, doctor, page: Number(page), limit: Number(limit) },
      req.models
    );
    res.json(data);
  } catch (error) { next(error); }
};

export const getAllAppointments = async (req, res, next) => {
  try {
    const items = await findAll(req.models);
    res.json(items);
  } catch (error) { next(error); }
};

export const createAppointment = async (req, res, next) => {
  try {
    const payload = {
      date:       req.body.date,
      time:       req.body.time,
      clientName: req.body.clientName,
      phone:      req.body.phone,
      animalName: req.body.animalName,
      type:       req.body.type,
      duration:   Number(req.body.duration),
      notes:      req.body.notes,
      doctor:     req.body.doctor || "Ιατρείο",
      owner:      req.body.owner,
    };
    const saved = await createOne(payload, req.models);
    emitChange("appointments");
    res.status(201).json(saved);
  } catch (error) { next(error); }
};

export const updateAppointment = async (req, res, next) => {
  try {
    const payload = {
      date:       req.body.date,
      time:       req.body.time,
      clientName: req.body.clientName,
      phone:      req.body.phone,
      animalName: req.body.animalName,
      type:       req.body.type,
      duration:   Number(req.body.duration),
      notes:      req.body.notes,
      doctor:     req.body.doctor || "Ιατρείο",
      owner:      req.body.owner,
    };
    const updated = await updateOne(req.params.id, payload, req.models);
    if (!updated) return res.status(404).json({ message: "❌ Το ραντεβού δεν βρέθηκε." });
    emitChange("appointments");
    res.json(updated);
  } catch (error) { next(error); }
};

export const deleteAppointment = async (req, res, next) => {
  try {
    const deleted = await removeOne(req.params.id, req.models);
    if (!deleted) return res.status(404).json({ message: "❌ Ραντεβού δεν βρέθηκε." });
    emitChange("appointments");
    res.json({ message: "✅ Διαγράφηκε επιτυχώς!" });
  } catch (error) { next(error); }
};
