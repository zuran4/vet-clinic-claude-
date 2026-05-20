// src/api/customersApi.js
import request from "./apiClient";

/**
 * 👥 Customers API
 * CRUD λειτουργίες για πελάτες + αγορές
 */

const CUSTOMERS_ENDPOINT = "/customers";

// 🔹 Λήψη πελατών με υποστήριξη pagination + search
export const getAllCustomers = (page = 1, pageSize = 9, search = "") => {
  let url = `${CUSTOMERS_ENDPOINT}?page=${page}&pageSize=${pageSize}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  return request(url);
};

// 🔹 Λήψη συγκεκριμένου πελάτη (με κατοικίδια)
export const getCustomerById = (id) =>
  request(`${CUSTOMERS_ENDPOINT}/${id}`);

// 🔹 Δημιουργία νέου πελάτη
export const createCustomer = (customerData) =>
  request(CUSTOMERS_ENDPOINT, { method: "POST", body: customerData });

// 🔹 Ενημέρωση πελάτη
export const updateCustomer = (id, updatedData) =>
  request(`${CUSTOMERS_ENDPOINT}/${id}`, { method: "PUT", body: updatedData });

// 🔹 Διαγραφή πελάτη
export const deleteCustomer = (id) =>
  request(`${CUSTOMERS_ENDPOINT}/${id}`, { method: "DELETE" });

// ===============================
// 🛒 Αγορές Πελάτη
// ===============================

// 🔹 Προσθήκη αγορών για πελάτη
export const addCustomerPurchases = (customerId, products) =>
  request(`${CUSTOMERS_ENDPOINT}/${customerId}/purchases`, {
    method: "POST",
    body: { products },
  });

// 🔹 Λήψη ιστορικού αγορών
export const getCustomerPurchases = (customerId) =>
  request(`${CUSTOMERS_ENDPOINT}/${customerId}/purchases`);

// 🔹 Διαγραφή συγκεκριμένης αγοράς
export const deleteCustomerPurchase = (customerId, purchaseId) =>
  request(`${CUSTOMERS_ENDPOINT}/${customerId}/purchases/${purchaseId}`, {
    method: "DELETE",
  });

// ✅ Ενοποιημένη εξαγωγή
const customersApi = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addCustomerPurchases,
  getCustomerPurchases,
  deleteCustomerPurchase,
};

export default customersApi;
