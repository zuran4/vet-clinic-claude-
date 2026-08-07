import dayjs from "dayjs";
import logger from "../../utils/logger.js";
import { computeShowNewBadge } from "../../utils/customerBadge.js";

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

export async function findAll({ Appointment, Customer }) {
  const appointments = await Appointment.find(
    {},
    { clientName: 1, animalName: 1, date: 1, time: 1, duration: 1, type: 1, doctor: 1, phone: 1, owner: 1, notes: 1, status: 1 }
  ).sort({ date: 1, time: 1 }).lean();

  // "Νέος" badge ανά ραντεβού: μόνο για owners με isNewCustomer=true ΚΑΙ
  // λιγότερα από NEW_CUSTOMER_APPOINTMENT_LIMIT ραντεβού συνολικά.
  const ownerIds = [...new Set(appointments.map((a) => a.owner).filter(Boolean).map(String))];
  if (!ownerIds.length) return appointments;

  const newCustomers = await Customer.find(
    { _id: { $in: ownerIds }, isNewCustomer: true },
    { _id: 1 }
  ).lean();
  if (!newCustomers.length) return appointments;

  const newCustomerIds = newCustomers.map((c) => c._id);
  const counts = await Appointment.aggregate([
    { $match: { owner: { $in: newCustomerIds } } },
    { $group: { _id: "$owner", count: { $sum: 1 } } },
  ]);
  const countsById = new Map(counts.map((row) => [String(row._id), row.count]));

  const newBadgeOwnerIds = new Set(
    newCustomerIds
      .filter((id) => computeShowNewBadge(true, countsById.get(String(id))))
      .map(String)
  );

  for (const appt of appointments) {
    appt.showNewBadge = appt.owner ? newBadgeOwnerIds.has(String(appt.owner)) : false;
  }

  return appointments;
}

export async function create(data, { Appointment }) {
  const doc = new Appointment(data);
  return doc.save();
}

export async function update(id, data, { Appointment }) {
  return Appointment.findByIdAndUpdate(id, data, { new: true });
}

export async function updateStatus(id, status, { Appointment }) {
  return Appointment.findByIdAndUpdate(id, { status }, { new: true });
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
