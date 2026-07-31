import { useMemo } from "react";
import dayjs from "dayjs";

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function useAppointmentSlots({
  date,
  clinicIntervals = [],
  groomingIntervals = [],
  slotDuration,
  groomingSlotDuration = slotDuration,
  appointments,
}) {
  const generateTimeSlots = (intervals = [], doctor, duration) => {
    const slots = [];

    (intervals || []).forEach(({ start, end }) => {
      let current = dayjs(`${date}T${start}`);
      const endTime = dayjs(`${date}T${end}`);

      while (current.isBefore(endTime)) {
        const time = current.format("HH:mm");
        const slotStartMin = toMinutes(time);
        // Ταιριάζουμε ραντεβού που ΠΕΦΤΟΥΝ μέσα στο διάστημα του slot, όχι
        // μόνο ακριβή ίδια ώρα — αλλιώς ένα ραντεβού σε μη-στρογγυλή ώρα
        // (π.χ. 19:08) δεν ταιριάζει ποτέ με κανένα slot ("19:00"/"19:30")
        // και εξαφανίζεται από το ημερολόγιο, ενώ υπάρχει κανονικά.
        const found = appointments.find((a) => {
          if (a.date !== date || (a.doctor || "Ιατρείο") !== doctor) return false;
          const apptMin = toMinutes(a.time);
          return apptMin >= slotStartMin && apptMin < slotStartMin + duration;
        });

        slots.push({
          time,
          bookedBy: found?.clientName || null,
          type: found?.type || null,
          duration: found?.duration || duration,
          id: found?._id || null,
          appointment: found || null,
          isMerged: false,
          doctor,
        });

        current = current.add(duration, "minute");
      }
    });

    return slots;
  };

  // Ιατρείο
  const slotsIatreio = useMemo(
    () => generateTimeSlots(clinicIntervals, "Ιατρείο", slotDuration),
    [appointments, date, clinicIntervals, slotDuration]
  );

  // Grooming — ξεχωριστή διάρκεια slot (π.χ. 60 λεπτά αντί για 30)
  const slotsGrooming = useMemo(
    () => generateTimeSlots(groomingIntervals, "Grooming", groomingSlotDuration),
    [appointments, date, groomingIntervals, groomingSlotDuration]
  );

  return { slotsIatreio, slotsGrooming };
}
