// src/api/apiClient.js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5000/api`;

// Ουρά για requests που περιμένουν το refresh να ολοκληρωθεί
let isRefreshing = false;
let pendingQueue = [];

function flushQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  pendingQueue = [];
}

async function attemptRefresh() {
  const refreshToken = localStorage.getItem("refreshToken");
  const clinicId     = localStorage.getItem("clinicId");
  if (!refreshToken || !clinicId) throw new Error("no_refresh_token");

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken, clinicId }),
  });

  if (!res.ok) throw new Error("refresh_failed");

  const data = await res.json();
  localStorage.setItem("token", data.token);
  localStorage.setItem("refreshToken", data.refreshToken);
  return data.token;
}

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

  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Αν πάρουμε 401 (εκτός από login/refresh), δοκιμάζουμε αυτόματα refresh
  if (res.status === 401 && endpoint !== "/auth/login" && endpoint !== "/auth/refresh") {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await attemptRefresh();
        flushQueue(null, newToken);
        isRefreshing = false;
        return request(endpoint, { method, body, headers });
      } catch (err) {
        flushQueue(err);
        isRefreshing = false;
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.dispatchEvent(new Event("auth:logout"));
        const sessionErr = new Error("Η συνεδρία έχει λήξει. Παρακαλώ συνδεθείτε ξανά.");
        sessionErr.status = 401;
        throw sessionErr;
      }
    }

    // Αν ήδη γίνεται refresh, βάλε το request στην ουρά
    return new Promise((resolve, reject) => {
      pendingQueue.push({ resolve, reject });
    }).then(() => request(endpoint, { method, body, headers }));
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const msg =
      errorData.message ||
      (typeof errorData.error === "string" ? errorData.error : errorData.error?.message) ||
      `Σφάλμα ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;

  return await res.json();
}

export default request;
