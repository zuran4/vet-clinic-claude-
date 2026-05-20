import { useCallback } from "react";

export function useAppointmentsFilters(appointments, selectedDate) {
  const filteredAppointments = useCallback(() => {
    return appointments.filter((a) => a.date === selectedDate);
  }, [appointments, selectedDate]);

  return { filteredAppointments };
}
