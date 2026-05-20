// src/api/apiClient.js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Βασικό wrapper για όλες τις HTTP κλήσεις (GET, POST, PUT, DELETE)
 * Χρησιμοποιεί native fetch API και επιστρέφει JSON ή error object.
 */
async function request(endpoint, { method = "GET", body, headers = {} } = {}) {
  const token = localStorage.getItem("token");

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Αν η απάντηση δεν είναι ΟΚ (π.χ. 400 ή 500)
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Σφάλμα ${res.status}`);
    }

    // Αν δεν υπάρχει περιεχόμενο (π.χ. DELETE 204)
    if (res.status === 204) return null;

    return await res.json();
  } catch (err) {
    console.error("❌ API Error:", err.message);
    throw err;
  }
}

export default request;
