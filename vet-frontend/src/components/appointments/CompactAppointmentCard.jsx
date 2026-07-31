import React from "react";
import { Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { getTypeColor } from "../../utils/appointmentTypeColors.js";

// Πολύ συμπαγής, τετράγωνη κάρτα ραντεβού — κοινό component για το dashboard
// agenda (WeekMonthAgendaModal) ΚΑΙ για το ημερολόγιο ραντεβού (AppointmentSlots),
// ώστε να έχουν το ίδιο look χωρίς διπλό κώδικα.
export default function CompactAppointmentCard({ appt, onEdit, onConsult, onDelete, canEdit = true, className = "", style }) {
  const isCompleted = appt.status === "completed";
  // Φόντο κάρτας = χρώμα τμήματος (στηθοσκόπιο/violet για Ιατρείο, ψαλίδι/sky
  // για Grooming) — ίδιο χρώμα με το εικονίδιο του section header.
  const isGrooming = appt.doctor === "Grooming";

  return (
    <li
      style={style}
      className={`rounded-md border p-1 sm:p-1.5 transition-colors group ${
        isCompleted
          ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30"
          : isGrooming
          ? "bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800/30"
          : "bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800/30"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-px">
        <span className={`text-[10px] sm:text-[11px] font-bold flex-shrink-0 ${isCompleted ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-200"}`}>
          {appt.time}
        </span>
        {canEdit && (
          <div className="flex items-center gap-px flex-shrink-0">
            <button
              type="button"
              onClick={() => onEdit?.(appt)}
              title="Επεξεργασία"
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-gray-100 dark:bg-win-border/40 hover:bg-gray-200 dark:hover:bg-win-border/70 flex items-center justify-center transition-colors"
            >
              <Pencil className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-gray-400 dark:text-gray-500" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Θέλεις σίγουρα να διαγράψεις το ραντεβού;")) onDelete?.(appt._id);
              }}
              title="Διαγραφή"
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-gray-100 dark:bg-win-border/40 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors"
            >
              <Trash2 className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-gray-400 dark:text-gray-500 hover:text-red-500" />
            </button>
          </div>
        )}
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
