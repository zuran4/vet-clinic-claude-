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

  // Αν είναι κλειστά και τα δύο → μήνυμα
  if (
    (!clinicSchedule || !clinicSchedule.enabled) &&
    (!groomingSchedule || !groomingSchedule.enabled)
  ) {
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
          ? "bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer shadow-sm"
          : "bg-green-50 border-green-200 hover:bg-green-100 cursor-pointer shadow-sm"
        : "bg-white border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer";

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
              <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                {slot.bookedBy}
              </p>
              <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isGroomingDoctor ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                {slot.type}
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
            <span className="mt-1 text-[10px] text-gray-300 group-hover:text-indigo-400 transition-colors">
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
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl mb-3 w-fit ${isGroomingSection ? "bg-blue-50 border border-blue-100" : "bg-green-50 border border-green-100"}`}>
          {isGroomingSection
            ? <Scissors className="w-4 h-4 text-blue-500" />
            : <Stethoscope className="w-4 h-4 text-green-500" />
          }
          <span className={`text-sm font-semibold ${isGroomingSection ? "text-blue-700" : "text-green-700"}`}>
            {doctorLabel}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">{rendered}</div>
      </div>
    );
  };

  return (
    <div className="p-4">
      {clinicSchedule?.enabled && renderSlots(slotsIatreio, "Ιατρείο")}
      {groomingSchedule?.enabled && renderSlots(slotsGrooming, "Grooming")}

      <AppointmentPreviewModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
      />
    </div>
  );
};

export default AppointmentSlots;
