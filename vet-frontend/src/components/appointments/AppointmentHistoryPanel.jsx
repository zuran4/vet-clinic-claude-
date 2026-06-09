import React, { useState } from "react";
import { Search, Calendar, Stethoscope, Scissors, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import dayjs from "dayjs";
import { useAppointmentSearch } from "../../hooks/useAppointmentSearch.js";
import AppointmentPreviewModal from "./AppointmentPreviewModal.jsx";

const TYPE_COLORS = {
  "Εξέταση":       "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
  "Εμβόλιο":       "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  "Αποπαρασίτωση": "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  "Χειρουργείο":   "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  "Στείρωση":      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  "Μπάνιο":        "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300",
  "Κούρεμα":       "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
  "Καλλωπισμός":   "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300",
};

const DOCTORS = ["", "Ιατρείο", "Grooming"];

export default function AppointmentHistoryPanel() {
  const {
    q, setQ,
    from, setFrom,
    to, setTo,
    doctor, setDoctor,
    page, setPage,
    results, total, pages, loading,
  } = useAppointmentSearch();

  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-4">
      {/* Φίλτρα */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
        {/* Αναζήτηση κειμένου */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Αναζήτηση με όνομα πελάτη ή ζώου..."
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        {/* Ημερομηνία + Doctor */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[140px]">
            <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-2.5 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              title="Από"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[140px]">
            <span className="text-gray-400 dark:text-gray-500 text-sm flex-shrink-0">έως</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-2.5 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              title="Έως"
            />
          </div>
          <select
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Όλοι οι γιατροί</option>
            {DOCTORS.filter(Boolean).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Αποτελέσματα */}
      <div className="space-y-2">
        {/* Summary */}
        {!loading && (
          <p className="text-xs text-gray-400 dark:text-gray-500 px-1">
            {total === 0 ? "Δεν βρέθηκαν αποτελέσματα" : `${total} ραντεβού`}
          </p>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 py-14 text-center">
            <Clock className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {q || from || to || doctor
                ? "Δεν βρέθηκαν ραντεβού με αυτά τα κριτήρια."
                : "Χρησιμοποίησε τα φίλτρα για αναζήτηση."}
            </p>
          </div>
        ) : (
          results.map((appt) => {
            const typeClass = TYPE_COLORS[appt.type] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
            const isGrooming = appt.doctor === "Grooming";
            return (
              <button
                key={appt._id}
                type="button"
                onClick={() => setSelected(appt)}
                className="w-full text-left bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-3 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all group"
              >
                <div className="flex items-center gap-3">
                  {/* Accent line */}
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${isGrooming ? "bg-gradient-to-b from-blue-400 to-cyan-400" : "bg-gradient-to-b from-green-400 to-emerald-500"}`} />

                  {/* Doctor icon */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isGrooming ? "bg-blue-50 dark:bg-blue-900/30" : "bg-green-50 dark:bg-green-900/30"}`}>
                    {isGrooming
                      ? <Scissors className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      : <Stethoscope className="w-4 h-4 text-green-600 dark:text-green-400" />
                    }
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                        {appt.animalName}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>
                      <span className="text-gray-600 dark:text-gray-300 text-sm">{appt.clientName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeClass}`}>
                        {appt.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {dayjs(appt.date).format("DD/MM/YYYY")}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{appt.time}</span>
                      {appt.phone && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">{appt.phone}</span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 flex-shrink-0" />
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Προηγούμενη
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Σελίδα <span className="font-semibold text-gray-600 dark:text-gray-300">{page}</span> από {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, pages))}
            disabled={page >= pages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Επόμενη <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preview Modal */}
      <AppointmentPreviewModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        appointment={selected}
      />
    </div>
  );
}
