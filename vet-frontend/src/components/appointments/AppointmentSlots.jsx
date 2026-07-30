import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import AppointmentPreviewModal from "./AppointmentPreviewModal";
import CompactSlotGrid from "./CompactSlotGrid.jsx";
import { Stethoscope, Scissors } from "lucide-react";
import { useAppointmentSlots } from "../../hooks/useAppointmentSlots";

const AppointmentSlots = ({
  date,
  slotDuration = 30,
  appointments = [],
  onSlotSelect,
  onDelete,
  onEdit,
  user,
  doctorFilter = null,
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Προεπιλεγμένο ωράριο (fallback όταν δεν υπάρχει localStorage)
  const defaultHours = {
    monday:    { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
    tuesday:   { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
    wednesday: { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
    thursday:  { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
    friday:    { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
    saturday:  { enabled: true,  intervals: [{ start: "10:00", end: "14:00" }] },
    sunday:    { enabled: false, intervals: [{ start: "09:00", end: "17:00" }] },
  };

  // 🔹 Φορτώνουμε clinic & grooming hours από localStorage
  const [clinicHours, setClinicHours] = useState(() => {
    const saved = localStorage.getItem("clinicWorkingHours");
    return saved ? JSON.parse(saved) : defaultHours;
  });
  const [groomingHours, setGroomingHours] = useState(() => {
    const saved = localStorage.getItem("groomingWorkingHours");
    return saved ? JSON.parse(saved) : {};
  });

  // 🔹 Αν αλλάξουν οι ρυθμίσεις (event από GeneralSettings), ενημερώνουμε
  useEffect(() => {
    const handleUpdate = (e) => {
      setClinicHours(e.detail.clinicWorkingHours || {});
      setGroomingHours(e.detail.groomingWorkingHours || {});
    };
    window.addEventListener("settings:workingHoursChanged", handleUpdate);
    return () =>
      window.removeEventListener("settings:workingHoursChanged", handleUpdate);
  }, []);

  // 🔹 Βρίσκουμε την ημέρα (always αγγλικά keys για settings)
  const dayKey = dayjs(date).locale("en").format("dddd").toLowerCase();
  const clinicSchedule = clinicHours?.[dayKey];
  const groomingSchedule = groomingHours?.[dayKey];

  // 🔹 Παίρνουμε intervals
  const clinicIntervals =
    clinicSchedule?.intervals || [{ start: "09:00", end: "17:00" }];
  const groomingIntervals =
    groomingSchedule?.intervals || [{ start: "09:00", end: "17:00" }];

  // ✅ Το hook καλείται με ξεχωριστά intervals
  const { slotsIatreio, slotsGrooming } = useAppointmentSlots({
    date,
    clinicIntervals,
    groomingIntervals,
    slotDuration,
    appointments,
  });

  // 🔹 Ποια τμήματα εμφανίζονται (φιλτράρισμα από "Όλα" στο Dashboard)
  const showClinic = (!doctorFilter || doctorFilter === "Ιατρείο") && clinicSchedule?.enabled;
  const showGrooming = (!doctorFilter || doctorFilter === "Grooming") && groomingSchedule?.enabled;

  // Αν δεν υπάρχει τίποτα να εμφανιστεί → μήνυμα
  if (!showClinic && !showGrooming) {
    return (
      <div className="p-6 text-center text-gray-500 italic">
        Το κτηνιατρείο είναι κλειστό ({dayjs(date).locale("el").format("dddd")})
      </div>
    );
  }

  const canEdit = user?.role === "admin";

  const renderSection = (slots, doctorLabel) => {
    const isGroomingSection = doctorLabel === "Grooming";
    return (
      <div className="mb-6">
        {/* Section Header */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl mb-3 w-fit ${isGroomingSection ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-700/50" : "bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-700/50"}`}>
          {isGroomingSection
            ? <Scissors className="w-4 h-4 text-blue-500" />
            : <Stethoscope className="w-4 h-4 text-green-500" />
          }
          <span className={`text-sm font-semibold ${isGroomingSection ? "text-blue-700 dark:text-blue-300" : "text-green-700 dark:text-green-300"}`}>
            {doctorLabel}
          </span>
        </div>

        <CompactSlotGrid
          slots={slots}
          slotDuration={slotDuration}
          doctor={doctorLabel}
          onSlotSelect={onSlotSelect}
          onEdit={onEdit}
          onConsult={setSelectedAppointment}
          onDelete={onDelete}
          canEdit={canEdit}
        />
      </div>
    );
  };

  return (
    <div className="p-4">
      {showClinic && renderSection(slotsIatreio, "Ιατρείο")}
      {showGrooming && renderSection(slotsGrooming, "Grooming")}

      <AppointmentPreviewModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
      />
    </div>
  );
};

export default AppointmentSlots;
