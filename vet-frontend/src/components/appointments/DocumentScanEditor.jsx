import { useState, useRef, useEffect, useMemo } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { loadScanner } from "../../utils/documentScanner.js";

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function defaultCorners(w, h) {
  const mx = w * 0.06;
  const my = h * 0.06;
  return {
    tl: { x: mx, y: my },
    tr: { x: w - mx, y: my },
    bl: { x: mx, y: h - my },
    br: { x: w - mx, y: h - my },
  };
}

function renameForCrop(name) {
  const base = (name || "scan").replace(/\.[^.]+$/, "");
  return `${base || "scan"}-scan.jpg`;
}

const CORNER_LABELS = { tl: "πάνω-αριστερά", tr: "πάνω-δεξιά", bl: "κάτω-αριστερά", br: "κάτω-δεξιά" };

export default function DocumentScanEditor({ file, onCancel, onConfirm }) {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const [naturalSize, setNaturalSize] = useState(null);
  const [corners, setCorners] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  const runAutoDetect = async (w, h) => {
    setLoading(true);
    setError("");
    try {
      const scanner = await loadScanner();
      scannerRef.current = scanner;
      const img = window.cv.imread(imgRef.current);
      const contour = scanner.findPaperContour(img);
      let pts = null;
      if (contour) {
        pts = scanner.getCornerPoints(contour);
        contour.delete();
      }
      img.delete();
      if (pts?.topLeftCorner && pts?.topRightCorner && pts?.bottomLeftCorner && pts?.bottomRightCorner) {
        setCorners({ tl: pts.topLeftCorner, tr: pts.topRightCorner, bl: pts.bottomLeftCorner, br: pts.bottomRightCorner });
      } else {
        setCorners(defaultCorners(w, h));
        toast("Δεν εντοπίστηκε αυτόματα το έγγραφο — προσαρμόστε τις γωνίες.", { icon: "✍️" });
      }
    } catch (err) {
      setError(err.message || "Αποτυχία φόρτωσης εργαλείου σάρωσης.");
      setCorners(defaultCorners(w, h));
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    const w = imgRef.current.naturalWidth;
    const h = imgRef.current.naturalHeight;
    setNaturalSize({ width: w, height: h });
    runAutoDetect(w, h);
  };

  const handlePointerDown = (corner) => (e) => {
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const move = (ev) => {
      const rect = containerRef.current.getBoundingClientRect();
      const relX = Math.min(Math.max(ev.clientX - rect.left, 0), rect.width);
      const relY = Math.min(Math.max(ev.clientY - rect.top, 0), rect.height);
      const x = (relX / rect.width) * naturalSize.width;
      const y = (relY / rect.height) * naturalSize.height;
      setCorners((prev) => ({ ...prev, [corner]: { x, y } }));
    };
    const up = () => {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
  };

  const handleReset = () => {
    if (naturalSize) setCorners(defaultCorners(naturalSize.width, naturalSize.height));
  };

  const handleConfirm = async () => {
    setProcessing(true);
    setError("");
    try {
      const width = Math.max(50, Math.round(Math.max(dist(corners.tl, corners.tr), dist(corners.bl, corners.br))));
      const height = Math.max(50, Math.round(Math.max(dist(corners.tl, corners.bl), dist(corners.tr, corners.br))));
      const canvas = scannerRef.current.extractPaper(imgRef.current, width, height, {
        topLeftCorner: corners.tl,
        topRightCorner: corners.tr,
        bottomLeftCorner: corners.bl,
        bottomRightCorner: corners.br,
      });
      if (!canvas) throw new Error("Αποτυχία περικοπής εγγράφου.");
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("Αποτυχία δημιουργίας εικόνας.");
      const croppedFile = new File([blob], renameForCrop(file.name), { type: "image/jpeg" });
      await onConfirm(croppedFile);
    } catch (err) {
      setError(err.message || "Αποτυχία περικοπής.");
      setProcessing(false);
    }
  };

  const handleSkip = () => onConfirm(file);

  const polygonPoints = corners
    ? `${corners.tl.x},${corners.tl.y} ${corners.tr.x},${corners.tr.y} ${corners.br.x},${corners.br.y} ${corners.bl.x},${corners.bl.y}`
    : "";

  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Προσαρμογή γωνιών εγγράφου</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          Σύρετε τις κουκκίδες ώστε να ταιριάζουν με τις γωνίες του εγγράφου
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative w-full select-none touch-none rounded-lg overflow-hidden bg-gray-100 dark:bg-win-elevated/30"
        style={{ aspectRatio: naturalSize ? `${naturalSize.width} / ${naturalSize.height}` : "4 / 3" }}
      >
        <img
          ref={imgRef}
          src={previewUrl}
          onLoad={handleImageLoad}
          onError={() => setError("Αποτυχία φόρτωσης εικόνας.")}
          className="w-full h-full object-contain pointer-events-none select-none"
          alt=""
          draggable={false}
        />

        {naturalSize && corners && !loading && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${naturalSize.width} ${naturalSize.height}`}
            preserveAspectRatio="none"
          >
            <polygon
              points={polygonPoints}
              className="fill-indigo-400/20 stroke-indigo-500"
              strokeWidth={Math.max(1, naturalSize.width * 0.005)}
            />
          </svg>
        )}

        {naturalSize && corners && !loading && Object.entries(corners).map(([key, pt]) => (
          <div
            key={key}
            onPointerDown={handlePointerDown(key)}
            title={CORNER_LABELS[key]}
            className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-white border-2 border-indigo-500 shadow touch-none cursor-grab active:cursor-grabbing"
            style={{ left: `${(pt.x / naturalSize.width) * 100}%`, top: `${(pt.y / naturalSize.height) * 100}%` }}
          />
        ))}

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 dark:bg-black/50">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Φόρτωση εργαλείου σάρωσης...</p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-win-border-light text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-win-elevated/50 disabled:opacity-50 transition-colors"
        >
          Ακύρωση
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={loading || processing}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-win-border-light text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-win-elevated/50 disabled:opacity-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Επαναφορά
        </button>
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={loading || processing || !corners}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm"
      >
        {processing ? "Επεξεργασία..." : "Περικοπή & Ανέβασμα"}
      </button>
      <button
        type="button"
        onClick={handleSkip}
        disabled={processing}
        className="w-full text-xs text-gray-400 dark:text-gray-500 underline disabled:opacity-50"
      >
        Ανέβασμα χωρίς περικοπή
      </button>
    </div>
  );
}
