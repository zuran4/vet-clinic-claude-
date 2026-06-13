import { useState, useEffect, useCallback } from "react";

const DISMISS_KEY = "pwaInstallDismissed";

// 📲 Διαχειρίζεται το prompt εγκατάστασης του PWA (Android/Chrome) και
// εντοπίζει iOS, όπου δεν υπάρχει αυτόματο prompt (μόνο "Share → Προσθήκη στην Αρχική Οθόνη").
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "true"
  );

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  }, []);

  const canInstall =
    !isStandalone && !dismissed && (deferredPrompt !== null || isIos);

  return { canInstall, isIos, promptInstall, dismiss };
}
