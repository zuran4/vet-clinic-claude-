import React, { useState } from "react";
import { Keyboard } from "lucide-react";
import { KIOSK_KEYBOARD_STORAGE_KEY, KIOSK_KEYBOARD_TOGGLE_EVENT } from "../ui/OnScreenKeyboard";

const TouchscreenSettings = () => {
  const [enabled, setEnabled] = useState(localStorage.getItem(KIOSK_KEYBOARD_STORAGE_KEY) === "true");

  const toggle = () => {
    const next = !enabled;
    localStorage.setItem(KIOSK_KEYBOARD_STORAGE_KEY, String(next));
    setEnabled(next);
    window.dispatchEvent(new CustomEvent(KIOSK_KEYBOARD_TOGGLE_EVENT));
  };

  return (
    <div className="flex items-center justify-between max-w-lg p-4 bg-gray-50 dark:bg-win-elevated/50 rounded-2xl border border-gray-200 dark:border-win-border-light">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
          <Keyboard className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">On-screen πληκτρολόγιο</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 max-w-sm">
            Εμφανίζεται αυτόματα σε κάθε πεδίο κειμένου σε αυτή τη συσκευή. Ενεργοποίησέ το μόνο σε
            touchscreen που δεν έχει φυσικό πληκτρολόγιο.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={toggle}
        className={`flex-shrink-0 ml-3 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-win-elevated2"}`}
        aria-label="Ενεργοποίηση on-screen πληκτρολογίου"
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-1"}`} />
      </button>
    </div>
  );
};

export default TouchscreenSettings;
