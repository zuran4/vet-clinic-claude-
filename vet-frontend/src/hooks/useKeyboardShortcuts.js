import { useEffect, useRef } from "react";
import { loadShortcuts } from "../config/shortcuts.js";

const IGNORED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function useKeyboardShortcuts(handlers) {
  // Keep a ref so the effect doesn't re-run when handlers identity changes
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const onKeyDown = (e) => {
      if (IGNORED_TAGS.has(e.target.tagName)) return;
      if (e.target.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Escape") return; // handled by modals natively

      const shortcuts = loadShortcuts();
      // Build reverse map: key → action
      for (const [action, key] of Object.entries(shortcuts)) {
        if (key && e.key.toLowerCase() === key.toLowerCase()) {
          const handler = handlersRef.current[action];
          if (handler) {
            e.preventDefault();
            handler();
          }
          return;
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []); // only runs once — handlers are read via ref
}
