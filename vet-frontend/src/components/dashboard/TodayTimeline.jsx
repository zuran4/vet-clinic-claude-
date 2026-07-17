import React, { forwardRef, useState } from "react";
import dayjs from "dayjs";
import { Calendar, CalendarDays, Clock, Stethoscope, Scissors, ChevronRight, Pencil, Plus, StickyNote, CheckCircle2 } from "lucide-react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { el } from "date-fns/locale";
import AppointmentPreviewModal from "../appointments/AppointmentPreviewModal.jsx";
import { getClinicOccupancyClass, getGroomingOccupancyClass } from "../../utils/workingHours.js";

registerLocale("el", el);

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

const TYPE_DOT = {
  "Εξέταση":       "bg-indigo-400",
  "Εμβόλιο":       "bg-green-400",
  "Αποπαρασίτωση": "bg-amber-400",
  "Χειρουργείο":   "bg-red-400",
  "Στείρωση":      "bg-purple-400",
  "Μπάνιο":        "bg-sky-400",
  "Κούρεμα":       "bg-sky-400",
  "Καλλωπισμός":   "bg-sky-400",
  "Νύχια":         "bg-sky-400",
  "Αυτιά":         "bg-sky-400",
  "Αδένες":        "bg-sky-400",
};

function firstType(type)    { return Array.isArray(type) ? type[0] : type; }
function getTypeColor(type) { return TYPE_COLORS[firstType(type)] || "bg-gray-100 text-gray-600"; }
function getTypeDot(type)   { return TYPE_DOT[firstType(type)]    || "bg-gray-400"; }

function AppointmentItem({ appt, onClick, onConsult }) {
  const isCompleted = appt.status === "completed";
  return (
    <li className={`flex items-center gap-3 p-3 rounded-xl border transition-colors group ${
      isCompleted
        ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30"
        : "bg-gray-50 dark:bg-win-surface/40 border-gray-100 dark:border-win-border/50"
    }`}>
      {isCompleted ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      ) : (
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getTypeDot(appt.type)}`} />
      )}
      <button
        type="button"
        onClick={onConsult}
        className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
      >
        <span className={`text-sm font-bold w-12 flex-shrink-0 ${isCompleted ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-200"}`}>{appt.time}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isCompleted ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-800 dark:text-gray-100"}`}>{appt.animalName}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{appt.clientName}</p>
          {appt.notes && (
            <p title={appt.notes} className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 truncate mt-0.5">
              <StickyNote className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{appt.notes}</span>
            </p>
          )}
        </div>
        {isCompleted ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Ολοκληρώθηκε
          </span>
        ) : (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${getTypeColor(appt.type)}`}>
            {Array.isArray(appt.type) ? appt.type.join(", ") : appt.type}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onClick}
        title="Επεξεργασία"
        className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-win-border/40 hover:bg-gray-200 dark:hover:bg-win-border/70 flex items-center justify-center flex-shrink-0 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
      </button>
    </li>
  );
}

const JumpToDateButton = forwardRef(({ onClick }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    title="Μετάβαση σε ημερομηνία"
    className="inline-flex items-center justify-center gap-1.5 w-8 h-8 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-medium transition-colors"
  >
    <CalendarDays className="w-3.5 h-3.5" />
    <span className="hidden sm:inline text-xs">Ημερομηνία</span>
  </button>
));

const MAX_VISIBLE = 4;

function Column({ title, icon: Icon, gradient, appointments, emptyText, onNew, onShowAll, onEditAppointment, onConsult, extra }) {
  const visible = appointments.slice(0, MAX_VISIBLE);
  const remaining = appointments.length - MAX_VISIBLE;

  return (
    <div className="flex-1 min-w-0 rounded-2xl border border-gray-100 dark:border-win-border overflow-hidden">
      {/* Column sub-header */}
      <div className={`bg-gradient-to-r ${gradient} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-white/80" />
          <span className="text-sm font-bold text-white">{title}</span>
          {appointments.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white text-xs font-bold">
              {appointments.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {extra}
          <button
            onClick={onNew}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 hover:border-white/40 text-white text-xs font-semibold tracking-wide transition-all shadow-sm"
          >
            <Plus className="w-3 h-3" />
            <span>Νέο</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 bg-white dark:bg-win-bg/30">
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <Clock className="w-6 h-6 text-gray-200 dark:text-gray-700" />
            <p className="text-xs text-gray-400 dark:text-gray-500">{emptyText}</p>
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {visible.map((appt) => (
                <AppointmentItem
                  key={appt._id}
                  appt={appt}
                  onClick={() => onEditAppointment?.(appt)}
                  onConsult={() => onConsult?.(appt)}
                />
              ))}
            </ul>
            {remaining > 0 && (
              <button
                onClick={onShowAll}
                className="mt-2 w-full text-xs text-center text-indigo-500 hover:text-indigo-700 font-medium py-1.5 rounded-xl border border-dashed border-indigo-200 hover:border-indigo-300 transition-colors"
              >
                και {remaining} ακόμα →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function TodayTimeline({ appointments = [], onShowAppointments, onNewAppointment, onEditAppointment, onJumpToDate }) {
  const [consultAppt, setConsultAppt] = useState(null);

  const today = new Date().toISOString().split("T")[0];
  const todayLabel = dayjs().locale("el").format("dddd D MMMM");

  const todaysAppointments = appointments
    .filter((a) => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  const clinicAppts   = todaysAppointments.filter((a) => (a.doctor || "Ιατρείο") === "Ιατρείο");
  const groomingAppts = todaysAppointments.filter((a) => a.doctor === "Grooming");

  return (
    <>
    <AppointmentPreviewModal
      isOpen={!!consultAppt}
      appointment={consultAppt}
      onClose={() => setConsultAppt(null)}
      initialTab="consult"
    />
    <div className="bg-white dark:bg-win-bg/30 border border-gray-200 dark:border-win-border rounded-2xl shadow-sm overflow-hidden">

      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-sky-400 to-indigo-500 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Σημερινά Ραντεβού</p>
              <p className="text-white/70 text-xs mt-0.5 capitalize">{todayLabel}</p>
            </div>
          </div>
          {todaysAppointments.length > 0 && (
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
              {todaysAppointments.length} σήμερα
            </span>
          )}
        </div>
      </div>

      {/* Columns */}
      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Column
            title="Ιατρείο"
            icon={Stethoscope}
            gradient="from-indigo-400 to-indigo-500"
            appointments={clinicAppts}
            emptyText="Κανένα ραντεβού ιατρείου"
            onNew={() => onNewAppointment?.("Ιατρείο")}
            onShowAll={() => onShowAppointments?.("Ιατρείο")}
            onEditAppointment={onEditAppointment}
            onConsult={setConsultAppt}
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

          <Column
            title="Grooming"
            icon={Scissors}
            gradient="from-sky-400 to-sky-500"
            appointments={groomingAppts}
            emptyText="Κανένα ραντεβού grooming"
            onNew={() => onNewAppointment?.("Grooming")}
            onShowAll={() => onShowAppointments?.("Grooming")}
            onEditAppointment={onEditAppointment}
            onConsult={setConsultAppt}
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
    </div>
    </>
  );
}
