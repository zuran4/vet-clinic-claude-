// Lazy loader για τον document scanner (OpenCV.js + jscanify).
// Φορτώνονται μόνο την πρώτη φορά που χρειάζεται πραγματική σάρωση εγγράφου,
// όχι στο αρχικό φόρτωμα της εφαρμογής (τα αρχεία είναι βαριά, ~9MB).

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`Αποτυχία φόρτωσης ${src}`)));
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => { script.dataset.loaded = "true"; resolve(); };
    script.onerror = () => reject(new Error(`Αποτυχία φόρτωσης ${src}`));
    document.head.appendChild(script);
  });
}

let scannerPromise = null;

// Επιστρέφει ένα έτοιμο `jscanify` instance, μόλις το OpenCV runtime αρχικοποιηθεί.
export function loadScanner() {
  if (!scannerPromise) {
    scannerPromise = loadScript("/vendor/opencv.js")
      .then(() => new Promise((resolve) => {
        if (window.cv?.Mat) return resolve();
        window.cv = window.cv || {};
        window.cv["onRuntimeInitialized"] = () => resolve();
      }))
      .then(() => loadScript("/vendor/jscanify.js"))
      .then(() => new window.jscanify());
  }
  return scannerPromise;
}
