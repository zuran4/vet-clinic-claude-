// src/api/productsApi.js
import request from "./apiClient";

/**
 * 📦 Products API
 * CRUD + Batches (action-based) + Export
 */
const PRODUCTS_ENDPOINT = "/products";

// ---------- CRUD ----------
export const getAllProducts = () => request(PRODUCTS_ENDPOINT);

export const getProductById = (id) =>
  request(`${PRODUCTS_ENDPOINT}/${id}`);

export const createProduct = (productData) =>
  request(PRODUCTS_ENDPOINT, { method: "POST", body: productData });

export const updateProduct = (id, updatedData) =>
  request(`${PRODUCTS_ENDPOINT}/${id}`, { method: "PUT", body: updatedData });

export const deleteProduct = (id) =>
  request(`${PRODUCTS_ENDPOINT}/${id}`, { method: "DELETE" });

// ---------- Batches ----------
export const getProductBatches = (id) =>
  request(`${PRODUCTS_ENDPOINT}/${id}/batches`);

// ADD batch
export const addProductBatch = (id, batch) =>
  request(`${PRODUCTS_ENDPOINT}/${id}/batches`, {
    method: "PUT",
    body: { action: "add", batch },
  });

// UPDATE batch
export const updateProductBatch = (id, batchId, patch) =>
  request(`${PRODUCTS_ENDPOINT}/${id}/batches`, {
    method: "PUT",
    body: { action: "update", batchId, patch },
  });

// REMOVE batch
export const removeProductBatch = (id, batchId) =>
  request(`${PRODUCTS_ENDPOINT}/${id}/batches`, {
    method: "PUT",
    body: { action: "remove", batchId },
  });

// ---------- Export ----------
export const exportProduct = (productId, quantity) =>
  request(`${PRODUCTS_ENDPOINT}/export`, {
    method: "POST",
    body: { productId, quantity },
  });

// ---------- Bulk Import ----------
export const importProducts = (products) =>
  request(`${PRODUCTS_ENDPOINT}/import`, {
    method: "POST",
    body: { products },
  });

// ---------- Default export ----------
const productsApi = {
  // CRUD
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  // Batches
  getProductBatches,
  addProductBatch,
  updateProductBatch,
  removeProductBatch,
  // Export
  exportProduct,
  // Import
  importProducts,
};

export default productsApi;
