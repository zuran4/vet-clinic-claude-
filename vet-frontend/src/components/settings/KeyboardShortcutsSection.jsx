import React, { useState, useEffect, useCallback } from "react";
import { Keyboard, RotateCcw } from "lucide-react";
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_LABELS,
  loadShortcuts,
  saveShortcuts,
} from "../../config/shortcuts.js";

const FORBIDDEN_KEYS = new Set([
  "Escape", "Tab", "Enter", "Backspace", "Delete",
  "Shift", "Control", "Alt", "Meta", "CapsLock",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
]);

export default function KeyboardShortcutsSection() {
  const [shortcuts, setShortcuts] = useState(loadShortcuts);
  const [recording, setRecording] = useState(null); // action being recorded
  const [error, setError] = useState("");

  const startRecording = (action) => {
    setRecording(action);
    setError("");
  };

  const cancelRecording = useCallback(() => {
    setRecording(null);
    setError("");
  }, []);

  useEffect(() => {
    if (!recording) return;

    const onKey = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") { cancelRecording(); return; }
      if (FORBIDDEN_KEYS.has(e.key)) {
        setError(`Το πλήκτρο "${e.key}" δεν επιτρέπεται.`);
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) {
        setError("Δεν υποστηρίζονται συνδυασμοί πλήκτρων.");
        return;
      }

      const key = e.key.toLowerCase();

      // Check for duplicates
      const duplicate = Object.entries(shortcuts).find(
        ([action, k]) => k === key && action !== recording
      );
      if (duplicate) {
        const label = SHORTCUT_LABELS[duplicate[0]]?.label || duplicate[0];
        setError(`Το "${key}" χρησιμοποιείται ήδη για "${label}".`);
        return;
      }

      const updated = { ...shortcuts, [recording]: key };
      setShortcuts(updated);
      saveShortcuts(updated);
      setRecording(null);
      setError("");
    };

    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [recording, shortcuts, cancelRecording]);

  const handleReset = () => {
    setShortcuts({ ...DEFAULT_SHORTCUTS });
    saveShortcuts(DEFAULT_SHORTCUTS);
    setRecording(null);
    setError("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
          Πάτα <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-win-elevated text-gray-700 dark:text-gray-300 text-xs font-mono">Αλλαγή</kbd> και μετά ένα πλήκτρο για να ορίσεις συντόμευση.
          Πάτα <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-win-elevated text-gray-700 dark:text-gray-300 text-xs font-mono">Esc</kbd> για ακύρωση.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Επαναφορά
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-700/50 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-gray-100 dark:border-win-border overflow-hidden">
        {Object.keys(SHORTCUT_LABELS).map((action, i) => {
          const { label, description } = SHORTCUT_LABELS[action];
          const key = shortcuts[action] || "—";
          const isRecording = recording === action;

          return (
            <div
              key={action}
              className={`flex items-center justify-between gap-4 px-4 py-3 ${
                i > 0 ? "border-t border-gray-50 dark:border-win-border/50" : ""
              } ${isRecording ? "bg-indigo-50 dark:bg-indigo-900/20" : "bg-white dark:bg-win-surface"}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-win-elevated flex items-center justify-center flex-shrink-0">
                  <Keyboard className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {isRecording ? (
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
                    Πίεσε πλήκτρο...
                  </span>
                ) : (
                  <kbd className="min-w-[32px] text-center px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-win-elevated text-gray-700 dark:text-gray-300 text-sm font-mono font-bold uppercase shadow-sm">
                    {key}
                  </kbd>
                )}
                <button
                  type="button"
                  onClick={() => isRecording ? cancelRecording() : startRecording(action)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl font-medium transition-colors ${
                    isRecording
                      ? "bg-gray-100 dark:bg-win-elevated text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-win-elevated2"
                      : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                  }`}
                >
                  {isRecording ? "Ακύρωση" : "Αλλαγή"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
