import React, { useEffect, useMemo, useState } from "react";

/**
 * PetDetailsModal
 *
 * Εμφανίζει μια "κάρτα κατοικιδίου" σε modal πάνω από τη σελίδα.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - data: object
 * - onAction?: ({ type: "createCustomer" | "createVisit", data }) => void
 */
export default function PetDetailsModal({ open, onClose, data, onAction }) {
  const [tab, setTab] = useState("summary"); // summary | pet | owner | health | admin

  // Close on ESC
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Reset tab when opening
  useEffect(() => {
    if (open) setTab("summary");
  }, [open]);

  const {
    microchip,
    markingDate,
    passportNumber,
    petName,
    sex,
    age,
    breed,
    species,
    isSmallPet,
    color,
    managedBy,
    ownerName,
    ownerPhone,
    ownerEmail,
    ownerAddress,
    ownerCity,
    ownerAfm,
    // υπάρχοντα flags (fallback)
    isSterilized,
    isVaccinated,
    // πλήρη δεδομένα από μητρώο
    sterilizationData,
  } = data || {};

  const hasOwner = [ownerName, ownerPhone, ownerEmail, ownerAddress, ownerCity, ownerAfm].some(
    (v) => v !== null && v !== undefined && String(v).trim() !== ""
  );

  const s = sterilizationData || null;

  // active flag με προτεραιότητα στο sterilizationData
  const sterilizedActive = Boolean(s?.isSterilized ?? isSterilized);
  const vaccinatedActive = Boolean(isVaccinated);

  const display = (value) => {
    if (value === null || value === undefined) return "—";
    const str = String(value).trim();
    return str.length ? str : "—";
  };

  const displaySmallPet = (value) => {
    if (value === true) return "Ναι";
    if (value === false) return "Όχι";
    if (typeof value === "string" && value.trim() !== "") return value;
    return "—";
  };

  const displayDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("el-GR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const displayBool = (v) => {
    if (v === true) return "Ναι";
    if (v === false) return "Όχι";
    return "—";
  };

  const handleCreateCustomer = () => {
    if (typeof onAction === "function") onAction({ type: "createCustomer", data });
  };

  const handleCreateVisit = () => {
    if (typeof onAction === "function") onAction({ type: "createVisit", data });
  };

  const title = display(petName);

  const tabs = useMemo(() => {
    return [
      { key: "summary", label: "Σύνοψη", enabled: true },
      { key: "pet", label: "Ζώο", enabled: true },
      { key: "owner", label: "Ιδιοκτήτης", enabled: hasOwner },
      { key: "health", label: "Υγεία", enabled: true },
      { key: "admin", label: "Διαχείριση", enabled: true },
    ];
  }, [hasOwner]);

  const tabBtn = (active, disabled) =>
    [
      "inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold transition",
      disabled
        ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-500"
        : active
        ? "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-200"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
    ].join(" ");

  const dialogId = "pet-details-modal-title";
  const descId = "pet-details-modal-desc";

  // ✅ IMPORTANT: early return ΜΕΤΑ από όλα τα hooks (useState/useEffect/useMemo)
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-2 py-4">
      {/* Backdrop click closes */}
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
        aria-label="Κλείσιμο"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogId}
        aria-describedby={descId}
        className="relative z-50 flex w-full max-h-[80vh] max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        {/* Header (sticky) */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 px-6 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-800/70">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-indigo-600 dark:border-indigo-900/40 dark:bg-slate-900 dark:text-indigo-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Κάρτα κατοικιδίου
              </div>

              <h2
                id={dialogId}
                className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 truncate"
              >
                {title}
              </h2>

              <p id={descId} className="text-xs text-slate-500 dark:text-slate-400">
                Προβολή στοιχείων ζώου και ιδιοκτήτη από το μητρώο.
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Microchip:{" "}
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {display(microchip)}
                  </span>
                </span>

                <StatusPill
                  active={sterilizedActive}
                  activeLabel="Στειρωμένο"
                  inactiveLabel="Στείρωση: —"
                />
                <StatusPill
                  active={vaccinatedActive}
                  activeLabel="Εμβολιασμένο"
                  inactiveLabel="Εμβολιασμός: —"
                />

                {species ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {display(species)} • {display(breed)}
                  </span>
                ) : null}
              </div>

              {/* Tabs */}
              <div className="mt-3 flex flex-wrap gap-2">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    disabled={!t.enabled}
                    onClick={() => t.enabled && setTab(t.key)}
                    className={tabBtn(tab === t.key, !t.enabled)}
                    title={!t.enabled ? "Δεν υπάρχουν διαθέσιμα δεδομένα" : ""}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span className="sr-only">Κλείσιμο</span>×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!data ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200">
              Δεν υπάρχουν δεδομένα για εμφάνιση.
            </div>
          ) : tab === "summary" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Σύνοψη ζώου
                </h3>
                <div className="space-y-2 text-sm">
                  <FieldRow label="Όνομα" value={display(petName)} />
                  <FieldRow label="Είδος" value={display(species)} />
                  <FieldRow label="Φυλή" value={display(breed)} />
                  <FieldRow label="Φύλο" value={display(sex)} />
                  <FieldRow label="Χρώμα" value={display(color)} />
                  <FieldRow label="Μικρό ζώο (<10kg)" value={displaySmallPet(isSmallPet)} />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Σύνοψη μητρώου
                </h3>
                <div className="space-y-2 text-sm">
                  <FieldRow label="Microchip" value={display(microchip)} mono />
                  <FieldRow label="Ημερομηνία σήμανσης" value={displayDateTime(markingDate)} />
                  <FieldRow label="Αριθμός διαβατηρίου" value={display(passportNumber)} />
                  <FieldRow label="Στείρωση" value={sterilizedActive ? "Στειρωμένο" : "—"} />
                  <FieldRow label="Εμβολιασμός" value={vaccinatedActive ? "Εμβολιασμένο" : "—"} />
                </div>
              </section>

              {hasOwner ? (
                <section className="md:col-span-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Ιδιοκτήτης
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2 text-sm">
                      <FieldRow label="Ονοματεπώνυμο" value={display(ownerName)} />
                      <FieldRow label="Τηλέφωνο" value={display(ownerPhone)} />
                      <FieldRow label="Email" value={display(ownerEmail)} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <FieldRow label="Διεύθυνση" value={display(ownerAddress)} multiline />
                      <FieldRow label="Πόλη" value={display(ownerCity)} />
                      <FieldRow label="ΑΦΜ" value={display(ownerAfm)} />
                    </div>
                  </div>
                </section>
              ) : (
                <section className="md:col-span-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Ιδιοκτήτης
                  </h3>
                  <div className="text-sm text-slate-600 dark:text-slate-200">
                    Δεν υπάρχουν διαθέσιμα στοιχεία ιδιοκτήτη.
                  </div>
                </section>
              )}
            </div>
          ) : tab === "pet" ? (
            <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Βασικά στοιχεία ζώου
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <FieldRow label="Είδος ζώου" value={display(species)} />
                  <FieldRow label="Φυλή" value={display(breed)} />
                  <FieldRow label="Φύλο" value={display(sex)} />
                </div>
                <div className="space-y-2 text-sm">
                  <FieldRow label="Ηλικία" value={display(age)} />
                  <FieldRow label="Χρώμα" value={display(color)} />
                  <FieldRow label="Μικρό ζώο (<10kg)" value={displaySmallPet(isSmallPet)} />
                </div>
              </div>
            </section>
          ) : tab === "owner" ? (
            hasOwner ? (
              <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Ιδιοκτήτης
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2 text-sm">
                    <FieldRow label="Ονοματεπώνυμο" value={display(ownerName)} />
                    <FieldRow label="Τηλέφωνο" value={display(ownerPhone)} />
                    <FieldRow label="Email" value={display(ownerEmail)} />
                  </div>
                  <div className="space-y-2 text-sm">
                    <FieldRow label="Διεύθυνση" value={display(ownerAddress)} multiline />
                    <FieldRow label="Πόλη" value={display(ownerCity)} />
                    <FieldRow label="ΑΦΜ" value={display(ownerAfm)} />
                  </div>
                </div>
              </section>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200">
                Δεν υπάρχουν διαθέσιμα στοιχεία ιδιοκτήτη.
              </div>
            )
          ) : tab === "health" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <StatusCard
                title="Στείρωση"
                active={sterilizedActive}
                activeLabel="Στειρωμένο"
                inactiveLabel="Μη καταχωρημένη"
              >
                <FieldRow
                  label="Κατάσταση"
                  value={
                    s?.isSterilized === true
                      ? "Στειρωμένο"
                      : s?.isSterilized === false
                      ? "Μη στειρωμένο"
                      : "—"
                  }
                />
                <FieldRow label="Ημερομηνία στείρωσης" value={displayDateTime(s?.sterilizationDate)} />
                <FieldRow label="Δήλωση ιδιοκτήτη" value={displayBool(s?.sterilizationOwnerSubmission)} />
                <FieldRow label="Κλινική εξέταση γεννητικών" value={displayBool(s?.sterilizationVetGenitalExam)} />
                <FieldRow label="Διαγνωστική τεχνική" value={display(s?.sterilizationDiagnosticTechnique)} />
              </StatusCard>

              <StatusCard
                title="Εμβολιασμός"
                active={vaccinatedActive}
                activeLabel="Εμβολιασμένο"
                inactiveLabel="Μη καταχωρημένος"
              >
                <FieldRow label="Τελευταίος εμβολιασμός" value="—" />
                <FieldRow label="Σημειώσεις" value="—" multiline />
              </StatusCard>

              <section className="md:col-span-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Σήμανση microchip
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2 text-sm">
                    <FieldRow label="Ημερομηνία σήμανσης" value={displayDateTime(markingDate)} />
                  </div>
                  <div className="space-y-2 text-sm">
                    <FieldRow label="Αριθμός διαβατηρίου" value={display(passportNumber)} />
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Διαχείριση / κτηνίατρος
              </h3>
              <div className="space-y-2 text-sm">
                <FieldRow label="Διαχείριση από" value={display(managedBy)} multiline />
              </div>
            </section>
          )}
        </div>

        {/* Footer (sticky) */}
        <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-slate-50/90 px-6 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-800/70">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCreateCustomer}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
              >
                Δημιουργία πελάτη από αυτό το ζώο
              </button>
              <button
                type="button"
                onClick={handleCreateVisit}
                className="inline-flex items-center justify-center rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-900"
              >
                Δημιουργία φακέλου επίσκεψης
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Κλείσιμο
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Label + value row.
 */
function FieldRow({ label, value, multiline = false, mono = false }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span
        className={[
          "text-sm font-semibold text-slate-900 dark:text-slate-100",
          multiline ? "whitespace-pre-line" : "",
          mono ? "font-mono text-[13px]" : "",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function StatusPill({ active, activeLabel, inactiveLabel }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold";
  const cls = active
    ? base + " bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
    : base + " bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

  return <span className={cls}>{active ? activeLabel : inactiveLabel}</span>;
}

function StatusCard({ title, active, activeLabel, inactiveLabel, children }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold";
  const pillClasses = active
    ? base + " bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
    : base + " bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200";

  return (
    <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/60">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </h3>
        <span className={pillClasses}>{active ? activeLabel : inactiveLabel}</span>
      </div>

      {children ? <div className="mt-3 space-y-2 text-sm">{children}</div> : null}
    </section>
  );
}
