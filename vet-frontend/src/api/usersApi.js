// src/api/usersApi.js
import request from "./apiClient";

/**
 * 👤 Users API
 * CRUD λειτουργίες για χρήστες (login accounts) — μόνο admin
 */

const USERS_ENDPOINT = "/users";

export const getAllUsers = () => request(USERS_ENDPOINT);

export const createUser = (userData) =>
  request(USERS_ENDPOINT, { method: "POST", body: userData });

export const updateUser = (id, updatedData) =>
  request(`${USERS_ENDPOINT}/${id}`, { method: "PUT", body: updatedData });

export const deleteUser = (id) =>
  request(`${USERS_ENDPOINT}/${id}`, { method: "DELETE" });

const usersApi = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};

export default usersApi;
