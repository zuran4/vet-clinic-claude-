import { toDateRange, hasOverlap, findSameDayByDoctor } from "../../services/appointments/service.js";
import { reportEvent } from "../../services/controlPlaneReporter.js";

export default async function checkOverlap(req, res, next) {
  try {
    const { date, time, duration, doctor = "Ιατρείο" } = req.body || {};
    const { start, end } = toDateRange(date, time, duration);

    const existing = await findSameDayByDoctor(date, doctor, req.params?.id, req.models);

    if (hasOverlap(existing, start, end)) {
      reportEvent({
        clinicId: req.clinicId,
        type: "appointment_conflict",
        severity: "warning",
        message: `Απόπειρα δημιουργίας ραντεβού με σύγκρουση (${doctor}, ${date} ${time}).`,
        source: "backend",
        meta: { path: req.originalUrl, date, time, doctor, requestId: req.requestId },
      });
      return res.status(400).json({
        message: "❌ Υπάρχει σύγκρουση με άλλο ραντεβού στο ίδιο τμήμα.",
      });
    }
    return next();
  } catch (err) {
    return next(err);
  }
}
