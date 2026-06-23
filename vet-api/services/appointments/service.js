import dayjs from "dayjs";
import logger from "../../utils/logger.js";

export function calculateEndTime(start, duration) {
  if (!start || !duration) {
    logger.warn("⚠️ calculateEndTime: κλήση χωρίς σωστά δεδομένα");
    return null;
  }
  const endTime = start.add(Number(duration), "minute");
  logger.info(`🕒 endTime: start=${start.format("HH:mm")} + ${duration}m → ${endTime.format("HH:mm")}`);
  return endTime;
}

export function toDateRange(date, time, duration) {
  const start = dayjs(`${date}T${time}`);
  const end = start.add(Number(duration), "minute");
  return { start, end };
}

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

export async function findSameDayByDoctor(date, doctor, excludeId, { Appointment }) {
  const q = { date, doctor };
  if (excludeId) q._id = { $ne: excludeId };
  return Appointment.find(q, { date: 1, time: 1, duration: 1 }).sort({ time: 1 }).lean();
}

export async function findAll({ Appointment }) {
  return Appointment.find(
    {},
    { clientName: 1, animalName: 1, date: 1, time: 1, duration: 1, type: 1, doctor: 1, phone: 1, owner: 1 }
  ).sort({ date: 1, time: 1 }).lean();
}

export async function create(data, { Appointment }) {
  const doc = new Appointment(data);
  return doc.save();
}

export async function update(id, data, { Appointment }) {
  return Appointment.findByIdAndUpdate(id, data, { new: true });
}

export async function remove(id, { Appointment }) {
  return Appointment.findByIdAndDelete(id);
}

export async function search({ q, from, to, doctor, page = 1, limit = 15 }, { Appointment }) {
  const filter = {};
  if (q && q.trim()) {
    const rx = new RegExp(q.trim(), "i");
    filter.$or = [{ clientName: rx }, { animalName: rx }];
  }
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = from;
    if (to) filter.date.$lte = to;
  }
  if (doctor) filter.doctor = doctor;

  const skip = (page - 1) * limit;
  const [results, total] = await Promise.all([
    Appointment.find(filter).sort({ date: -1, time: 1 }).skip(skip).limit(limit).lean(),
    Appointment.countDocuments(filter),
  ]);

  return { results, total, page, pages: Math.ceil(total / limit) };
}
