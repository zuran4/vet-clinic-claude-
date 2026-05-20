// src/hooks/useAppointmentsData.jsx
import { useState, useCallback } from "react";
import appointmentsApi from "../api/appointmentsApi";

export function useAppointmentsData(setErrorMessage) {
  const [appointments, setAppointments] = useState([]);

  // ✅ Λήψη όλων των ραντεβού
  const fetchAppointments = useCallback(async () => {
    try {
      const data = await appointmentsApi.getAllAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Σφάλμα φόρτωσης ραντεβού:", err);
      setErrorMessage("Αποτυχία φόρτωσης ραντεβού.");
      setTimeout(() => setErrorMessage(""), 4000);
    }
  }, [setErrorMessage]);

  // ✅ Αποθήκευση (νέο ή ενημέρωση)
  const saveAppointment = useCallback(
    async (newAppt, appointmentId = null) => {
      try {
        const data = appointmentId
          ? await appointmentsApi.updateAppointment(appointmentId, newAppt)
          : await appointmentsApi.createAppointment(newAppt);

        setAppointments((prev) =>
          appointmentId
            ? prev.map((a) => (a._id === appointmentId ? data : a))
            : [...prev, data]
        );
      } catch (err) {
        console.error("❌ Σφάλμα αποθήκευσης:", err);
        setErrorMessage(err.message || "Αποτυχία αποθήκευσης ραντεβού.");
        setTimeout(() => setErrorMessage(""), 4000);
      }
    },
    [setErrorMessage]
  );

  // ✅ Διαγραφή ραντεβού
  const deleteAppointment = useCallback(
    async (id) => {
      try {
        await appointmentsApi.deleteAppointment(id);
        setAppointments((prev) => prev.filter((a) => a._id !== id));
      } catch (err) {
        console.error("❌ Σφάλμα διαγραφής:", err);
        setErrorMessage(err.message || "Αποτυχία διαγραφής ραντεβού.");
        setTimeout(() => setErrorMessage(""), 4000);
      }
    },
    [setErrorMessage]
  );

  return { appointments, fetchAppointments, saveAppointment, deleteAppointment };
}
