import React from "react";
import dayjs from "dayjs";
import CompactAppointmentCard from "./CompactAppointmentCard.jsx";

const BASE_WIDTH = 104; // px, ίδιο πλάτος με τη συμπαγή κάρτα
const GAP_PX = 6;       // px, αντιστοιχεί στο gap-1.5

// Ραντεβού με διάρκεια μεγαλύτερη από slotDuration "καταπίνουν" τα επόμενα
// slots (colSpan) — τα κρύβουμε (isMerged) και φαρδαίνουμε την πρώτη κάρτα,
// ώστε να μη δείχνουν λανθασμένα "Διαθέσιμα" ενώ στην πραγματικότητα είναι
// κατειλημμένα από ένα μεγαλύτερο ραντεβού.
function buildVisibleSlots(slots, slotDuration) {
  const result = [];
  let i = 0;
  while (i < slots.length) {
    const slot = slots[i];
    if (slot.isMerged) { i++; continue; }

    const duration = slot.duration || slotDuration;
    const colSpan = Math.max(1, Math.round(duration / slotDuration));
    for (let j = 1; j < colSpan; j++) {
      if (slots[i + j]) slots[i + j].isMerged = true;
    }

    result.push({ slot, colSpan });
    i++;
  }
  return result;
}

/**
 * Κοινό, συμπαγές πλέγμα ωρών — χρησιμοποιείται τόσο στο dashboard agenda
 * (WeekMonthAgendaModal, προβολή "Σήμερα") όσο και στη σελίδα Ραντεβού
 * (AppointmentSlots), ώστε να έχουν ακριβώς το ίδιο look & feel.
 *
 * - Κατειλημμένα slots: CompactAppointmentCard (edit/delete/consult).
 * - Κενά slots: light placeholder, clickable → onSlotSelect(time, doctor)
 *   για δημιουργία νέου ραντεβού σε αυτό το slot.
 */
export default function CompactSlotGrid({
  slots,
  slotDuration = 30,
  doctor,
  onSlotSelect,
  onEdit,
  onConsult,
  onDelete,
  canEdit = true,
}) {
  if (!slots.length) return null;
  const visible = buildVisibleSlots(slots, slotDuration);

  return (
    <ul className="flex flex-wrap gap-1.5">
      {visible.map(({ slot, colSpan }) => {
        const width = colSpan * BASE_WIDTH + (colSpan - 1) * GAP_PX;

        if (slot.appointment) {
          return (
            <CompactAppointmentCard
              key={slot.time}
              appt={slot.appointment}
              onEdit={onEdit}
              onConsult={onConsult}
              onDelete={onDelete}
              canEdit={canEdit}
              className="flex-shrink-0"
              style={{ width }}
            />
          );
        }

        const endTime = dayjs(`2000-01-01T${slot.time}`).add(colSpan * slotDuration, "minute").format("HH:mm");
        return (
          <li
            key={slot.time}
            style={{ width }}
            className="group flex-shrink-0 rounded-md border border-dashed border-gray-200 dark:border-win-border/40 p-1.5 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-colors"
            onClick={() => onSlotSelect?.(slot.time, doctor)}
          >
            <span className="text-[11px] font-semibold text-gray-300 dark:text-gray-600 group-hover:text-indigo-400">
              {slot.time}–{endTime}
            </span>
            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5 group-hover:text-indigo-400 transition-colors">
              + Νέο
            </p>
          </li>
        );
      })}
    </ul>
  );
}
