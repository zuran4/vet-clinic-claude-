import React from "react";
import dayjs from "dayjs";

import AppointmentSlots from "../components/appointments/AppointmentSlots";
import AppointmentDetailsForm from "../components/appointments/AppointmentDetailsForm";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";

// se
import { Button } from "../components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useAppointmentsFilters } from "../hooks/useAppointmentsFilters"; // ✅ custom hook

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
  const { filteredAppointments } = useAppointmentsFilters(
    appointments,
    selectedDate
  );

  return (
    <>
      {/* Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <span>Διαχείριση Ραντεβού</span>
          </div>
        }
        onClose={onClose}
      />

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
  );
}

export default AppointmentsPage;
