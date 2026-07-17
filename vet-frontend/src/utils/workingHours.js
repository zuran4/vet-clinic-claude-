import dayjs from "dayjs";

export const SLOT_DURATION = 30;

export const DEFAULT_WORKING_HOURS = {
  monday:    { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  tuesday:   { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  wednesday: { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  thursday:  { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  friday:    { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  saturday:  { enabled: true,  intervals: [{ start: "10:00", end: "14:00" }] },
  sunday:    { enabled: false, intervals: [{ start: "09:00", end: "17:00" }] },
};

function getDaySchedule(date, storageKey) {
  let workingHours = DEFAULT_WORKING_HOURS;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) workingHours = JSON.parse(saved);
  } catch {
    workingHours = DEFAULT_WORKING_HOURS;
  }
  const dayKey = dayjs(date).locale("en").format("dddd").toLowerCase();
  return workingHours?.[dayKey];
}

export function getAvailableMinutes(date, storageKey) {
  const schedule = getDaySchedule(date, storageKey);
  if (!schedule || !schedule.enabled) return 0;
  const intervals = schedule.intervals || [{ start: "09:00", end: "17:00" }];
  return intervals.reduce((sum, { start, end }) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return sum + ((eh * 60 + em) - (sh * 60 + sm));
  }, 0);
}

// Χρησιμοποιείται σε react-datepicker's filterDate — true = επιλέξιμη ημέρα
export function isClinicOpen(date)   { return getAvailableMinutes(date, "clinicWorkingHours") > 0; }
export function isGroomingOpen(date) { return getAvailableMinutes(date, "groomingWorkingHours") > 0; }

export function getOccupancyClass(date, appointments, { storageKey, doctor }) {
  const availableMinutes = getAvailableMinutes(date, storageKey);
  if (!availableMinutes) return undefined;
  const dateStr = dayjs(date).format("YYYY-MM-DD");
  const bookedMinutes = appointments
    .filter((a) => a.date === dateStr && (a.doctor || "Ιατρείο") === doctor)
    .reduce((sum, a) => sum + (a.duration || SLOT_DURATION), 0);
  const ratio = bookedMinutes / availableMinutes;
  if (ratio > 0.89) return "day-occupancy-high";
  if (ratio > 0.51) return "day-occupancy-medium";
  if (ratio > 0.2) return "day-occupancy-mid";
  return "day-occupancy-low";
}

export function getClinicOccupancyClass(date, appointments) {
  return getOccupancyClass(date, appointments, { storageKey: "clinicWorkingHours", doctor: "Ιατρείο" });
}

export function getGroomingOccupancyClass(date, appointments) {
  return getOccupancyClass(date, appointments, { storageKey: "groomingWorkingHours", doctor: "Grooming" });
}

// Βρίσκει την πρώτη ελεύθερη ώρα (30λεπτα slots) μιας ημέρας για συγκεκριμένο γιατρό/τμήμα.
// Επιστρέφει null αν η μέρα είναι κλειστή ή πλήρως γεμάτη.
export function findFirstAvailableTime(date, storageKey, doctor, appointments) {
  const schedule = getDaySchedule(date, storageKey);
  if (!schedule || !schedule.enabled) return null;
  const intervals = schedule.intervals || [{ start: "09:00", end: "17:00" }];
  const dateStr = dayjs(date).format("YYYY-MM-DD");
  const taken = new Set(
    appointments
      .filter((a) => a.date === dateStr && (a.doctor || "Ιατρείο") === doctor)
      .map((a) => a.time)
  );

  for (const { start, end } of intervals) {
    let [h, m] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    while (h * 60 + m < eh * 60 + em) {
      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      if (!taken.has(timeStr)) return timeStr;
      m += SLOT_DURATION;
      if (m >= 60) { h += Math.floor(m / 60); m %= 60; }
    }
  }
  return null;
}
