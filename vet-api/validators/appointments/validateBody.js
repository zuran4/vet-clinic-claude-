// validators/appointments/validateBody.js
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
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

  // 1) Υποχρεωτικά πεδία
  const required = { date, time, clientName, animalName, type, duration };
  for (const [key, val] of Object.entries(required)) {
    if (val === undefined || val === null || String(val).trim() === "") {
      return res.status(400).json({ message: `Το πεδίο "${key}" είναι υποχρεωτικό.` });
    }
  }

  // 2) Ημερομηνία / ώρα με customParseFormat
  const validDate = dayjs(date, "YYYY-MM-DD", true).isValid();
  if (!validDate) {
    return res.status(400).json({ message: 'Το "date" πρέπει να είναι σε μορφή YYYY-MM-DD.' });
  }

  const validTime = dayjs(time, "HH:mm", true).isValid();
  if (!validTime) {
    return res.status(400).json({ message: 'Το "time" πρέπει να είναι σε μορφή HH:mm.' });
  }

  // 3) Διάρκεια: θετικός ακέραιος
  const dur = Number.parseInt(duration, 10);
  if (!Number.isFinite(dur) || dur <= 0) {
    return res.status(400).json({ message: "Η διάρκεια πρέπει να είναι θετικός ακέραιος." });
  }
  req.body.duration = dur;

  // 4) Προαιρετικά πεδία: trimming
  req.body.phone = typeof phone === "string" ? phone.trim() : phone;
  req.body.notes = typeof notes === "string" ? notes.trim() : notes;
  req.body.doctor = doctor && String(doctor).trim() ? doctor.trim() : "Ιατρείο";

  // 5) owner: αν σταλεί, πρέπει να είναι 24-hex ObjectId
  if (owner && !/^[a-fA-F0-9]{24}$/.test(String(owner))) {
    return res.status(400).json({ message: 'Το "owner" δεν είναι έγκυρο ObjectId.' });
  }

  return next();
}
