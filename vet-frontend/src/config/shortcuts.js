export const DEFAULT_SHORTCUTS = {
  goHome:         "h",
  goAppointments: "a",
  goCustomers:    "c",
  goProducts:     "p",
  goPrescriptions:"r",
  goPets:         "z",
  goSettings:     "s",
};

export const SHORTCUT_LABELS = {
  goHome:          { label: "Αρχική",       description: "Μετάβαση στο Dashboard" },
  goAppointments:  { label: "Ραντεβού",     description: "Μετάβαση στη σελίδα Ραντεβού" },
  goCustomers:     { label: "Πελάτες",      description: "Μετάβαση στους Πελάτες" },
  goProducts:      { label: "Αποθήκη",      description: "Μετάβαση στα Προϊόντα" },
  goPrescriptions: { label: "Συνταγές",     description: "Μετάβαση στις Συνταγές" },
  goPets:          { label: "Κατοικίδια",   description: "Μετάβαση στα Κατοικίδια" },
  goSettings:      { label: "Ρυθμίσεις",    description: "Μετάβαση στις Ρυθμίσεις" },
};

export const STORAGE_KEY = "keyboardShortcuts";

export function loadShortcuts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...DEFAULT_SHORTCUTS, ...saved };
  } catch {
    return { ...DEFAULT_SHORTCUTS };
  }
}

export function saveShortcuts(shortcuts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
}
