// src/api/petsApi.js
import request from "./apiClient";

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
};

export default petsApi;
