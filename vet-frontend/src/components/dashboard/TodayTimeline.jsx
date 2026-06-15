import React, { forwardRef } from "react";
import dayjs from "dayjs";
import { Calendar, CalendarDays, Clock, Stethoscope, Scissors } from "lucide-react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { el } from "date-fns/locale";

registerLocale("el", el);

// 🔹 Προεπιλεγμένο ωράριο (fallback όταν δεν υπάρχει localStorage)
const SLOT_DURATION = 30;
const DEFAULT_WORKING_HOURS = {
  monday:    { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  tuesday:   { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  wednesday: { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  thursday:  { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  friday:    { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  saturday:  { enabled: true,  intervals: [{ start: "10:00", end: "14:00" }] },
  sunday:    { enabled: false, intervals: [{ start: "09:00", end: "17:00" }] },
};

// 🔹 Διαθέσιμα λεπτά για μια ημέρα (βάσει ωραρίου από localStorage)
function getAvailableMinutes(date, storageKey) {
  const saved = localStorage.getItem(storageKey);
  const workingHours = saved ? JSON.parse(saved) : DEFAULT_WORKING_HOURS;
  const dayKey = dayjs(date).locale("en").format("dddd").toLowerCase();
  const schedule = workingHours?.[dayKey];

  if (!schedule || !schedule.enabled) return 0;

  const intervals = schedule.intervals || [{ start: "09:00", end: "17:00" }];
  return intervals.reduce((sum, { start, end }) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return sum + ((eh * 60 + em) - (sh * 60 + sm));
  }, 0);
}

// 🔹 Επιστρέφει class για χρωματισμό ημέρας βάσει πληρότητας
// (μετράμε δεσμευμένα λεπτά, όχι αριθμό ραντεβού — ένα ραντεβού 90' "πιάνει" όσο 3 slot των 30')
function getOccupancyClass(date, appointments, { storageKey, doctor }) {
  const availableMinutes = getAvailableMinutes(date, storageKey);
  if (!availableMinutes) return undefined;

  const dateStr = dayjs(date).format("YYYY-MM-DD");
  const bookedMinutes = appointments
    .filter((a) => a.date === dateStr && (a.doctor || "Ιατρείο") === doctor)
    .reduce((sum, a) => sum + (a.duration || SLOT_DURATION), 0);

  const ratio = bookedMinutes / availableMinutes;
  if (ratio > 0.89) return "day-occupancy-high";
  if (ratio > 0.51) return "day-occupancy-medium";
  if (ratio > 0.2) return "day-occupancy-mid";
  return "day-occupancy-low";
}

function getClinicOccupancyClass(date, appointments) {
  return getOccupancyClass(date, appointments, { storageKey: "clinicWorkingHours", doctor: "Ιατρείο" });
}

function getGroomingOccupancyClass(date, appointments) {
  return getOccupancyClass(date, appointments, { storageKey: "groomingWorkingHours", doctor: "Grooming" });
}

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

const JumpToDateButton = forwardRef(({ onClick }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    title="Μετάβαση σε ημερομηνία"
    className="inline-flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-lg bg-gray-50 dark:bg-win-elevated2 sm:bg-transparent sm:dark:bg-transparent border border-gray-200 dark:border-win-border-light sm:border-0 shadow-sm sm:shadow-none text-xs font-medium text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-700/50 sm:hover:border-transparent transition-colors"
  >
    <CalendarDays className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
    <span className="hidden sm:inline">Μετάβαση σε ημέρα</span>
  </button>
));

const MAX_VISIBLE = 4;

function Column({ title, icon: Icon, iconColor, appointments, emptyText, onShowAll, onEditAppointment, extra }) {
  const visible = appointments.slice(0, MAX_VISIBLE);
  const remaining = appointments.length - MAX_VISIBLE;

  return (
    <div className="flex-1 min-w-0 space-y-3">
      {/* Column Header */}
      <div className="grid grid-cols-3 items-center">
        <div className="flex items-center gap-2 justify-self-start">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <span className="text-base font-semibold text-gray-700 dark:text-gray-200">
            {title}
          </span>
          {appointments.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-win-elevated text-gray-600 dark:text-gray-300 text-xs font-bold">
              {appointments.length}
            </span>
          )}
        </div>
        <div className="justify-self-center">{extra}</div>
        <button
          onClick={onShowAll}
          className="justify-self-end text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
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

export default function TodayTimeline({ appointments = [], onShowAppointments, onEditAppointment, onJumpToDate }) {
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
          extra={
            onJumpToDate && (
              <DatePicker
                locale="el"
                dateFormat="dd/MM/yyyy"
                onChange={(date) => date && onJumpToDate(date)}
                customInput={<JumpToDateButton />}
                popperPlacement="bottom"
                portalId="datepicker-portal"
                dayClassName={(date) => getClinicOccupancyClass(date, appointments)}
              />
            )
          }
        />

        {/* Διαχωριστής: οριζόντιος σε mobile, κάθετος σε desktop */}
        <div className="w-full h-px md:w-px md:h-auto bg-gray-200 dark:bg-win-border md:bg-gray-100 md:dark:bg-win-elevated flex-shrink-0" />

        {/* Δεξιά: Grooming */}
        <Column
          title="Grooming"
          icon={Scissors}
          iconColor="text-blue-500"
          appointments={groomingAppts}
          emptyText="Κανένα ραντεβού grooming"
          onShowAll={onShowAppointments}
          onEditAppointment={onEditAppointment}
          extra={
            onJumpToDate && (
              <DatePicker
                locale="el"
                dateFormat="dd/MM/yyyy"
                onChange={(date) => date && onJumpToDate(date)}
                customInput={<JumpToDateButton />}
                popperPlacement="bottom"
                portalId="datepicker-portal"
                dayClassName={(date) => getGroomingOccupancyClass(date, appointments)}
              />
            )
          }
        />
      </div>
    </div>
  );
}
