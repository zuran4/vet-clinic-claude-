import { useMemo } from "react";
import dayjs from "dayjs";

export function useAppointmentSlots({
  date,
  clinicIntervals = [],
  groomingIntervals = [],
  slotDuration,
  appointments,
}) {
  const generateTimeSlots = (intervals = [], doctor) => {
    const slots = [];

    (intervals || []).forEach(({ start, end }) => {
      let current = dayjs(`${date}T${start}`);
      const endTime = dayjs(`${date}T${end}`);

      while (current.isBefore(endTime)) {
        const time = current.format("HH:mm");
        const found = appointments.find(
          (a) =>
            a.time === time &&
            a.date === date &&
            (a.doctor || "Ιατρείο") === doctor
        );

        slots.push({
          time,
          bookedBy: found?.clientName || null,
          type: found?.type || null,
          duration: found?.duration || slotDuration,
          id: found?._id || null,
          appointment: found || null,
          isMerged: false,
          doctor,
        });

        current = current.add(slotDuration, "minute");
      }
    });

    return slots;
  };

  // Ιατρείο
  const slotsIatreio = useMemo(
    () => generateTimeSlots(clinicIntervals, "Ιατρείο"),
    [appointments, date, clinicIntervals, slotDuration]
  );

  // Grooming
  const slotsGrooming = useMemo(
    () => generateTimeSlots(groomingIntervals, "Grooming"),
    [appointments, date, groomingIntervals, slotDuration]
  );

  return { slotsIatreio, slotsGrooming };
}
