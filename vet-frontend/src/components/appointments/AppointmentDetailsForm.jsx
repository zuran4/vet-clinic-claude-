import React from "react";
import { Edit3, PlusCircle, Save, BookmarkPlus, FileText, Stethoscope, Scissors, User, Phone } from "lucide-react";

import PrescriptionModal from "../prescriptions/PrescriptionModal";
import CustomerSearchBox from "../customers/CustomerSearchBox";
import PetSelector from "../pets/PetSelector";
import TimeSelector from "../ui/TimeSelector";
import AppointmentFormFields from "./AppointmentFormFields";
import { Button } from "../ui/button";
import { useAppointmentForm } from "../../hooks/useAppointmentForm";

const AppointmentDetailsForm = ({ time, doctor, selectedDate, existingData, onSave, onCancel }) => {
  const {
    formData,
    setFormData,
    ownerId,
    setOwnerId,
    selectedPetId,
    setSelectedPetId,
    newPetSpecies,
    setNewPetSpecies,
    newPetGender,
    setNewPetGender,
    date,
    setDate,
    availableSlots,
    selectedTime,
    setSelectedTime,
    allCustomers,
    showPrescription,
    setShowPrescription,
    handleChange,
    handleSelectCustomer,
    handlePetChange,
    handleSubmit,
    handlePrescriptionSubmit,
  } = useAppointmentForm({ time, doctor, selectedDate, existingData, onSave });

  const optionsByDoctor = {
    Ιατρείο: ["Εμβολιασμός", "Στείρωση", "Εξέταση", "Chip"],
    Grooming: ["Μπάνιο", "Κούρεμα", "Καλλωπισμός", "Περιποίηση νυχιών"],
  };

  const isGrooming = doctor === "Grooming";

  const headerBg = isGrooming
    ? "bg-gradient-to-r from-blue-500 to-cyan-400"
    : "bg-gradient-to-r from-green-500 to-emerald-400";

  return (
    <div className="relative">
      {/* Header */}
      <div className={`-mx-6 -mt-6 mb-5 px-6 pt-5 pb-4 rounded-t-2xl ${headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            {isGrooming
              ? <Scissors className="w-5 h-5" />
              : <Stethoscope className="w-5 h-5" />
            }
            <span className="font-semibold text-sm">{doctor}</span>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white">
            {existingData ? "Επεξεργασία" : "Νέο Ραντεβού"}
          </span>
        </div>

        <div className="mt-3 text-white">
          <div className="text-2xl font-bold">{selectedTime || time}</div>
          <div className="text-sm text-white/80 mt-0.5">
            {existingData ? existingData.date : "Επιλογή ώρας & τύπου παρακάτω"}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Αλλαγή ώρας (μόνο σε επεξεργασία) */}
        {existingData && (
          <div className="bg-gray-50 rounded-2xl px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Ώρα & Ημερομηνία
            </p>
            <TimeSelector
              date={date}
              onChangeDate={setDate}
              availableSlots={availableSlots}
              selectedTime={selectedTime}
              onChangeTime={setSelectedTime}
            />
          </div>
        )}

        {/* Πελάτης */}
        <div className="bg-gray-50 rounded-2xl px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            Πελάτης
          </p>
          <CustomerSearchBox
            allCustomers={allCustomers}
            value={formData.clientName}
            onSelect={(customer) => {
              handleSelectCustomer(customer);
              setOwnerId(customer?.id || null);
            }}
          />
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="phone"
              placeholder="Τηλέφωνο"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-200 pl-9 pr-3 py-2 rounded-2xl shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        {/* Κατοικίδιο */}
        <div className="bg-gray-50 rounded-2xl px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Κατοικίδιο
          </p>
          <PetSelector
            ownerId={ownerId}
            selectedPetId={selectedPetId}
            animalName={formData.animalName}
            newPetSpecies={newPetSpecies}
            newPetGender={newPetGender}
            onChangePet={handlePetChange}
            onChangeAnimalName={(name) =>
              setFormData((prev) => ({ ...prev, animalName: name }))
            }
            onChangeSpecies={setNewPetSpecies}
            onChangeGender={setNewPetGender}
          />
        </div>

        {/* Τύπος, Διάρκεια, Σημειώσεις */}
        <div className="bg-gray-50 rounded-2xl px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Λεπτομέρειες
          </p>
          <AppointmentFormFields
            formData={formData}
            onChange={handleChange}
            optionsByDoctor={optionsByDoctor}
            doctor={doctor}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          {existingData && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowPrescription(true)}
              className="flex items-center gap-2 text-blue-600"
            >
              <FileText className="w-4 h-4" /> Συνταγή
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="danger" onClick={onCancel}>
              Ακύρωση
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={existingData && !selectedTime}
              className="flex items-center gap-2"
            >
              {existingData
                ? <><Save className="w-4 h-4" /> Αποθήκευση</>
                : <><BookmarkPlus className="w-4 h-4" /> Καταχώρηση</>
              }
            </Button>
          </div>
        </div>
      </form>

      <PrescriptionModal
        isOpen={showPrescription}
        onClose={() => setShowPrescription(false)}
        onSubmit={handlePrescriptionSubmit}
        initialData={existingData}
      />
    </div>
  );
};

export default AppointmentDetailsForm;
