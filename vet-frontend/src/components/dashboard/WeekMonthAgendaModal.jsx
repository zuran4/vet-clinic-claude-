import React from "react";
import dayjs from "dayjs";
import { X, Calendar, Stethoscope, Scissors, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { useModalScrollLock } from "../../hooks/useModalScrollLock.js";

const TYPE_COLORS = {
  "Εξέταση":       "bg-indigo-100 text-indigo-700",
  "Εμβόλιο":       "bg-green-100 text-green-700",
  "Αποπαρασίτωση": "bg-amber-100 text-amber-700",
  "Χειρουργείο":   "bg-red-100 text-red-700",
  "Στείρωση":      "bg-purple-100 text-purple-700",
  "Μπάνιο":        "bg-sky-100 text-sky-700",
  "Κούρεμα":       "bg-sky-100 text-sky-700",
  "Καλλωπισμός":   "bg-sky-100 text-sky-700",
  "Νύχια":         "bg-sky-100 text-sky-700",
  "Αυτιά":         "bg-sky-100 text-sky-700",
  "Αδένες":        "bg-sky-100 text-sky-700",
};

function firstType(type)    { return Array.isArray(type) ? type[0] : type; }
function getTypeColor(type) { return TYPE_COLORS[firstType(type)] || "bg-gray-100 text-gray-600"; }

// Πολύ συμπαγής, τετράγωνη κάρτα ραντεβού — μπαίνει μέσα σε στενή υπο-στήλη
// (Ιατρείο ή Grooming) κάτω από κάθε μέρα, οπότε δεν χρειάζεται εικονίδιο
// γιατρού (το δείχνει ήδη η στήλη) — μόνο ό,τι πληροφορία δεν χωράει αλλού.
function AgendaCard({ appt, onEdit, onConsult, onDelete }) {
  const isCompleted = appt.status === "completed";

  return (
    <li className={`rounded-md border p-1.5 transition-colors group ${
      isCompleted
        ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30"
        : "bg-gray-50 dark:bg-win-surface/40 border-gray-100 dark:border-win-border/50"
    }`}>
      <div className="flex items-center justify-between gap-0.5">
        <span className={`text-[11px] font-bold flex-shrink-0 ${isCompleted ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-200"}`}>
          {appt.time}
        </span>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => onEdit?.(appt)}
            title="Επεξεργασία"
            className="w-4 h-4 rounded bg-gray-100 dark:bg-win-border/40 hover:bg-gray-200 dark:hover:bg-win-border/70 flex items-center justify-center transition-colors"
          >
            <Pencil className="w-2 h-2 text-gray-400 dark:text-gray-500" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Θέλεις σίγουρα να διαγράψεις το ραντεβού;")) onDelete?.(appt._id);
            }}
            title="Διαγραφή"
            className="w-4 h-4 rounded bg-gray-100 dark:bg-win-border/40 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors"
          >
            <Trash2 className="w-2 h-2 text-gray-400 dark:text-gray-500 hover:text-red-500" />
          </button>
        </div>
      </div>
      <button type="button" onClick={() => onConsult?.(appt)} className="block w-full text-left hover:opacity-80 transition-opacity">
        <p className={`text-[11px] font-medium truncate leading-tight ${isCompleted ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-800 dark:text-gray-100"}`}>
          {appt.animalName}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate leading-tight">{appt.clientName}</p>
        {isCompleted ? (
          <span className="inline-flex items-center gap-0.5 mt-0.5 text-[9px] font-medium px-1 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="w-2 h-2" /> OK
          </span>
        ) : (
          <span className={`inline-block mt-0.5 text-[9px] font-medium px-1 py-0.5 rounded-full truncate max-w-full ${getTypeColor(appt.type)}`}>
            {(Array.isArray(appt.type) ? appt.type[0] : appt.type)}
          </span>
        )}
      </button>
    </li>
  );
}

function DayColumn({ g, onEditAppointment, onConsult, onDeleteAppointment }) {
  return (
    <div className="flex-shrink-0 w-[220px]">
      <p className="text-sm font-extrabold text-gray-800 dark:text-gray-100 tracking-wide mb-2 capitalize text-center">
        {dayjs(g.date).locale("el").format("dddd D MMM")}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {/* Ιατρείο */}
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Stethoscope className="w-3 h-3 text-indigo-400" />
          </div>
          <ul className="space-y-1">
            {g.clinic.map((appt) => (
              <AgendaCard
                key={appt._id}
                appt={appt}
                onEdit={onEditAppointment}
                onConsult={onConsult}
                onDelete={onDeleteAppointment}
              />
            ))}
          </ul>
        </div>
        {/* Grooming */}
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Scissors className="w-3 h-3 text-sky-400" />
          </div>
          <ul className="space-y-1">
            {g.grooming.map((appt) => (
              <AgendaCard
                key={appt._id}
                appt={appt}
                onEdit={onEditAppointment}
                onConsult={onConsult}
                onDelete={onDeleteAppointment}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// mode: "week" (επόμενες 7 μέρες) | "month" (επόμενες 30 μέρες)
const WeekMonthAgendaModal = ({ isOpen, mode, appointments = [], onClose, onEditAppointment, onDeleteAppointment, onConsult }) => {
  // Το κλείδωμα του body (position:fixed) παραμένει ενεργό όσο είναι ανοιχτό
  // το modal — το scroll-chaining fix του hook δεν εφαρμόζεται εδώ (η λίστα
  // κυλάει οριζόντια ανά μέρα, όχι σε ένα ενιαίο κάθετο container).
  useModalScrollLock(isOpen, true);

  if (!isOpen) return null;

  const today = dayjs().startOf("day");
  const rangeEnd = mode === "month" ? today.add(29, "day") : today.add(6, "day");

  const title = mode === "month" ? "Ραντεβού Μήνα" : "Ραντεβού Εβδομάδας";
  const label = `${today.locale("el").format("D MMM")} – ${rangeEnd.locale("el").format("D MMM")}`;

  const inRange = appointments
    .filter((a) => {
      const d = dayjs(a.date, "YYYY-MM-DD");
      return !d.isBefore(today, "day") && !d.isAfter(rangeEnd, "day");
    })
    .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));

  // Ομαδοποίηση ανά μέρα — μόνο μέρες που έχουν πράγματι ραντεβού, και μέσα
  // σε κάθε μέρα 2 υπο-στήλες: Ιατρείο | Grooming.
  const groups = [];
  for (const appt of inRange) {
    let g = groups[groups.length - 1];
    if (!g || g.date !== appt.date) {
      g = { date: appt.date, clinic: [], grooming: [] };
      groups.push(g);
    }
    (appt.doctor === "Grooming" ? g.grooming : g.clinic).push(appt);
  }

  // Στο μηνιαίο: οι μέρες μαζεύονται σε γραμμές ανά 7ήμερο — scroll προς τα
  // κάτω ανά εβδομάδα, όχι πλάγια σε ένα ατελείωτο οριζόντιο row. Στο
  // εβδομαδιαίο αυτό καταλήγει φυσικά σε μία μόνο γραμμή (ίδιο με πριν).
  const weekRows = [];
  for (const g of groups) {
    const weekIdx = Math.floor(dayjs(g.date, "YYYY-MM-DD").diff(today, "day") / 7);
    let row = weekRows[weekRows.length - 1];
    if (!row || row.weekIdx !== weekIdx) {
      row = { weekIdx, days: [] };
      weekRows.push(row);
    }
    row.days.push(g);
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-gray-800/70 p-2 sm:p-4"
      style={{ touchAction: "none" }}
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-win-surface rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-[95vw] xl:max-w-[1400px] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-400 to-indigo-500 px-5 py-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <p className="text-white font-bold text-base leading-tight truncate">{title}</p>
          </div>

          <p className="text-white text-base sm:text-lg font-extrabold text-center whitespace-nowrap capitalize">
            {label} · {inRange.length} ραντεβού
          </p>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body — γραμμές εβδομάδων η μία κάτω από την άλλη (scroll κάθετα),
            και μέσα σε κάθε γραμμή οι μέρες της εβδομάδας οριζόντια (scroll
            πλάγια μόνο αν δεν χωράνε). Το ύψος προσαρμόζεται στο περιεχόμενο
            μέχρι το max-h του modal. */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 no-scrollbar" style={{ touchAction: "auto" }}>
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <Calendar className="w-8 h-8 text-gray-200 dark:text-gray-700" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Δεν υπάρχουν ραντεβού σε αυτό το διάστημα.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {weekRows.map((row) => (
                <div key={row.weekIdx} className="flex gap-3 overflow-x-auto no-scrollbar">
                  {row.days.map((g) => (
                    <DayColumn
                      key={g.date}
                      g={g}
                      onEditAppointment={onEditAppointment}
                      onConsult={onConsult}
                      onDeleteAppointment={onDeleteAppointment}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeekMonthAgendaModal;
