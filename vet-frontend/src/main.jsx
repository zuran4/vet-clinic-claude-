import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import OnScreenKeyboard from "./components/ui/OnScreenKeyboard";
import reportClientEvent from "./utils/reportClientEvent.js";

// 🛰️ Πιάνει JS errors/unhandled promise rejections εκτός React tree (π.χ. σε
// event handlers, timers) και τα προωθεί στο MASTER ADMIN APP.
window.addEventListener("error", (event) => {
  // Αβλαβές browser noise, όχι πραγματικό bug — δεν χρειάζεται καταγραφή.
  if (event.message?.includes("ResizeObserver loop")) return;

  reportClientEvent({
    message: event.message,
    stack: event.error?.stack,
    type: "window_error",
  });
});
window.addEventListener("unhandledrejection", (event) => {
  reportClientEvent({
    message: event.reason?.message || String(event.reason),
    stack: event.reason?.stack,
    type: "unhandled_rejection",
  });
});

// 🛰️ Sentry — error tracking για το frontend (κενό DSN = απενεργοποιημένο)
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.VITE_APP_ENV || import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],

    // Performance tracing
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,

    // Session Replay — μόνο σε errors, ποτέ πλήρες session (privacy-friendly)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    sendDefaultPii: false,
  });
}

// Προσθέτει αυτόματα το auth token σε ΟΛΕΣ τις fetch κλήσεις προς το δικό μας API
const _apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const _originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
  const isOwnApi =
    typeof url === "string" &&
    (url.startsWith("/api") ||
     /:5000\/api/.test(url) ||
     (_apiBase && url.startsWith(_apiBase)));

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

// 📲 Service worker — απαραίτητο για το PWA install prompt στο κινητό
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// 🔹 Φόρτωση i18n πριν το render
import "./i18n";

// ✅ Εισαγωγή για toast ειδοποιήσεις
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* 🛰️ Πιάνει render crashes, τα στέλνει στο Sentry και δείχνει fallback UI */}
    <Sentry.ErrorBoundary
      onError={(error) => reportClientEvent({ message: error?.message, stack: error?.stack, type: "react_render_error" })}
      fallback={({ error, resetError }) => (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-xl font-semibold text-gray-800">
            Κάτι πήγε στραβά.
          </h1>
          <p className="text-sm text-gray-500">{error?.message}</p>
          <button
            onClick={resetError}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Δοκίμασε ξανά
          </button>
        </div>
      )}
    >
      <App />
    </Sentry.ErrorBoundary>

    {/* ⌨️ Global on-screen keyboard — ενεργό μόνο αν το device-level setting είναι on */}
    <OnScreenKeyboard />

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
