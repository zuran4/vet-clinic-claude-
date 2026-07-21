import { useEffect, useRef, useState } from "react";
import { X, Camera as CameraIcon, Loader2 } from "lucide-react";
import { loadScanner, detectDocumentCorners } from "../../utils/documentScanner.js";

const DETECT_INTERVAL_MS = 350;
const DETECT_WIDTH = 320;

// Ζωντανή κάμερα μέσα στη σελίδα, με πραγματικού χρόνου ανίχνευση εγγράφου
// (ίδια ιδέα με το native document scanner, φτιαγμένη με δικά μας μέσα).
// Χρειάζεται HTTPS (ή localhost) — getUserMedia δεν δουλεύει σε απλό HTTP.
export default function LiveCameraScanner({ onCapture, onCancel, onFallback }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scannerRef = useRef(null);
  const detectCanvasRef = useRef(null);
  const [corners, setCorners] = useState(null);
  const [videoSize, setVideoSize] = useState(null);
  const [status, setStatus] = useState("starting"); // starting | live | error
  const [error, setError] = useState("");
  const [capturing, setCapturing] = useState(false);

  if (!detectCanvasRef.current) {
    detectCanvasRef.current = document.createElement("canvas");
  }

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    function runDetectionTick() {
      const video = videoRef.current;
      const scanner = scannerRef.current;
      if (!video || !scanner || video.readyState < 2 || !window.cv?.Mat) return;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;

      const scale = DETECT_WIDTH / vw;
      const dw = DETECT_WIDTH;
      const dh = Math.round(vh * scale);
      const canvas = detectCanvasRef.current;
      canvas.width = dw;
      canvas.height = dh;
      canvas.getContext("2d").drawImage(video, 0, 0, dw, dh);

      let mat = null;
      try {
        mat = window.cv.imread(canvas);
        const detected = detectDocumentCorners(mat);
        if (detected) {
          setCorners({
            tl: { x: detected.tl.x / dw, y: detected.tl.y / dh },
            tr: { x: detected.tr.x / dw, y: detected.tr.y / dh },
            bl: { x: detected.bl.x / dw, y: detected.bl.y / dh },
            br: { x: detected.br.x / dw, y: detected.br.y / dh },
          });
        } else {
          setCorners(null);
        }
      } catch {
        // Αγνοούμε σφάλμα ανίχνευσης ενός frame — ξαναπροσπαθούμε στο επόμενο tick.
      } finally {
        mat?.delete();
      }
    }

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (cancelled) return;

        setVideoSize({ width: videoRef.current.videoWidth, height: videoRef.current.videoHeight });
        setStatus("live");

        const scanner = await loadScanner();
        if (cancelled) return;
        scannerRef.current = scanner;

        intervalId = setInterval(runDetectionTick, DETECT_INTERVAL_MS);
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err.message || "Δεν ήταν δυνατή η πρόσβαση στην κάμερα.");
      }
    }

    start();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setCapturing(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      setCapturing(false);
      if (!blob) { setError("Αποτυχία λήψης φωτογραφίας."); return; }
      onCapture(new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  };

  const polygon = corners
    ? `${corners.tl.x * 100},${corners.tl.y * 100} ${corners.tr.x * 100},${corners.tr.y * 100} ${corners.br.x * 100},${corners.br.y * 100} ${corners.bl.x * 100},${corners.bl.y * 100}`
    : "";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Σάρωση εγγράφου</p>
        <button
          type="button"
          onClick={onCancel}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-win-elevated/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div
        className="relative w-full rounded-xl overflow-hidden bg-black"
        style={{ aspectRatio: videoSize ? `${videoSize.width} / ${videoSize.height}` : "3 / 4" }}
      >
        <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />

        {corners && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polygon
              points={polygon}
              className="fill-indigo-400/20 stroke-indigo-400"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        {status === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-xs">Άνοιγμα κάμερας...</p>
          </div>
        )}
      </div>

      {status === "error" && (
        <div className="space-y-2">
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={onFallback}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-win-border-light text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-win-elevated/50 transition-colors"
          >
            Άνοιγμα κάμερας συσκευής
          </button>
        </div>
      )}

      {status === "live" && (
        <button
          type="button"
          onClick={handleCapture}
          disabled={capturing}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <CameraIcon className="w-4 h-4" />
          {capturing ? "Λήψη..." : "Λήψη φωτογραφίας"}
        </button>
      )}
    </div>
  );
}
