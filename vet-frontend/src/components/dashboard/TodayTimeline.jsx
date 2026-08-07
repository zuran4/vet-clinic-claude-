import React, { forwardRef, useState } from "react";
import dayjs from "dayjs";
import { Calendar, CalendarDays, Clock, Stethoscope, Scissors, ChevronRight, Pencil, Trash2, Plus, CheckCircle2 } from "lucide-react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { el } from "date-fns/locale";
import AppointmentPreviewModal from "../appointments/AppointmentPreviewModal.jsx";
import WeekMonthAgendaModal from "./WeekMonthAgendaModal.jsx";
import { getClinicOccupancyClass, getGroomingOccupancyClass } from "../../utils/workingHours.js";
import { getTypeColor, getTypeDot } from "../../utils/appointmentTypeColors.js";

registerLocale("el", el);

function AppointmentItem({ appt, onClick, onConsult, onDelete }) {
  const isCompleted = appt.status === "completed";
  // Φόντο κάρτας = χρώμα τμήματος (στηθοσκόπιο/violet για Ιατρείο, ψαλίδι/sky
  // για Grooming) — ίδιο με το CompactAppointmentCard, ώστε dashboard και
  // πλήρες ημερολόγιο να δείχνουν με τον ίδιο τρόπο.
  const isGrooming = appt.doctor === "Grooming";
  return (
    <li className={`flex items-center gap-3 p-3 rounded-xl border transition-colors group ${
      isCompleted
        ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30"
        : isGrooming
        ? "bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800/30"
        : "bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800/30"
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
        {/* Mobile: 2 γραμμές — ώρα/πελάτης, divider, κατοικίδιο/λόγος */}
        <div className="sm:hidden flex-1 min-w-0">
          <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 min-w-0">
            <span className={`text-sm font-bold flex-shrink-0 ${isCompleted ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-200"}`}>{appt.time}</span>
            <span className={`text-sm font-medium break-words ${isCompleted ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-800 dark:text-gray-100"}`}>{appt.clientName}</span>
            {appt.showNewBadge && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex-shrink-0">
                Νέος
              </span>
            )}
          </div>
          <div className="my-1.5 border-t border-gray-200/70 dark:border-win-border/50" />
          <div className="flex items-center flex-wrap gap-2 min-w-0">
            <span className={`text-xs font-medium break-words ${isCompleted ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-600 dark:text-gray-300"}`}>{appt.animalName}</span>
            {isCompleted ? (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Ολοκληρώθηκε
              </span>
            ) : (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 truncate ${getTypeColor(appt.type)}`}>
                {Array.isArray(appt.type) ? appt.type.join(", ") : appt.type}
              </span>
            )}
          </div>
          {appt.notes && (
            <span title={appt.notes} className="inline-block mt-1 max-w-full truncate text-xs font-medium px-2 py-0.5 rounded-full bg-orange-300 text-black">
              {appt.notes}
            </span>
          )}
        </div>

        {/* Desktop: όνομα, πελάτης και τύπος κολλητά· κάνει wrap σε πολλές γραμμές αντί να κόβεται όταν το κείμενο είναι μεγάλο */}
        <span className={`hidden sm:inline text-sm font-bold w-12 flex-shrink-0 ${isCompleted ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-200"}`}>{appt.time}</span>
        <div className="hidden sm:flex items-center flex-wrap gap-x-1.5 gap-y-1 min-w-0 flex-shrink">
          <p className={`text-sm font-medium break-words ${isCompleted ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-800 dark:text-gray-100"}`}>{appt.animalName}</p>
          <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">·</span>
          <p className={`text-xs break-words ${isCompleted ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-400 dark:text-gray-500"}`}>{appt.clientName}</p>
          {appt.showNewBadge && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex-shrink-0">
              Νέος
            </span>
          )}
          {isCompleted ? (
            <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              Ολοκληρώθηκε
            </span>
          ) : (
            <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${getTypeColor(appt.type)}`}>
              {Array.isArray(appt.type) ? appt.type.join(", ") : appt.type}
            </span>
          )}
          {appt.notes && (
            <span title={appt.notes} className="inline-flex text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 max-w-[160px] truncate bg-orange-300 text-black">
              {appt.notes}
            </span>
          )}
        </div>
      </button>
      <button
        type="button"
        onClick={onClick}
        title="Επεξεργασία"
        className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-win-border/40 hover:bg-gray-200 dark:hover:bg-win-border/70 flex items-center justify-center flex-shrink-0 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
      </button>
      <button
        type="button"
        onClick={() => {
          if (window.confirm("Θέλεις σίγουρα να διαγράψεις το ραντεβού;")) {
            onDelete?.(appt._id);
          }
        }}
        title="Διαγραφή"
        className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-win-border/40 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center flex-shrink-0 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 hover:text-red-500" />
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

function Column({ title, icon: Icon, gradient, appointments, emptyText, onNew, onEditAppointment, onDeleteAppointment, onConsult, extra }) {
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
          // Σταθερό ύψος ~4 γραμμών· τα υπόλοιπα φαίνονται με scroll μέσα
          // στη στήλη (όχι στη σελίδα) όταν περνάει το ποντίκι από πάνω.
          <div className="max-h-[300px] overflow-y-auto pr-1">
            <ul className="space-y-2">
              {appointments.map((appt) => (
                <AppointmentItem
                  key={appt._id}
                  appt={appt}
                  onClick={() => onEditAppointment?.(appt)}
                  onConsult={() => onConsult?.(appt)}
                  onDelete={onDeleteAppointment}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TodayTimeline({ appointments = [], onNewAppointment, onEditAppointment, onDeleteAppointment, onJumpToDate }) {
  const [consultAppt, setConsultAppt] = useState(null);
  const [agendaMode, setAgendaMode] = useState(null); // null | "week" | "month"

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
    <WeekMonthAgendaModal
      isOpen={!!agendaMode}
      mode={agendaMode}
      appointments={appointments}
      onClose={() => setAgendaMode(null)}
      onEditAppointment={onEditAppointment}
      onDeleteAppointment={onDeleteAppointment}
      onConsult={setConsultAppt}
      onNewAppointment={onNewAppointment}
    />
    <div className="bg-white dark:bg-win-bg/30 border border-gray-200 dark:border-win-border rounded-2xl shadow-sm overflow-hidden">

      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-sky-400 to-indigo-500 px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-base leading-tight">Σημερινά Ραντεβού</p>
                <p className="text-white/70 text-xs mt-0.5 capitalize">{todayLabel}</p>
              </div>
            </div>
            {/* Σήμερα / Εβδομάδα / Μήνας — ανοίγουν πλήρη προβολή σε ξεχωριστό modal.
                Το "Σήμερα" ανοίγει το ίδιο modal σε mode="today" (πλήρες ωράριο
                ημέρας με διαθέσιμες + κλεισμένες ώρες) — όχι κάτι άλλο. */}
            <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 w-fit">
              <button
                type="button"
                onClick={() => setAgendaMode("today")}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                Σήμερα
              </button>
              <button
                type="button"
                onClick={() => setAgendaMode("week")}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                Εβδομάδα
              </button>
              <button
                type="button"
                onClick={() => setAgendaMode("month")}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                Μήνας
              </button>
            </div>
          </div>
          {todaysAppointments.length > 0 && (
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
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
            onEditAppointment={onEditAppointment}
            onDeleteAppointment={onDeleteAppointment}
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
            onEditAppointment={onEditAppointment}
            onDeleteAppointment={onDeleteAppointment}
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
