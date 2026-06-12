import React from "react";
import { Calendar, Clock, Stethoscope, Scissors } from "lucide-react";

const TYPE_COLORS = {
  "Εξέταση":       "bg-indigo-100 text-indigo-700",
  "Εμβόλιο":       "bg-green-100 text-green-700",
  "Αποπαρασίτωση": "bg-amber-100 text-amber-700",
  "Χειρουργείο":   "bg-red-100 text-red-700",
  "Στείρωση":      "bg-purple-100 text-purple-700",
};

const TYPE_DOT = {
  "Εξέταση":       "bg-indigo-400",
  "Εμβόλιο":       "bg-green-400",
  "Αποπαρασίτωση": "bg-amber-400",
  "Χειρουργείο":   "bg-red-400",
  "Στείρωση":      "bg-purple-400",
};

function getTypeColor(type) {
  return TYPE_COLORS[type] || "bg-gray-100 text-gray-600";
}

function getTypeDot(type) {
  return TYPE_DOT[type] || "bg-gray-400";
}

function AppointmentItem({ appt, onClick }) {
  return (
    <li
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-win-surface/40 border border-gray-100 dark:border-win-border/50 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-indigo-900/30 dark:hover:border-indigo-700/50 transition-colors"
    >
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getTypeDot(appt.type)}`} />
      <span className="text-sm font-bold text-gray-700 dark:text-gray-200 w-12 flex-shrink-0">
        {appt.time}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
          {appt.animalName}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
          {appt.clientName}
        </p>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${getTypeColor(appt.type)}`}>
        {appt.type}
      </span>
    </li>
  );
}

const MAX_VISIBLE = 4;

function Column({ title, icon: Icon, iconColor, appointments, emptyText, onShowAll, onEditAppointment }) {
  const visible = appointments.slice(0, MAX_VISIBLE);
  const remaining = appointments.length - MAX_VISIBLE;

  return (
    <div className="flex-1 min-w-0 space-y-3">
      {/* Column Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {title}
          </span>
          {appointments.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-win-elevated text-gray-600 dark:text-gray-300 text-xs font-bold">
              {appointments.length}
            </span>
          )}
        </div>
        <button
          onClick={onShowAll}
          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
        >
          Όλα →
        </button>
      </div>

      {/* Άδεια κατάσταση */}
      {appointments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-center gap-2 border border-dashed border-gray-200 dark:border-win-border rounded-xl">
          <Clock className="w-6 h-6 text-gray-300 dark:text-gray-600" />
          <p className="text-xs text-gray-400 dark:text-gray-500">{emptyText}</p>
        </div>
      )}

      {/* Λίστα — μέχρι MAX_VISIBLE */}
      {appointments.length > 0 && (
        <>
          <ul className="space-y-2">
            {visible.map((appt) => (
              <AppointmentItem
                key={appt._id}
                appt={appt}
                onClick={() => onEditAppointment?.(appt)}
              />
            ))}
          </ul>

          {/* "και X ακόμα" αν υπάρχουν περισσότερα */}
          {remaining > 0 && (
            <button
              onClick={onShowAll}
              className="w-full text-xs text-center text-indigo-500 hover:text-indigo-700 font-medium py-1.5 rounded-xl border border-dashed border-indigo-200 hover:border-indigo-300 transition-colors"
            >
              και {remaining} ακόμα →
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function TodayTimeline({ appointments = [], onShowAppointments, onEditAppointment }) {
  const today = new Date().toISOString().split("T")[0];

  const todaysAppointments = appointments
    .filter((a) => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  const clinicAppts   = todaysAppointments.filter((a) => (a.doctor || "Ιατρείο") === "Ιατρείο");
  const groomingAppts = todaysAppointments.filter((a) => a.doctor === "Grooming");

  return (
    <div className="bg-white dark:bg-win-bg/30 border border-gray-200 dark:border-win-border rounded-2xl shadow-sm p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-indigo-500" />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Σημερινά Ραντεβού
        </span>
        {todaysAppointments.length > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
            {todaysAppointments.length}
          </span>
        )}
      </div>

      {/* Διαχωριστής */}
      <div className="h-px bg-gray-100 dark:bg-win-elevated" />

      {/* Δύο στήλες */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Αριστερά: Ιατρείο */}
        <Column
          title="Ιατρείο"
          icon={Stethoscope}
          iconColor="text-green-500"
          appointments={clinicAppts}
          emptyText="Κανένα ραντεβού ιατρείου"
          onShowAll={onShowAppointments}
          onEditAppointment={onEditAppointment}
        />

        {/* Διαχωριστής: οριζόντιος σε mobile, κάθετος σε desktop */}
        <div className="w-full h-px md:w-px md:h-auto bg-gray-100 dark:bg-win-elevated flex-shrink-0" />

        {/* Δεξιά: Grooming */}
        <Column
          title="Grooming"
          icon={Scissors}
          iconColor="text-blue-500"
          appointments={groomingAppts}
          emptyText="Κανένα ραντεβού grooming"
          onShowAll={onShowAppointments}
          onEditAppointment={onEditAppointment}
        />
      </div>
    </div>
  );
}
