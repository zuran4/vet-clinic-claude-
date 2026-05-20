// middlewares/appointments/checkOverlap.js
import {
  toDateRange,
  hasOverlap,
  findSameDayByDoctor,
} from "../../services/appointments/service.js";

/**
 * Ελέγχει σύγκρουση ραντεβού για ίδια ημερομηνία και ίδιο doctor.
 * Για update, εξαιρεί το τρέχον id (req.params.id).
 */
export default async function checkOverlap(req, res, next) {
  try {
    const {
      date,
      time,
      duration,
      doctor = "Ιατρείο",
    } = req.body || {};

    // Προϋπόθεση: validator έχει ήδη ελέγξει βασικά πεδία
    const { start, end } = toDateRange(date, time, duration);

    const existing = await findSameDayByDoctor(
      date,
      doctor,
      req.params?.id // exclude για update
    );

    if (hasOverlap(existing, start, end)) {
      return res.status(400).json({
        message: "❌ Υπάρχει σύγκρουση με άλλο ραντεβού στο ίδιο τμήμα.",
      });
    }

    return next();
  } catch (err) {
    return next(err);
  }
}
