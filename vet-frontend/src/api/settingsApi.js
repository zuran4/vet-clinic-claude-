// src/api/settingsApi.js
import request from "./apiClient";

/**
 * ⚙️ Settings API
 * Ρυθμίσεις κλινικής και ανεβάσματα αρχείων
 */

const SETTINGS_ENDPOINT = "/settings";
const UPLOAD_LOGO_ENDPOINT = "/upload/logo";

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

  // 👉 Ίδιο base URL με το apiClient:
  // - Σε production: VITE_API_BASE_URL (Render)
  // - Local/LAN: http://<host>:5000/api
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5000/api`;

  const res = await fetch(`${API_BASE_URL}${UPLOAD_LOGO_ENDPOINT}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Σφάλμα ${res.status}`);
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
