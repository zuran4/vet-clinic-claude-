import { toDateRange, hasOverlap, findSameDayByDoctor } from "../../services/appointments/service.js";

export default async function checkOverlap(req, res, next) {
  try {
    const { date, time, duration, doctor = "Ιατρείο" } = req.body || {};
    const { start, end } = toDateRange(date, time, duration);

    const existing = await findSameDayByDoctor(date, doctor, req.params?.id, req.models);

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
