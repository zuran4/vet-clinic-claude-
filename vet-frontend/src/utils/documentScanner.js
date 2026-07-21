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
// Χρησιμοποιείται πλέον μόνο για το `extractPaper` (perspective crop) — ο εντοπισμός
// γωνιών γίνεται με το δικό μας, πιο ανθεκτικό `detectDocumentCorners` παρακάτω.
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

function orderCorners(pts) {
  // tl = μικρότερο x+y, br = μεγαλύτερο x+y, tr = μικρότερο y-x, bl = μεγαλύτερο y-x
  const bySum = [...pts].sort((a, b) => (a.x + a.y) - (b.x + b.y));
  const byDiff = [...pts].sort((a, b) => (a.y - a.x) - (b.y - b.x));
  return { tl: bySum[0], br: bySum[3], tr: byDiff[0], bl: byDiff[3] };
}

// Εντοπίζει τις 4 γωνίες ενός εγγράφου μέσα σε ένα cv.Mat (RGBA, π.χ. από cv.imread).
// Πιο ανθεκτικό από το jscanify's default findPaperContour/getCornerPoints:
// - Canny threshold υπολογίζεται αυτόματα από τη μέση φωτεινότητα (όχι σταθερό 50/200)
// - median blur μειώνει θόρυβο από μοτίβα φόντου χωρίς να χαλάει τις ακμές
// - morphological closing ενώνει σπασμένες ακμές σε ένα ενιαίο περίγραμμα
// - approxPolyDP δίνει καθαρές ίσιες γωνίες αντί για heuristic "πιο απομακρυσμένο σημείο"
// - candidates φιλτράρονται με βάση εμβαδόν + κυρτότητα + "ορθογωνικότητα"
//   (πόσο γεμίζει το ελάχιστο περιστρεφόμενο ορθογώνιο — minAreaRect, ώστε
//   να μετριέται σωστά ακόμη κι όταν το έγγραφο είναι κεκλιμένο), με πύλη
//   ελάχιστης ορθογωνικότητας ώστε να μην πιάνει κατά λάθος υφή/θόρυβο φόντου
// Επιστρέφει { tl, tr, bl, br } σε pixel-συντεταγμένες, ή null αν δεν βρέθηκε τίποτα αξιόπιστο.
export function detectDocumentCorners(mat) {
  const cv = window.cv;
  const imgArea = mat.rows * mat.cols;

  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const closed = new cv.Mat();
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  let best = null;

  try {
    cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
    cv.medianBlur(gray, blurred, 5);

    const meanVal = cv.mean(blurred)[0] || 128;
    const lower = Math.max(0, meanVal * 0.66);
    const upper = Math.min(255, meanVal * 1.33);
    cv.Canny(blurred, edges, lower, upper);
    cv.morphologyEx(edges, closed, cv.MORPH_CLOSE, kernel);

    cv.findContours(closed, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    let bestScore = 0;
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);

      // Απορρίπτουμε ό,τι είναι πολύ μικρό (θόρυβος) ή σχεδόν όλο το frame (φόντο)
      if (area < imgArea * 0.05 || area > imgArea * 0.95) { contour.delete(); continue; }

      const peri = cv.arcLength(contour, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, 0.02 * peri, true);

      if (approx.rows === 4 && cv.isContourConvex(approx)) {
        // Ορθογωνικότητα με βάση το minAreaRect (περιστροφικά αμετάβλητο):
        // ένα πραγματικό έγγραφο —ακόμη κι αν είναι κεκλιμένο— γεμίζει σχεδόν
        // πλήρως το ελάχιστο περιστρεφόμενο ορθογώνιό του (~1), ενώ ακανόνιστα
        // "τετράπλευρα" από υφή/μοτίβα φόντου το γεμίζουν αρκετά λιγότερο.
        const minRect = cv.minAreaRect(approx);
        const rectArea = minRect.size.width * minRect.size.height;
        const rectangularity = rectArea > 0 ? area / rectArea : 0;

        // Πύλη: κρατάμε μόνο υποψήφια που είναι όντως «γεμάτα» ορθογώνια. Αυτό
        // κόβει ψευδώς θετικά από θορυβώδες/υφασμένο φόντο (πληκτρολόγιο, mousepad).
        if (rectangularity >= 0.7) {
          const score = area * rectangularity;
          if (score > bestScore) {
            bestScore = score;
            best?.delete();
            best = approx;
          } else {
            approx.delete();
          }
        } else {
          approx.delete();
        }
      } else {
        approx.delete();
      }
      contour.delete();
    }

    if (!best) return null;

    const pts = [];
    for (let i = 0; i < 4; i++) {
      pts.push({ x: best.data32S[i * 2], y: best.data32S[i * 2 + 1] });
    }
    return orderCorners(pts);
  } finally {
    gray.delete();
    blurred.delete();
    edges.delete();
    closed.delete();
    kernel.delete();
    contours.delete();
    hierarchy.delete();
    best?.delete();
  }
}
