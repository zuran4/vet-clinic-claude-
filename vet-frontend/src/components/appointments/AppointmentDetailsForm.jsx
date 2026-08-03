import React from "react";
import { Save, BookmarkPlus, FileText, Stethoscope, Scissors, X } from "lucide-react";
import { VISIT_REASONS } from "../../constants/visitReasons.js";

import PrescriptionModal from "../prescriptions/PrescriptionModal";
import CustomerSearchBox from "../customers/CustomerSearchBox";
import PetSelector from "../pets/PetSelector";
import TimeSelector from "../ui/TimeSelector";
import MultiSelectDropdown from "../ui/MultiSelectDropdown";
import { Button } from "../ui/button";
import { useAppointmentForm } from "../../hooks/useAppointmentForm";
import { getSlotDuration, formatDuration } from "../../utils/slotDuration.js";

const LABEL = "text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide";
const CONTROL = "w-full border border-gray-200 dark:border-win-border-light p-2 rounded-2xl text-sm shadow-sm bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300";

const AppointmentDetailsForm = ({ time, doctor, selectedDate, existingData, onSave, onCancel }) => {
  const {
    formData,
    setFormData,
    ownerId,
    setOwnerId,
    selectedPetId,
    selectedPetIds,
    togglePetId,
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
    Ιατρείο: VISIT_REASONS,
    Grooming: ["Μπάνιο", "Κούρεμα", "Καλλωπισμός", "Περιποίηση νυχιών"],
  };

  const isGrooming = doctor === "Grooming";

  // Η ελάχιστη διάρκεια είναι το slot που έχει οριστεί στις Ρυθμίσεις για το
  // συγκεκριμένο τμήμα (Ιατρείο/Grooming) — από εκεί και πάνω οι επιλογές
  // αυξάνονται ανά μισή ώρα (π.χ. slot 60' → 1 ώρα, 1:30, 2:00, ...).
  const slotDuration = getSlotDuration(doctor);
  const durationOptions = [];
  for (let d = slotDuration; d <= Math.max(slotDuration, 240); d += 30) {
    durationOptions.push(d);
  }

  const headerBg = isGrooming
    ? "bg-gradient-to-r from-blue-500 to-cyan-400"
    : "bg-gradient-to-r from-green-500 to-emerald-400";

  return (
    <div className="relative flex flex-col">
      {/* Header */}
      <div className={`px-5 pt-5 pb-4 rounded-t-2xl ${headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            {isGrooming
              ? <Scissors className="w-5 h-5" />
              : <Stethoscope className="w-5 h-5" />
            }
            <span className="font-semibold text-sm">{doctor}</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Κλείσιμο"
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 -m-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-2 sm:mt-3 text-white flex items-center justify-between gap-2">
          <div>
            <div className="text-xl sm:text-2xl font-bold">{selectedTime || time}</div>
            <div className="text-sm text-white/80 mt-0.5">
              {existingData ? existingData.date : "Επιλογή ώρας & τύπου παρακάτω"}
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white whitespace-nowrap">
            {existingData ? "Επεξεργασία" : "Νέο Ραντεβού"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-5 pt-4 pb-5 space-y-3">

        {/* Ώρα & Ημερομηνία (μόνο σε επεξεργασία) */}
        {existingData && (
          <div className="bg-gray-50 dark:bg-win-elevated/30 rounded-2xl px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Αριστερή στήλη: Πελάτης, Τύπος, Διάρκεια */}
          <div className="bg-gray-50 dark:bg-win-elevated/30 rounded-2xl px-4 py-3 space-y-3">
            <div>
              <p className={`${LABEL} mb-1.5`}>Πελάτης</p>
              <CustomerSearchBox
                allCustomers={allCustomers}
                value={formData.clientName}
                initialCustomer={ownerId ? { _id: ownerId, name: formData.clientName, phone: formData.phone } : null}
                onSelect={(customer) => {
                  handleSelectCustomer(customer);
                  setOwnerId(customer?.id || null);
                }}
              />
            </div>

            <div>
              <label className={`${LABEL} block mb-1.5`}>
                Τύπος <span className="normal-case font-normal tracking-normal text-gray-400 dark:text-gray-500">(μπορείς να διαλέξεις παραπάνω από έναν)</span>
              </label>
              <MultiSelectDropdown
                options={optionsByDoctor[doctor] || []}
                selected={formData.type}
                onChange={(next) => setFormData((prev) => ({ ...prev, type: next }))}
                placeholder="Επίλεξε τύπο ραντεβού..."
              />
            </div>

            <div>
              <label className={`${LABEL} block mb-1.5`}>Διάρκεια</label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className={CONTROL}
              >
                {durationOptions.map((d) => (
                  <option key={d} value={d}>{formatDuration(d)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Δεξιά στήλη: Κατοικίδιο */}
          <div className="bg-gray-50 dark:bg-win-elevated/30 rounded-2xl px-4 py-3">
            <p className={`${LABEL} mb-2`}>Κατοικίδιο</p>
            {existingData ? (
              <PetSelector
                ownerId={ownerId}
                selectedPetId={selectedPetId}
                onChangePet={handlePetChange}
              />
            ) : (
              <PetSelector
                ownerId={ownerId}
                multi
                selectedPetIds={selectedPetIds}
                onTogglePet={togglePetId}
              />
            )}
          </div>

          {/* Σημειώσεις — πλήρες πλάτος, κάτω από τις 2 στήλες */}
          <div className="sm:col-span-2 bg-gray-50 dark:bg-win-elevated/30 rounded-2xl px-4 py-3">
            <label className={`${LABEL} block mb-1.5`}>Σημειώσεις</label>
            <textarea
              name="notes"
              placeholder="Σημειώσεις (προαιρετικό)"
              value={formData.notes}
              onChange={handleChange}
              className={`${CONTROL} placeholder-gray-400 dark:placeholder-gray-500 resize-none`}
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
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
              disabled={
                (existingData && !selectedTime) ||
                formData.type.length === 0 ||
                (!existingData && selectedPetIds.length === 0)
              }
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
