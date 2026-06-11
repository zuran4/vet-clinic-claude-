// src/api/api.js

// Κεντρικό API URL για όλο το frontend
// Παίρνει τιμή από VITE_API_BASE_URL στο Vercel / .env
// και αν δεν υπάρχει, πέφτει στο local backend.
const API_URL =
  (import.meta.env.VITE_API_BASE_URL &&
    import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "")) ||
  `http://${window.location.hostname}:5000/api`;

export { API_URL };
