// src/api/petsApi.js
import request, { API_BASE_URL } from "./apiClient";

/**
 * 🐶 Pets API
 * CRUD + αλλαγή ιδιοκτήτη + ιστορικό επισκέψεων
 */

const PETS_ENDPOINT = "/pets";

// ===============================
// 📋 CRUD Λειτουργίες
// ===============================

// 🔹 Δημιουργία νέου κατοικιδίου
export const createPet = (petData) =>
  request(PETS_ENDPOINT, { method: "POST", body: petData });

// 🔹 Λήψη όλων των κατοικιδίων
export const getAllPets = () => request(PETS_ENDPOINT);

// 🔹 Λήψη κατοικιδίων συγκεκριμένου πελάτη
export const getPetsByOwner = (ownerId) =>
  request(`${PETS_ENDPOINT}/by-owner/${ownerId}`);

// 🔹 Λήψη κατοικιδίου με πλήρη στοιχεία
export const getPetById = (id) => request(`${PETS_ENDPOINT}/${id}`);

// 🔹 Ενημέρωση κατοικιδίου
export const updatePet = (id, updatedData) =>
  request(`${PETS_ENDPOINT}/${id}`, { method: "PUT", body: updatedData });

// 🔹 Διαγραφή κατοικιδίου
export const deletePet = (id) =>
  request(`${PETS_ENDPOINT}/${id}`, { method: "DELETE" });

// ===============================
// 👥 Αλλαγή Ιδιοκτήτη
// ===============================
export const updatePetOwner = (id, newOwnerId) =>
  request(`${PETS_ENDPOINT}/${id}/updateOwner`, {
    method: "PUT",
    body: { newOwnerId },
  });

// ===============================
// 📜 Ιστορικό Κατοικιδίου
// ===============================

// 🔹 Προσθήκη εγγραφής στο ιστορικό
export const addPetHistoryEntry = (id, entryData) =>
  request(`${PETS_ENDPOINT}/${id}/history`, {
    method: "POST",
    body: entryData,
  });

// 🔹 Λήψη ιστορικού
export const getPetHistory = (id) =>
  request(`${PETS_ENDPOINT}/${id}/history`);

// 🔹 Διαγραφή συγκεκριμένης εγγραφής ιστορικού
export const deletePetHistoryEntry = (id, entryId) =>
  request(`${PETS_ENDPOINT}/${id}/history/${entryId}`, {
    method: "DELETE",
  });

// 🔹 Αποστολή οδηγιών θεραπείας (email/SMS) στον ιδιοκτήτη — εφάπαξ, με
// ρητή επιλογή του κτηνιάτρου κατά την ολοκλήρωση ραντεβού.
export const sendPetInstructions = (id, payload) =>
  request(`${PETS_ENDPOINT}/${id}/send-instructions`, {
    method: "POST",
    body: payload,
  });

// ===============================
// 📎 Αρχεία Κατοικιδίου
// (μόνο desktop προς το παρόν)
// ===============================

// 🔹 Ανέβασμα αρχείου
export const uploadPetFile = async (id, file) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}${PETS_ENDPOINT}/${id}/files`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const msg =
      errorData.message ||
      (typeof errorData.error === "string" ? errorData.error : errorData.error?.message) ||
      `Σφάλμα ${res.status}`;
    throw new Error(msg);
  }

  return await res.json();
};

// 🔹 Λήψη λίστας αρχείων
export const getPetFiles = (id) => request(`${PETS_ENDPOINT}/${id}/files`);

// 🔹 Διαγραφή αρχείου
export const deletePetFile = (id, fileId) =>
  request(`${PETS_ENDPOINT}/${id}/files/${fileId}`, { method: "DELETE" });

// ✅ Ενοποιημένη εξαγωγή
const petsApi = {
  createPet,
  getAllPets,
  getPetsByOwner,
  getPetById,
  updatePet,
  deletePet,
  updatePetOwner,
  addPetHistoryEntry,
  getPetHistory,
  deletePetHistoryEntry,
  sendPetInstructions,
  uploadPetFile,
  getPetFiles,
  deletePetFile,
};

export default petsApi;
