// src/api/appointmentsApi.js
import request from "./apiClient";

/**
 * 📅 Appointments API
 * CRUD λειτουργίες για ραντεβού
 */

const APPOINTMENTS_ENDPOINT = "/appointments";

// 🔹 Λήψη όλων των ραντεβού
export const getAllAppointments = () => request(APPOINTMENTS_ENDPOINT);

// 🔹 Δημιουργία νέου ραντεβού
export const createAppointment = (appointmentData) =>
  request(APPOINTMENTS_ENDPOINT, { method: "POST", body: appointmentData });

// 🔹 Ενημέρωση ραντεβού
export const updateAppointment = (id, updatedData) =>
  request(`${APPOINTMENTS_ENDPOINT}/${id}`, {
    method: "PUT",
    body: updatedData,
  });

// 🔹 Διαγραφή ραντεβού
export const deleteAppointment = (id) =>
  request(`${APPOINTMENTS_ENDPOINT}/${id}`, { method: "DELETE" });

// ✅ Ενοποιημένη εξαγωγή
const appointmentsApi = {
  getAllAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};

export default appointmentsApi;
