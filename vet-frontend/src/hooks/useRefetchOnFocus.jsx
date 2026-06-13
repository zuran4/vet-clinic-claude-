// src/hooks/useRefetchOnFocus.jsx
import { useEffect, useRef } from "react";

// 🔹 Ξανατρέχει το callback όταν η εφαρμογή επανέρχεται σε προσκήνιο
// (π.χ. ξεκλειδώνεις το κινητό ή αλλάζεις tab) — χρήσιμο ώστε αλλαγές
// που έγιναν από άλλη συσκευή να εμφανίζονται χωρίς χειροκίνητο refresh.
export function useRefetchOnFocus(callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        callbackRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);
}
