// src/api/settingsApi.js
import request, { API_BASE_URL } from "./apiClient";

/**
 * ⚙️ Settings API
 * Ρυθμίσεις κλινικής και ανεβάσματα αρχείων
 */

const SETTINGS_ENDPOINT = "/settings";
const UPLOAD_LOGO_ENDPOINT = "/uploads/logo";

// ===============================
// 📋 Ρυθμίσεις Κλινικής
// ===============================

// 🔹 Λήψη όλων των ρυθμίσεων
export const getSettings = () => request(SETTINGS_ENDPOINT);

// 🔹 Ενημέρωση ρυθμίσεων
export const updateSettings = (settingsData) =>
  request(SETTINGS_ENDPOINT, { method: "PUT", body: settingsData });

// ===============================
// 🖼️ Upload Logo
// ===============================

/**
 * Ανεβάζει νέο λογότυπο (multipart/form-data)
 * και επιστρέφει πλήρες URL
 */
export const uploadLogo = async (file) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("logo", file);

  const res = await fetch(`${API_BASE_URL}${UPLOAD_LOGO_ENDPOINT}`, {
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

// ✅ Ενοποιημένη εξαγωγή
const settingsApi = {
  getSettings,
  updateSettings,
  uploadLogo,
};

export default settingsApi;
