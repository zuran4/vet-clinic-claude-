import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, ScanBarcode, AlertTriangle } from "lucide-react";

const SCANNER_ELEMENT_ID = "barcode-scanner-viewport";

const BarcodeScannerModal = ({ onScanned, onClose }) => {
  const scannerRef = useRef(null);
  const stoppedRef = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";

    // Η πρόσβαση σε κάμερα δουλεύει μόνο σε secure context (HTTPS ή γνήσιο
    // localhost) — π.χ. σε κινητό μέσω τοπικού δικτύου (http://192.168.x.x)
    // δεν υπάρχει καν navigator.mediaDevices.
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Η σάρωση με κάμερα χρειάζεται HTTPS σύνδεση (δεν λειτουργεί μέσω τοπικού δικτύου χωρίς HTTPS).");
      return;
    }

    // cancelled: το component ζήτησε cleanup (unmount/remount) πριν προλάβει
    // να ολοκληρωθεί το async start() — π.χ. React StrictMode double-invoke.
    // started: το start() έχει πραγματικά ολοκληρωθεί (η κάμερα τρέχει).
    // Το stop() πριν ολοκληρωθεί το start() πετάει σφάλμα ΚΑΙ αφήνει το
    // camera stream ανοιχτό — γι' αυτό δεν το καλούμε ποτέ πριν το started.
    let cancelled = false;
    let started = false;
    let scanner;

    const stopAndClear = () => {
      stoppedRef.current = true;
      return scanner?.stop().then(() => scanner.clear()).catch(() => {});
    };

    try {
      scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 260, height: 140 },
            aspectRatio: 1.0, // fixes tripled camera image bug on mobile portrait
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
            // prefer the OS-native barcode detector when available (much more
            // reliable for curved/warped 1D barcodes on bottles/cans)
            experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          },
          (decodedText) => {
            if (stoppedRef.current) return;
            stoppedRef.current = true;
            scanner
              .stop()
              .catch(() => {})
              .finally(() => {
                onScanned(decodedText);
              });
          },
          () => {
            // per-frame "δεν βρέθηκε barcode" — αγνοείται σκόπιμα
          }
        )
        .then(() => {
          started = true;
          // Αν είχαμε ήδη ζητήσει cleanup μέχρι να ξεκινήσει πραγματικά η
          // κάμερα, σταμάτα την τώρα — αλλιώς μένει "κρεμασμένο" ανοιχτό stream.
          if (cancelled) stopAndClear();
        })
        .catch((err) => {
          if (cancelled) return;
          setError(
            err?.name === "NotAllowedError"
              ? "Δεν δόθηκε πρόσβαση στην κάμερα."
              : "Δεν ήταν δυνατή η εκκίνηση της κάμερας."
          );
        });
    } catch {
      setError("Δεν ήταν δυνατή η εκκίνηση της κάμερας.");
    }

    return () => {
      document.body.style.overflow = "";
      cancelled = true;
      if (stoppedRef.current) {
        // Είχε ήδη σταματήσει (πετυχημένη σάρωση) — μόνο clear, το stop()
        // θα πετούσε synchronous exception σε ήδη-σταματημένο scanner.
        try { scanner?.clear(); } catch {}
      } else if (started) {
        stopAndClear();
      }
      // Αν ούτε το start() έχει ολοκληρωθεί ακόμα, δεν κάνουμε τίποτα εδώ —
      // το .then() παραπάνω θα δει cancelled=true και θα σταματήσει μόνο του.
    };
  }, [onScanned]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-win-surface">
        <div className="bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <ScanBarcode className="w-5 h-5" />
            <span className="font-semibold text-sm">Σάρωση Barcode</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 -m-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {error ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
            </div>
          ) : (
            <>
              <div id={SCANNER_ELEMENT_ID} className="w-full rounded-xl overflow-hidden bg-black" />
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
                Στόχευσε το barcode μέσα στο πλαίσιο
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
