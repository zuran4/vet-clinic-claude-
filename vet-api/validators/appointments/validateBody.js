// validators/appointments/validateBody.js
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import { reportEvent } from "../../services/controlPlaneReporter.js";
dayjs.extend(customParseFormat);

export default function validateAppointmentBody(req, res, next) {
  const {
    date,
    time,
    clientName,
    animalName,
    type,
    duration,
    phone,
    notes,
    doctor,
    owner,
  } = req.body || {};

  const reject = (message) => {
    reportEvent({
      clinicId: req.clinicId,
      type: "appointment_validation_failed",
      severity: "warning",
      message,
      source: "backend",
      meta: { path: req.originalUrl, requestId: req.requestId },
    });
    return res.status(400).json({ message });
  };

  // 1) Υποχρεωτικά πεδία (το "type" ελέγχεται ξεχωριστά παρακάτω, ως πίνακας)
  const required = { date, time, clientName, animalName, duration };
  for (const [key, val] of Object.entries(required)) {
    if (val === undefined || val === null || String(val).trim() === "") {
      return reject(`Το πεδίο "${key}" είναι υποχρεωτικό.`);
    }
  }

  // 1b) type: δέχεται πίνακα ή μεμονωμένο string (backward compatible), απαιτεί τουλάχιστον έναν τύπο
  const typesArray = Array.isArray(type) ? type : (type ? [type] : []);
  const cleanTypes = typesArray.map((t) => String(t).trim()).filter(Boolean);
  if (cleanTypes.length === 0) {
    return reject('Το πεδίο "type" είναι υποχρεωτικό.');
  }
  req.body.type = cleanTypes;

  // 2) Ημερομηνία / ώρα με customParseFormat
  const validDate = dayjs(date, "YYYY-MM-DD", true).isValid();
  if (!validDate) {
    return reject('Το "date" πρέπει να είναι σε μορφή YYYY-MM-DD.');
  }

  const validTime = dayjs(time, "HH:mm", true).isValid();
  if (!validTime) {
    return reject('Το "time" πρέπει να είναι σε μορφή HH:mm.');
  }

  // 3) Διάρκεια: θετικός ακέραιος
  const dur = Number.parseInt(duration, 10);
  if (!Number.isFinite(dur) || dur <= 0) {
    return reject("Η διάρκεια πρέπει να είναι θετικός ακέραιος.");
  }
  req.body.duration = dur;

  // 4) Προαιρετικά πεδία: trimming
  req.body.phone = typeof phone === "string" ? phone.trim() : phone;
  req.body.notes = typeof notes === "string" ? notes.trim() : notes;
  req.body.doctor = doctor && String(doctor).trim() ? doctor.trim() : "Ιατρείο";

  // 5) owner: αν σταλεί, πρέπει να είναι 24-hex ObjectId
  if (owner && !/^[a-fA-F0-9]{24}$/.test(String(owner))) {
    return reject('Το "owner" δεν είναι έγκυρο ObjectId.');
  }

  return next();
}
