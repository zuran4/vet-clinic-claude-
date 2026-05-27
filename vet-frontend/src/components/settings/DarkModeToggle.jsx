import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

const DarkModeToggle = ({ settings, setSettings, updateSettings }) => {
  const [isDark, setIsDark] = useState(
    settings?.darkMode ?? localStorage.getItem("darkMode") === "true"
  );

  // Sync αν αλλάξουν τα settings από έξω
  useEffect(() => {
    if (settings?.darkMode !== undefined) {
      setIsDark(settings.darkMode);
    }
  }, [settings?.darkMode]);

  const toggle = async () => {
    const next = !isDark;

    // 1. Άμεση εφαρμογή στο DOM
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // 2. localStorage για reload
    localStorage.setItem("darkMode", next);

    // 3. Local state
    setIsDark(next);

    // 4. Ενημέρωση settings state (για MainLayout)
    const updated = { ...settings, darkMode: next };
    if (setSettings) setSettings(updated);

    // 5. Αποθήκευση στο backend
    if (updateSettings) {
      try {
        await updateSettings(updated);
      } catch {
        // σιωπηλό αν αποτύχει — το DOM και το localStorage έχουν ήδη ενημερωθεί
      }
    }
  };

  return (
    <div className="flex items-center justify-between max-w-sm p-4 bg-gray-50 rounded-2xl border border-gray-200">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
          isDark ? "bg-slate-700" : "bg-amber-50"
        }`}>
          {isDark
            ? <Moon className="w-4 h-4 text-slate-300" />
            : <Sun className="w-4 h-4 text-amber-500" />
          }
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {isDark ? "Dark Mode" : "Light Mode"}
          </p>
          <p className="text-xs text-gray-400">
            {isDark ? "Σκοτεινό θέμα ενεργό" : "Φωτεινό θέμα ενεργό"}
          </p>
        </div>
      </div>

      {/* Toggle switch */}
      <button
        type="button"
        onClick={toggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          isDark ? "bg-indigo-600" : "bg-gray-300"
        }`}
        aria-label="Toggle dark mode"
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          isDark ? "translate-x-5" : "translate-x-1"
        }`} />
      </button>
    </div>
  );
};

export default DarkModeToggle;
