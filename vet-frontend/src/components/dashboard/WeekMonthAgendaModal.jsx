import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { X, Calendar, Stethoscope, Scissors } from "lucide-react";
import { useModalScrollLock } from "../../hooks/useModalScrollLock.js";
import { useAppointmentSlots } from "../../hooks/useAppointmentSlots.jsx";
import CompactAppointmentCard from "../appointments/CompactAppointmentCard.jsx";
import CompactSlotGrid from "../appointments/CompactSlotGrid.jsx";

// Προεπιλεγμένο ωράριο (fallback όταν δεν υπάρχει localStorage) — ίδιο με
// αυτό του AppointmentSlots.jsx, ώστε η προβολή "Σήμερα" εδώ να δείχνει το
// ίδιο πραγματικό ωράριο λειτουργίας.
const DEFAULT_HOURS = {
  monday:    { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  tuesday:   { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  wednesday: { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  thursday:  { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  friday:    { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  saturday:  { enabled: true,  intervals: [{ start: "10:00", end: "14:00" }] },
  sunday:    { enabled: false, intervals: [{ start: "09:00", end: "17:00" }] },
};

function DayColumn({ g, onEditAppointment, onConsult, onDeleteAppointment }) {
  return (
    <div className="flex-shrink-0 w-[220px]">
      <p className="text-sm font-extrabold text-gray-800 dark:text-gray-100 tracking-wide mb-2 capitalize text-center">
        {dayjs(g.date).locale("el").format("dddd D MMM")}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {/* Ιατρείο */}
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Stethoscope className="w-3 h-3 text-indigo-400" />
          </div>
          {g.clinicEnabled ? (
            <ul className="space-y-1">
              {g.clinic.map((appt) => (
                <CompactAppointmentCard
                  key={appt._id}
                  appt={appt}
                  onEdit={onEditAppointment}
                  onConsult={onConsult}
                  onDelete={onDeleteAppointment}
                />
              ))}
            </ul>
          ) : (
            <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 italic py-2">Κλειστό</p>
          )}
        </div>
        {/* Grooming */}
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Scissors className="w-3 h-3 text-sky-400" />
          </div>
          {g.groomingEnabled ? (
            <ul className="space-y-1">
              {g.grooming.map((appt) => (
                <CompactAppointmentCard
                  key={appt._id}
                  appt={appt}
                  onEdit={onEditAppointment}
                  onConsult={onConsult}
                  onDelete={onDeleteAppointment}
                />
              ))}
            </ul>
          ) : (
            <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 italic py-2">Κλειστό</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile-only: μέσα σε κάθε μέρα, Ιατρείο και Grooming είναι 2 ξεχωριστές
// ενότητες η μία κάτω από την άλλη (όχι δίπλα-δίπλα σαν στο desktop), και τα
// ραντεβού μέσα σε κάθε ενότητα μπαίνουν σε πλέγμα 4 ανά γραμμή — όσα δεν
// χωράνε πάνε αυτόματα (wrap) σε επόμενη γραμμή.
function MobileDaySection({ label, Icon, iconColor, enabled, appts, onEdit, onConsult, onDelete }) {
  if (enabled && appts.length === 0) return null;
  return (
    <div>
      <div className="flex items-center justify-center gap-1 mb-1">
        <Icon className={`w-3 h-3 ${iconColor}`} />
        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">{label}</span>
      </div>
      {enabled ? (
        <ul className="grid grid-cols-4 gap-1">
          {appts.map((appt) => (
            <CompactAppointmentCard key={appt._id} appt={appt} onEdit={onEdit} onConsult={onConsult} onDelete={onDelete} />
          ))}
        </ul>
      ) : (
        <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 italic py-1">Κλειστό</p>
      )}
    </div>
  );
}

function MobileDayBlock({ g, onEditAppointment, onConsult, onDeleteAppointment }) {
  return (
    <div className="border-b border-gray-100 dark:border-win-border/40 pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm font-extrabold text-gray-800 dark:text-gray-100 tracking-wide mb-2 capitalize text-center">
        {dayjs(g.date).locale("el").format("dddd D MMM")}
      </p>
      <div className="flex flex-col gap-2">
        <MobileDaySection
          label="Ιατρείο"
          Icon={Stethoscope}
          iconColor="text-indigo-400"
          enabled={g.clinicEnabled}
          appts={g.clinic}
          onEdit={onEditAppointment}
          onConsult={onConsult}
          onDelete={onDeleteAppointment}
        />
        <MobileDaySection
          label="Grooming"
          Icon={Scissors}
          iconColor="text-sky-400"
          enabled={g.groomingEnabled}
          appts={g.grooming}
          onEdit={onEditAppointment}
          onConsult={onConsult}
          onDelete={onDeleteAppointment}
        />
      </div>
    </div>
  );
}

// Προβολή "Σήμερα": πλήρες ωράριο ημέρας — δείχνει και τα κλεισμένα ραντεβού
// ΚΑΙ τις κενές, διαθέσιμες ώρες (κλικ → δημιουργία νέου ραντεβού), βάσει του
// πραγματικού ωραρίου λειτουργίας (clinicIntervals/groomingIntervals).
function TodaySlotsSection({ title, Icon, iconColor, enabled, slots, slotDuration, doctor, onSlotSelect, onEdit, onConsult, onDelete }) {
  return (
    <div className="w-full sm:flex-1 min-w-0">
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{title}</span>
      </div>
      {!enabled ? (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 italic py-8">Κλειστό σήμερα</p>
      ) : (
        <CompactSlotGrid
          slots={slots}
          slotDuration={slotDuration}
          doctor={doctor}
          onSlotSelect={onSlotSelect}
          onEdit={onEdit}
          onConsult={onConsult}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

// mode: "today" (μόνο σήμερα) | "week" (επόμενες 7 μέρες) | "month" (επόμενες 30 μέρες)
const WeekMonthAgendaModal = ({ isOpen, mode, appointments = [], onClose, onEditAppointment, onDeleteAppointment, onConsult, onNewAppointment }) => {
  // Το κλείδωμα του body (position:fixed) παραμένει ενεργό όσο είναι ανοιχτό
  // το modal — το scroll-chaining fix του hook δεν εφαρμόζεται εδώ (η λίστα
  // κυλάει οριζόντια ανά μέρα, όχι σε ένα ενιαίο κάθετο container).
  useModalScrollLock(isOpen, true);

  // Εσωτερικό view mode ώστε να αλλάζει Σήμερα/Εβδομάδα/Μήνας μέσα από το
  // ίδιο το modal (κουμπιά στο header), χωρίς να χρειάζεται να κλείσει και να
  // ξανανοίξει από το dashboard. Συγχρονίζεται με το mode prop κάθε φορά που
  // ανοίγει το modal από έξω.
  const [viewMode, setViewMode] = useState(mode);
  useEffect(() => {
    if (isOpen) setViewMode(mode);
  }, [isOpen, mode]);

  const today = dayjs().startOf("day");
  const todayStr = today.format("YYYY-MM-DD");
  const todayDayKey = today.locale("en").format("dddd").toLowerCase();

  // Πλήρες ωράριο ημέρας (Ιατρείο/Grooming) για την προβολή "Σήμερα" — δείχνει
  // ΚΑΙ τις διαθέσιμες (κενές) ώρες, όχι μόνο τα ήδη κλεισμένα ραντεβού.
  let clinicHours = DEFAULT_HOURS;
  let groomingHours = {};
  try {
    const savedClinic = localStorage.getItem("clinicWorkingHours");
    if (savedClinic) clinicHours = JSON.parse(savedClinic);
  } catch {}
  try {
    const savedGrooming = localStorage.getItem("groomingWorkingHours");
    if (savedGrooming) groomingHours = JSON.parse(savedGrooming);
  } catch {}

  const clinicSchedule = clinicHours?.[todayDayKey];
  const groomingSchedule = groomingHours?.[todayDayKey];
  const clinicIntervals = clinicSchedule?.intervals || [{ start: "09:00", end: "17:00" }];
  const groomingIntervals = groomingSchedule?.intervals || [{ start: "09:00", end: "17:00" }];

  // Διάρκεια slot ανά τμήμα — από Ρυθμίσεις → Ωράριο (fallback 30'/60').
  const clinicSlotDuration = Number(localStorage.getItem("clinicSlotDuration")) || 30;
  const groomingSlotDuration = Number(localStorage.getItem("groomingSlotDuration")) || 60;

  const { slotsIatreio, slotsGrooming } = useAppointmentSlots({
    date: todayStr,
    clinicIntervals,
    groomingIntervals,
    slotDuration: clinicSlotDuration,
    groomingSlotDuration,
    appointments,
  });

  if (!isOpen) return null;

  // Κλικ σε κενό slot → δημιουργία νέου ραντεβού. Δανειζόμαστε τον ίδιο
  // μηχανισμό με το "+ Νέο" του dashboard: το modal κλείνει και ανοίγει η
  // πλήρης σελίδα Ραντεβού με προσυμπληρωμένη ώρα/γιατρό (ίδια συμπεριφορά
  // με το κουμπί "Επεξεργασία" εδώ, που κι αυτό κλείνει το modal).
  const handleSlotSelect = (time, doctor) => {
    onNewAppointment?.(doctor, time);
    onClose?.();
  };

  const rangeEnd =
    viewMode === "month" ? today.add(29, "day") :
    viewMode === "today" ? today :
    today.add(6, "day");

  const title =
    viewMode === "month" ? "Ραντεβού Μήνα" :
    viewMode === "today" ? "Ραντεβού Ημέρας" :
    "Ραντεβού Εβδομάδας";
  const label = viewMode === "today"
    ? today.locale("el").format("D MMM")
    : `${today.locale("el").format("D MMM")} – ${rangeEnd.locale("el").format("D MMM")}`;

  const inRange = appointments
    .filter((a) => {
      const d = dayjs(a.date, "YYYY-MM-DD");
      return !d.isBefore(today, "day") && !d.isAfter(rangeEnd, "day");
    })
    .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));

  // Σύνολο ραντεβού ανά διάστημα (Σήμερα/Εβδομάδα/Μήνας) — υπολογίζονται ΚΑΙ
  // τα 3 πάντα, ανεξάρτητα από το ενεργό viewMode, ώστε να φαίνονται δίπλα
  // στο αντίστοιχο κουμπί εναλλαγής.
  const countInRange = (end) => appointments.filter((a) => {
    const d = dayjs(a.date, "YYYY-MM-DD");
    return !d.isBefore(today, "day") && !d.isAfter(end, "day");
  }).length;
  const todayCount = countInRange(today);
  const weekCount = countInRange(today.add(6, "day"));
  const monthCount = countInRange(today.add(29, "day"));

  // Ομαδοποίηση ανά μέρα — ΟΛΕΣ οι μέρες του διαστήματος (όχι μόνο όσες
  // έχουν ραντεβού), ώστε οι κλειστές/κενές μέρες να φαίνονται κι αυτές
  // (σαν "Κλειστό") αντί να λείπουν αθόρυβα. Μέσα σε κάθε μέρα 2
  // υπο-στήλες: Ιατρείο | Grooming.
  const groups = [];
  const daysInRange = rangeEnd.diff(today, "day") + 1;
  for (let i = 0; i < daysInRange; i++) {
    const d = today.add(i, "day");
    const dateStr = d.format("YYYY-MM-DD");
    const dayKey = d.locale("en").format("dddd").toLowerCase();
    groups.push({
      date: dateStr,
      clinic: inRange.filter((a) => a.date === dateStr && a.doctor !== "Grooming"),
      grooming: inRange.filter((a) => a.date === dateStr && a.doctor === "Grooming"),
      clinicEnabled: !!clinicHours?.[dayKey]?.enabled,
      groomingEnabled: !!groomingHours?.[dayKey]?.enabled,
    });
  }

  // Στο μηνιαίο: οι μέρες μαζεύονται σε γραμμές ανά 7ήμερο — scroll προς τα
  // κάτω ανά εβδομάδα, όχι πλάγια σε ένα ατελείωτο οριζόντιο row. Στο
  // εβδομαδιαίο αυτό καταλήγει φυσικά σε μία μόνο γραμμή (ίδιο με πριν).
  const weekRows = [];
  for (const g of groups) {
    const weekIdx = Math.floor(dayjs(g.date, "YYYY-MM-DD").diff(today, "day") / 7);
    let row = weekRows[weekRows.length - 1];
    if (!row || row.weekIdx !== weekIdx) {
      row = { weekIdx, days: [] };
      weekRows.push(row);
    }
    row.days.push(g);
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-gray-800/70 p-2 sm:p-4"
      style={{ touchAction: "none" }}
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-win-surface rounded-2xl shadow-2xl w-full h-[75vh] sm:h-auto sm:max-h-[92vh] sm:max-w-[95vw] xl:max-w-[1400px] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-400 to-indigo-500 px-5 py-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <p className="text-white font-bold text-base leading-tight truncate">{title}</p>
          </div>

          <p className="text-white text-base sm:text-lg font-extrabold text-center whitespace-nowrap capitalize">
            {label} · {inRange.length} ραντεβού
          </p>

          <div className="flex items-center justify-end gap-3">
            <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-xl p-1">
              {[
                { key: "today", label: "Σήμερα", count: todayCount },
                { key: "week",  label: "Εβδομάδα", count: weekCount },
                { key: "month", label: "Μήνας", count: monthCount },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setViewMode(m.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    viewMode === m.key
                      ? "bg-white text-indigo-600"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {m.label}
                  <span className={viewMode === m.key ? "text-indigo-400" : "text-white/60"}> ({m.count})</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body — γραμμές εβδομάδων η μία κάτω από την άλλη (scroll κάθετα),
            και μέσα σε κάθε γραμμή οι μέρες της εβδομάδας οριζόντια (scroll
            πλάγια μόνο αν δεν χωράνε). Το ύψος προσαρμόζεται στο περιεχόμενο
            μέχρι το max-h του modal. */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 no-scrollbar" style={{ touchAction: "auto" }}>
          {viewMode === "today" ? (
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <TodaySlotsSection
                title="Ιατρείο"
                Icon={Stethoscope}
                iconColor="text-indigo-400"
                enabled={!!clinicSchedule?.enabled}
                slots={slotsIatreio}
                slotDuration={clinicSlotDuration}
                doctor="Ιατρείο"
                onSlotSelect={handleSlotSelect}
                onEdit={onEditAppointment}
                onConsult={onConsult}
                onDelete={onDeleteAppointment}
              />
              <TodaySlotsSection
                title="Grooming"
                Icon={Scissors}
                iconColor="text-sky-400"
                enabled={!!groomingSchedule?.enabled}
                slots={slotsGrooming}
                slotDuration={groomingSlotDuration}
                doctor="Grooming"
                onSlotSelect={handleSlotSelect}
                onEdit={onEditAppointment}
                onConsult={onConsult}
                onDelete={onDeleteAppointment}
              />
            </div>
          ) : (
            <>
              {/* Desktop / tablet: μέρες σε οριζόντιες σειρές ανά εβδομάδα,
                  με Ιατρείο | Grooming δίπλα-δίπλα μέσα σε κάθε μέρα. */}
              <div className="hidden sm:flex flex-col gap-4">
                {weekRows.map((row) => (
                  <div key={row.weekIdx} className="flex gap-3 overflow-x-auto no-scrollbar">
                    {row.days.map((g) => (
                      <DayColumn
                        key={g.date}
                        g={g}
                        onEditAppointment={onEditAppointment}
                        onConsult={onConsult}
                        onDeleteAppointment={onDeleteAppointment}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Mobile: μέρες η μία κάτω από την άλλη, μόνο κάθετο scroll —
                  μέσα σε κάθε μέρα, Ιατρείο και Grooming είναι ξεχωριστές
                  ενότητες με τα ραντεβού σε πλέγμα 4 ανά γραμμή. */}
              <div className="flex sm:hidden flex-col gap-3">
                {groups.map((g) => (
                  <MobileDayBlock
                    key={g.date}
                    g={g}
                    onEditAppointment={onEditAppointment}
                    onConsult={onConsult}
                    onDeleteAppointment={onDeleteAppointment}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeekMonthAgendaModal;
