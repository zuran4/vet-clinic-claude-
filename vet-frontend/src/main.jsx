import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Προσθέτει αυτόματα το auth token σε ΟΛΕΣ τις fetch κλήσεις προς το δικό μας API
const _originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
  const isOwnApi =
    typeof url === "string" &&
    (url.startsWith("/api") || url.includes("localhost:5000"));

  if (isOwnApi) {
    const token = localStorage.getItem("token");
    if (token) {
      options = {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    }
  }

  return _originalFetch(url, options);
};

// 🔹 Φόρτωση i18n πριν το render
import "./i18n";

// ✅ Εισαγωγή για toast ειδοποιήσεις
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />

    {/* ✅ Toaster: εμφανίζει όλα τα toast μηνύματα της εφαρμογής */}
    <Toaster
      position="top-right"                     // Θέση: πάνω δεξιά
      toastOptions={{
        duration: 3000,                        // Διαρκεί 3 δευτερόλεπτα
        style: {
          fontSize: "0.9rem",
          borderRadius: "12px",
          background: "#fff",
          color: "#333",
          boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
        },
        success: {
          iconTheme: {
            primary: "#22c55e",                // Πράσινο για επιτυχία
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",                // Κόκκινο για σφάλμα
            secondary: "#fff",
          },
        },
      }}
    />
  </React.StrictMode>
);
