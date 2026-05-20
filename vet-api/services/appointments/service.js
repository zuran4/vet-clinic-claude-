import dayjs from "dayjs";

import logger from "../../utils/logger.js";
import Appointment from "../../models/appointmentModel.js";

/**
 * Υπολογίζει ώρα λήξης από start+duration.
 * Προσοχή: το start πρέπει να είναι dayjs instance.
 */
export function calculateEndTime(start, duration) {
  if (!start || !duration) {
    logger.warn("⚠️ calculateEndTime: κλήση χωρίς σωστά δεδομένα");
    return null;
  }
  const endTime = start.add(Number(duration), "minute");
  logger.info(
    `🕒 endTime: start=${start.format("HH:mm")} + ${duration}m → ${endTime.format("HH:mm")}`
  );
  return endTime;
}

/**
 * Μετατρέπει (date, time, duration) σε { start, end } ως dayjs.
 * date: "YYYY-MM-DD", time: "HH:mm", duration: λεπτά
 */
export function toDateRange(date, time, duration) {
  const start = dayjs(`${date}T${time}`);
  const end = start.add(Number(duration), "minute");
  return { start, end };
}

/**
 * Ελέγχει αν το διάστημα [start, end) επικαλύπτεται με
 * κάποιο από τα existingAppointments (ίδια μέρα/doctor).
 * existingAppointments: [{ date, time, duration }, ...]
 * start/end: dayjs
 */
export function hasOverlap(existingAppointments = [], start, end) {
  if (!Array.isArray(existingAppointments) || !start || !end) {
    logger.warn("⚠️ hasOverlap: μη έγκυρα δεδομένα");
    return false;
  }
  if (existingAppointments.length === 0) return false;

  const overlap = existingAppointments.some((appt) => {
    const dur = Number.parseInt(appt?.duration ?? 0, 10);
    const apptStart = dayjs(`${appt?.date}T${appt?.time}`);
    const apptEnd = apptStart.add(Number.isFinite(dur) ? dur : 0, "minute");
    return start.isBefore(apptEnd) && end.isAfter(apptStart);
  });

  if (overlap) {
    logger.warn(`⚠️ Σύγκρουση: ${start.format("HH:mm")}–${end.format("HH:mm")}`);
  } else {
    logger.info(`✅ Χωρίς σύγκρουση: ${start.format("HH:mm")}–${end.format("HH:mm")}`);
  }
  return overlap;
}

/**
 * Φέρνει όλα τα ραντεβού της ίδιας μέρας και ίδιου doctor.
 * Εξαιρεί το id όταν γίνεται update, για να μην «συγκρουστεί» με τον εαυτό του.
 * Επιστρέφει μόνο τα απαραίτητα πεδία, ταξινομημένα ανά ώρα.
 */
export async function findSameDayByDoctor(date, doctor, excludeId) {
  const q = { date, doctor };
  if (excludeId) q._id = { $ne: excludeId };

  return Appointment.find(q, { date: 1, time: 1, duration: 1 })
    .sort({ time: 1 })
    .lean();
}

/* ---------------------------------------------
 * CRUD helpers για λεπτό controller
 * -------------------------------------------*/
export async function findAll() {
  return Appointment.find(
    {},
    {
      clientName: 1,
      animalName: 1,
      date: 1,
      time: 1,
      duration: 1,
      type: 1,
      doctor: 1,
      phone: 1,
      owner: 1,
    }
  )
    .sort({ date: 1, time: 1 })
    .lean();
}

export async function create(data) {
  const doc = new Appointment(data);
  return doc.save();
}

export async function update(id, data) {
  return Appointment.findByIdAndUpdate(id, data, { new: true });
}

export async function remove(id) {
  return Appointment.findByIdAndDelete(id);
}
