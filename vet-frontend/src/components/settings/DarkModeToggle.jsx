import React from "react";
import { Sun, Moon } from "lucide-react";
import Button from "../ui/button";

const DarkModeToggle = ({ settings, setSettings }) => {
  const isDark = settings?.darkMode || false;

  const toggleDarkMode = () => {
    const updated = { ...settings, darkMode: !isDark };
    setSettings(updated);
    localStorage.setItem("darkMode", updated.darkMode); // αποθήκευση για reload
  };

  return (
    <Button variant="secondary" onClick={toggleDarkMode}>
      <span className="flex items-center gap-2">
        {isDark ? (
          <>
            <Moon className="w-5 h-5 text-primary" /> Dark Mode ON
          </>
        ) : (
          <>
            <Sun className="w-5 h-5 text-yellow-500" /> Light Mode OFF
          </>
        )}
      </span>
    </Button>
  );
};

export default DarkModeToggle;
