import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import AppointmentPreviewModal from "./AppointmentPreviewModal";
import { Edit3, Trash2, Stethoscope, Scissors } from "lucide-react";
import { Button } from "../ui/button";
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

  // 🔹 Rendering helper
  const renderSlots = (slots, doctorLabel) => {
    const rendered = [];
    let i = 0;

    while (i < slots.length) {
      const slot = slots[i];
      if (slot.isMerged) {
        i++;
        continue;
      }

      const duration = slot.duration || slotDuration;
      const colSpan = Math.max(1, duration / slotDuration);
      const startTime = dayjs(`${date}T${slot.time}`);
      const endTime = startTime.add(duration, "minute");

      for (let j = 1; j < colSpan; j++) {
        if (slots[i + j]) slots[i + j].isMerged = true;
      }

      const isBooked = !!slot.bookedBy;
      const isGroomingDoctor = slot.doctor === "Grooming";

      // Styling ανά κατάσταση
      const slotClass = isBooked
        ? isGroomingDoctor
          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer shadow-sm"
          : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer shadow-sm"
        : "bg-white dark:bg-win-elevated border-dashed border-gray-200 dark:border-win-border-light hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 cursor-pointer";

      rendered.push(
        <div
          key={`${doctorLabel}-${slot.time}`}
          className={`group flex flex-col border rounded-2xl p-2.5 text-sm relative transition-all ${slotClass}`}
          style={{
            flexBasis: `${colSpan * 100}px`,
            flexGrow: colSpan,
            minWidth: `${colSpan * 100}px`,
          }}
          onClick={() => {
            if (isBooked) {
              setSelectedAppointment(slot.appointment);
            } else {
              onSlotSelect(slot.time, doctorLabel);
            }
          }}
        >
          {/* Ώρα */}
          <span className={`text-xs font-semibold ${isBooked ? (isGroomingDoctor ? "text-blue-600" : "text-green-600") : "text-gray-400"}`}>
            {startTime.format("HH:mm")} – {endTime.format("HH:mm")}
          </span>

          {isBooked ? (
            <div className="mt-1.5 space-y-0.5">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
                {slot.bookedBy}
              </p>
              <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isGroomingDoctor ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                {Array.isArray(slot.type) ? slot.type.join(", ") : slot.type}
              </span>

              {user?.role === "admin" && (
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onEdit(slot.appointment); }}
                    className="rounded-full w-6 h-6 bg-white/80 hover:bg-white shadow-sm"
                    title="Επεξεργασία"
                  >
                    <Edit3 className="w-3 h-3 text-gray-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Θέλεις σίγουρα να διαγράψεις το ραντεβού;")) {
                        onDelete(slot.id);
                      }
                    }}
                    className="rounded-full w-6 h-6 bg-white/80 hover:bg-red-50 shadow-sm"
                    title="Διαγραφή"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <span className="mt-1 text-[10px] text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 dark:group-hover:text-indigo-400 transition-colors">
              + Νέο
            </span>
          )}
        </div>
      );

      i++;
    }

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

        <div className="flex flex-wrap gap-2">{rendered}</div>
      </div>
    );
  };

  return (
    <div className="p-4">
      {showClinic && renderSlots(slotsIatreio, "Ιατρείο")}
      {showGrooming && renderSlots(slotsGrooming, "Grooming")}

      <AppointmentPreviewModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
      />
    </div>
  );
};

export default AppointmentSlots;
