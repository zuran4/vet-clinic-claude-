// ===============================================
// 📄 api.js
// Περιγραφή: Κεντρική ρύθμιση URL API (παλιό helper)
// ✅ Χρησιμοποιεί το ίδιο VITE_API_BASE_URL με το apiClient
// ===============================================

export const API_URL =
  import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5000/api`;
