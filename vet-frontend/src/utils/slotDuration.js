// Ελάχιστη διάρκεια ραντεβού ανά τμήμα (Ιατρείο/Grooming) — ίδια πηγή
// (localStorage) με το ημερολόγιο (AppointmentSlots.jsx) και τις ρυθμίσεις
// (SettingsPage.jsx, πεδία clinicSlotDuration/groomingSlotDuration).
export function getSlotDuration(doctor) {
  try {
    const key = doctor === "Grooming" ? "groomingSlotDuration" : "clinicSlotDuration";
    const val = Number(localStorage.getItem(key));
    if (val > 0) return val;
  } catch {}
  return doctor === "Grooming" ? 60 : 30;
}

export function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} λεπτά`;
  const hLabel = h === 1 ? "1 ώρα" : `${h} ώρες`;
  return m === 0 ? hLabel : `${hLabel} & ${m} λεπτά`;
}
