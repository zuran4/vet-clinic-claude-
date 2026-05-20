import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const UISettings = () => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  // Εφαρμογή dark κλάσης στο <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
        Ρυθμίσεις Εμφάνισης (UI)
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Εδώ μπορείς να επιλέξεις Dark/Light Mode και μελλοντικά άλλα θέματα.
      </p>

      {/* Dark Mode Toggle */}
      <div className="mt-4">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl shadow-md bg-primary text-white hover:bg-primary-dark transition"
        >
          {darkMode ? <Moon size={18} /> : <Sun size={18} />}
          {darkMode ? "Dark Mode ON" : "Dark Mode OFF"}
        </button>
      </div>
    </div>
  );
};

export default UISettings;
