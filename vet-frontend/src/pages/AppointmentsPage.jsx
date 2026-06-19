import React, { useState } from "react";
import dayjs from "dayjs";

import AppointmentSlots from "../components/appointments/AppointmentSlots";
import AppointmentDetailsForm from "../components/appointments/AppointmentDetailsForm";
import AppointmentHistoryPanel from "../components/appointments/AppointmentHistoryPanel";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";

import { Button } from "../components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays, History } from "lucide-react";
import { useAppointmentsFilters } from "../hooks/useAppointmentsFilters";

function AppointmentsPage({
  appointments,
  user,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  selectedDoctor,
  setSelectedDoctor,
  editingAppointment,
  setEditingAppointment,
  onSaveAppointment,
  onDeleteAppointment,
  onEditAppointment,
  onClose,
}) {
  const { filteredAppointments } = useAppointmentsFilters(appointments, selectedDate);
  const [tab, setTab] = useState("calendar");

  return (
    <>
      {/* Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <span className="text-lg sm:text-2xl whitespace-nowrap">Διαχείριση Ραντεβού</span>
          </div>
        }
        onClose={onClose}
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-win-elevated/50 rounded-2xl w-fit mb-4">
        <button
          type="button"
          onClick={() => setTab("calendar")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "calendar"
              ? "bg-white dark:bg-win-surface text-gray-800 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Ημερολόγιο
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "history"
              ? "bg-white dark:bg-win-surface text-gray-800 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <History className="w-4 h-4" />
          Ιστορικό
        </button>
      </div>

      {/* History panel */}
      {tab === "history" && <AppointmentHistoryPanel />}

      {/* Calendar view */}
      {tab === "calendar" && (
      <>
      {/* Date Navigator */}
      <div className="bg-gradient-to-r from-indigo-500 to-violet-400 rounded-2xl px-5 py-4 mb-5 flex items-center justify-between">
        <Button
          type="button"
          onClick={() => setSelectedDate(dayjs(selectedDate).subtract(1, "day").format("YYYY-MM-DD"))}
          className="bg-white/20 hover:bg-white/30 text-white border-0 shadow-none rounded-xl"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="text-center">
          <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-0.5">
            {dayjs(selectedDate).locale("el").format("MMMM YYYY")}
          </p>
          <p className="text-white text-xl font-bold">
            {dayjs(selectedDate).locale("el").format("dddd D")}
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setSelectedDate(dayjs(selectedDate).add(1, "day").format("YYYY-MM-DD"))}
          className="bg-white/20 hover:bg-white/30 text-white border-0 shadow-none rounded-xl"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Slots */}
      <AppointmentSlots
        date={selectedDate}
        startHour="09:00"
        endHour="17:00"
        slotDuration={30}
        appointments={filteredAppointments()}
        onSlotSelect={(time, doctor) => {
          setSelectedTime(time);
          setSelectedDoctor(doctor);
        }}
        onDelete={onDeleteAppointment}
        onEdit={onEditAppointment}
        user={user}
      />

      {/* Modal για ραντεβού */}
      <Modal
        isOpen={!!selectedTime}
        noPadding
        onClose={() => {
          setSelectedTime(null);
          setEditingAppointment(null);
        }}
      >
        <AppointmentDetailsForm
          time={selectedTime}
          doctor={selectedDoctor}
          selectedDate={selectedDate}
          existingData={editingAppointment}
          onSave={onSaveAppointment}
          onCancel={() => {
            setSelectedTime(null);
            setEditingAppointment(null);
          }}
        />
      </Modal>
      </>
      )}
    </>
  );
}

export default AppointmentsPage;
