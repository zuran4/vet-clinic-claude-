// Κεντρικό mapping τύπου ραντεβού → χρώμα badge/dot.
//
// Πριν υπήρχαν 3 ξεχωριστά, ασύγχρονα αντίγραφα αυτού του mapping (σε
// CompactAppointmentCard, TodayTimeline, AppointmentHistoryPanel) και κανένα
// δεν ταίριαζε με τα πραγματικά strings τύπων ραντεβού — αποτέλεσμα: σχεδόν
// όλοι οι τύποι έπεφταν στο γκρι fallback. Τα keys εδώ πρέπει να ταιριάζουν
// ΑΚΡΙΒΩΣ με το constants/visitReasons.js (VISIT_REASONS) και με τα Grooming
// options του AppointmentDetailsForm.jsx.
export const TYPE_COLORS = {
  // Ιατρείο — VISIT_REASONS
  "Τακτικός έλεγχος":      "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
  "Εμβολιασμός":           "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  "Αποπαρασίτωση":         "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  "Microchip":             "bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300",
  "Στείρωση":              "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  "Χειρουργείο":           "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  "Επανέλεγχος":           "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  "Δέρμα / Αλλεργία":      "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300",
  "Γαστρεντερολογικό":     "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  "Αναπνευστικό":          "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300",
  "Ορθοπεδικό / Χωλότητα": "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
  "Οφθαλμολογικό":         "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
  "Ωτολογικό":             "bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300",
  "Οδοντολογικό":          "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
  "Ουρολογικό":            "bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300",
  "Νευρολογικό":           "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300",
  "Επείγον":               "bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200",

  // Grooming — options του AppointmentDetailsForm
  "Μπάνιο":            "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300",
  "Κούρεμα":           "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300",
  "Καλλωπισμός":       "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300",
  "Περιποίηση νυχιών": "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300",
};

// Συμπαγές χρώμα (χωρίς φόντο) — για μικρές κουκκίδες status.
export const TYPE_DOT_COLORS = {
  "Τακτικός έλεγχος":      "bg-indigo-400",
  "Εμβολιασμός":           "bg-green-400",
  "Αποπαρασίτωση":         "bg-amber-400",
  "Microchip":             "bg-slate-400",
  "Στείρωση":              "bg-purple-400",
  "Χειρουργείο":           "bg-red-400",
  "Επανέλεγχος":           "bg-blue-400",
  "Δέρμα / Αλλεργία":      "bg-pink-400",
  "Γαστρεντερολογικό":     "bg-orange-400",
  "Αναπνευστικό":          "bg-teal-400",
  "Ορθοπεδικό / Χωλότητα": "bg-yellow-400",
  "Οφθαλμολογικό":         "bg-violet-400",
  "Ωτολογικό":             "bg-lime-400",
  "Οδοντολογικό":          "bg-cyan-400",
  "Ουρολογικό":            "bg-fuchsia-400",
  "Νευρολογικό":           "bg-rose-400",
  "Επείγον":               "bg-red-500",
  "Μπάνιο":                "bg-sky-400",
  "Κούρεμα":               "bg-sky-400",
  "Καλλωπισμός":           "bg-sky-400",
  "Περιποίηση νυχιών":     "bg-sky-400",
};

const DEFAULT_COLOR = "bg-gray-100 dark:bg-win-elevated text-gray-600 dark:text-gray-400";
const DEFAULT_DOT = "bg-gray-400";

export function firstType(type) {
  return Array.isArray(type) ? type[0] : type;
}

export function getTypeColor(type) {
  return TYPE_COLORS[firstType(type)] || DEFAULT_COLOR;
}

export function getTypeDot(type) {
  return TYPE_DOT_COLORS[firstType(type)] || DEFAULT_DOT;
}
