import React from "react";
import {
  User, Phone, Calendar, Clock,
  Stethoscope, Scissors, StickyNote, PawPrint,
} from "lucide-react";
import Modal from "../ui/Modal";
import { useCustomerPets } from "../../hooks/useCustomerPets";

const TYPE_COLORS = {
  "Εξέταση":       "bg-indigo-100 text-indigo-700",
  "Εμβόλιο":       "bg-green-100 text-green-700",
  "Αποπαρασίτωση": "bg-amber-100 text-amber-700",
  "Χειρουργείο":   "bg-red-100 text-red-700",
  "Στείρωση":      "bg-purple-100 text-purple-700",
  "Μπάνιο":        "bg-sky-100 text-sky-700",
  "Κούρεμα":       "bg-cyan-100 text-cyan-700",
  "Καλλωπισμός":   "bg-teal-100 text-teal-700",
  "Περιποίηση νυχιών": "bg-pink-100 text-pink-700",
};

function getTypeColor(type) {
  return TYPE_COLORS[type] || "bg-gray-100 text-gray-600";
}

function InfoRow({ icon: Icon, label, value, iconColor = "text-gray-400" }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className={`flex-shrink-0 ${iconColor}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-xs text-gray-400 w-20 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value || "—"}</span>
    </div>
  );
}

const AppointmentPreviewModal = ({ isOpen, onClose, appointment }) => {
  const ownerId =
    typeof appointment?.owner === "object"
      ? appointment?.owner._id
      : appointment?.owner || null;

  const { pets } = useCustomerPets(ownerId);

  if (!isOpen || !appointment) return null;

  const isGrooming = appointment.doctor === "Grooming";

  const headerBg = isGrooming
    ? "bg-gradient-to-r from-blue-500 to-cyan-400"
    : "bg-gradient-to-r from-green-500 to-emerald-400";

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className={`-mx-6 -mt-6 mb-5 px-6 pt-5 pb-4 rounded-t-2xl ${headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            {isGrooming
              ? <Scissors className="w-5 h-5" />
              : <Stethoscope className="w-5 h-5" />
            }
            <span className="font-semibold text-sm">{appointment.doctor}</span>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white`}>
            {appointment.type}
          </span>
        </div>

        <div className="mt-3 text-white">
          <div className="text-2xl font-bold">{appointment.time}</div>
          <div className="text-sm text-white/80 mt-0.5">
            {appointment.date} &middot; {appointment.duration} λεπτά
          </div>
        </div>
      </div>

      {/* Στοιχεία */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        {/* Αριστερά — Πελάτης */}
        <div className="bg-gray-50 rounded-2xl px-4 py-1 mb-3 sm:mb-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-3 pb-1">
            Πελάτης
          </p>
          <InfoRow icon={User}  label="Όνομα"     value={appointment.clientName} iconColor="text-indigo-400" />
          <InfoRow icon={Phone} label="Τηλέφωνο"  value={appointment.phone}      iconColor="text-indigo-400" />
        </div>

        {/* Δεξιά — Ραντεβού */}
        <div className="bg-gray-50 rounded-2xl px-4 py-1 mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-3 pb-1">
            Ραντεβού
          </p>
          <InfoRow icon={Calendar} label="Ημερομηνία" value={appointment.date}                  iconColor="text-emerald-400" />
          <InfoRow icon={Clock}    label="Ώρα"         value={appointment.time}                  iconColor="text-emerald-400" />
          <InfoRow icon={Clock}    label="Διάρκεια"    value={`${appointment.duration} λεπτά`}  iconColor="text-emerald-400" />
        </div>
      </div>

      {/* Σημειώσεις */}
      {appointment.notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex gap-3 mb-3">
          <StickyNote className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{appointment.notes}</p>
        </div>
      )}

      {/* Κατοικίδια */}
      {pets.length > 0 && (
        <div className="bg-gray-50 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <PawPrint className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Κατοικίδια πελάτη
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pets.map((pet) => (
              <span
                key={pet._id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-sm text-gray-700 shadow-sm"
              >
                <span className="font-medium">{pet.name}</span>
                <span className="text-gray-400 text-xs">{pet.species}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AppointmentPreviewModal;
