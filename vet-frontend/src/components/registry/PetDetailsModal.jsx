import React, { useEffect } from "react";
import {
  Cpu, Phone, Mail, MapPin, User, Calendar,
  FileText, X, Shield,
  PawPrint, Home, Stethoscope,
  UserPlus, FolderOpen, BadgeCheck, AlertCircle,
} from "lucide-react";
import { useModalScrollLock } from "../../hooks/useModalScrollLock.js";

const SPECIES_EMOJI = {
  "Σκύλος": "🐕",
  "Γάτα": "🐈",
  "Κουνέλι": "🐇",
  "Πουλί": "🐦",
  "Ψάρι": "🐟",
  "Χελώνα": "🐢",
};

function speciesEmoji(s) {
  return SPECIES_EMOJI[s] ?? "🐾";
}

export default function PetDetailsModal({ open, onClose, data, onAction }) {
  const scrollRef = useModalScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const {
    microchip, markingDate,
    petName, sex, age, breed, species, isSmallPet, color,
    managedBy, ownerName, ownerPhone, ownerEmail,
    ownerAddress, ownerCity, ownerAfm,
    isSterilized, isVaccinated, sterilizationData,
    lastVacDate, vacBrand, vacType, vaccinations,
  } = data || {};

  const vaccinationRows = vaccinations?.length
    ? vaccinations
    : lastVacDate || vacBrand || vacType
    ? [{ date: lastVacDate, type: vacType, brand: vacBrand }]
    : [];

  const s = sterilizationData || null;
  const sterilizedActive = Boolean(s?.isSterilized ?? isSterilized);
  const vaccinatedActive = Boolean(isVaccinated);
  const hasOwner = [ownerName, ownerPhone, ownerEmail, ownerAddress, ownerCity, ownerAfm].some(
    (v) => v !== null && v !== undefined && String(v).trim() !== ""
  );

  const display = (v) => {
    if (v === null || v === undefined) return "—";
    const str = String(v).trim();
    return str.length ? str : "—";
  };
  const displaySmallPet = (v) => {
    if (v === true) return "Ναι";
    if (v === false) return "Όχι";
    if (typeof v === "string" && v.trim() !== "") return v;
    return "—";
  };
  const displayDateTime = (v) => {
    if (!v) return "—";
    // Προτεραιότητα στη μορφή DD/MM/YY(YY) του gov site — το native Date()
    // παρακάτω τη διαβάζει ως MM/DD (αμερικάνικο locale) και αντιστρέφει
    // μέρα/μήνα (π.χ. "12/11/2025" γίνεται λάθος 11 Δεκεμβρίου αντί για
    // 12 Νοεμβρίου), γι' αυτό ελέγχουμε πρώτα ρητά αυτό το pattern.
    let d;
    const m = String(v).match(/^(\d{2})\/(\d{2})\/(\d{2,4})/);
    if (m) {
      const year = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
      d = new Date(year, parseInt(m[2], 10) - 1, parseInt(m[1], 10));
    } else {
      d = new Date(v);
    }
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("el-GR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
  };
  const dialogId = "pet-details-modal-title";

  if (!open) return null;

  const emoji = speciesEmoji(species);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3 py-4" style={{ touchAction: "none" }}>
      <button type="button" className="absolute inset-0 h-full w-full cursor-default" onClick={onClose} aria-label="Κλείσιμο" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogId}
        className="relative z-50 flex w-full max-h-[88vh] max-w-2xl flex-col overflow-hidden rounded-3xl bg-white dark:bg-win-surface shadow-2xl"
      >
        {/* ── HEADER (gradient) ── */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500 px-6 py-5">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-[11px] font-semibold text-white/90 uppercase tracking-wide mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Κάρτα Κατοικιδίου
          </div>

          {/* Avatar + Name + pills */}
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-2xl bg-white/25 flex items-center justify-center text-6xl flex-shrink-0 shadow-inner">
              {emoji}
            </div>
            <div className="min-w-0 flex-1">
              <h2 id={dialogId} className="text-2xl font-bold text-white tracking-tight leading-tight truncate">
                {display(petName)}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <StatusPill active={sterilizedActive} activeLabel="Στειρωμένο" inactiveLabel="Μη στειρωμένο" danger={!sterilizedActive} />
                <StatusPill active={vaccinatedActive} activeLabel="Εμβολιασμένο" inactiveLabel="Ανεμβολίαστο" danger={!vaccinatedActive} />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1 text-xs text-white/90 font-mono">
                  <Cpu className="w-3 h-3 text-indigo-200 flex-shrink-0" />
                  {display(microchip)}
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1 text-xs text-white/90">
                  <Calendar className="w-3 h-3 text-indigo-200 flex-shrink-0" />
                  {displayDateTime(markingDate)}
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1 text-xs text-white/90">
                  <Stethoscope className="w-3 h-3 text-indigo-200 flex-shrink-0" />
                  {display(managedBy)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-gray-50 dark:bg-win-bg px-5 py-4"
          style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
        >
          {!data ? (
            <EmptyState text="Δεν υπάρχουν δεδομένα για εμφάνιση." />
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* Ζώο */}
                <Card title="Ζώο" icon={PawPrint}>
                  <IconField icon={PawPrint}    label="Είδος"             value={display(species)} />
                  <IconField icon={FileText}     label="Φυλή"              value={display(breed)} />
                  <IconField icon={User}         label="Φύλο"              value={display(sex)} />
                  <IconField icon={Calendar}     label="Ηλικία"            value={display(age)} />
                  <IconField icon={Home}         label="Χρώμα"             value={display(color)} />
                  <IconField icon={FileText}     label="Μικρό ζώο (<10kg)" value={displaySmallPet(isSmallPet)} />
                </Card>
                {/* Ιδιοκτήτης */}
                {hasOwner ? (
                  <OwnerCard
                    ownerName={ownerName} ownerPhone={ownerPhone}
                    ownerEmail={ownerEmail} ownerAddress={ownerAddress}
                    ownerCity={ownerCity} ownerAfm={ownerAfm}
                    display={display}
                  />
                ) : (
                  <EmptyState text="Δεν υπάρχουν στοιχεία ιδιοκτήτη." />
                )}
              </div>
              {/* Εμβολιασμός (οριζόντιο, πλήρους πλάτους) */}
              <Card title="Εμβολιασμός" icon={Shield}>
                {vaccinationRows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                          <th className="text-left font-semibold pb-1.5 pr-3">Ημερομηνία</th>
                          <th className="text-left font-semibold pb-1.5 pr-3">Τύπος</th>
                          <th className="text-left font-semibold pb-1.5">Σκεύασμα</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vaccinationRows.map((v, i) => (
                          <tr key={i} className="border-t border-gray-100 dark:border-win-border/50">
                            <td className="py-1.5 pr-3 font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap">{displayDateTime(v.date)}</td>
                            <td className="py-1.5 pr-3 text-gray-700 dark:text-gray-200">{display(v.type)}</td>
                            <td className="py-1.5 text-gray-500 dark:text-gray-400">{display(v.brand)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Δεν υπάρχει καταχωρημένο ιστορικό εμβολιασμών.</p>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="border-t border-gray-200 dark:border-win-border bg-white dark:bg-win-surface px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onAction?.({ type: "createCustomer", data })}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                Δημιουργία Πελάτη
              </button>
              <button
                type="button"
                onClick={() => onAction?.({ type: "createVisit", data })}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-95"
              >
                <FolderOpen className="w-4 h-4" />
                Φάκελος Επίσκεψης
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-win-border bg-gray-50 dark:bg-win-elevated hover:bg-gray-100 dark:hover:bg-win-elevated2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 transition"
            >
              Κλείσιμο
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Card({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-win-surface border border-gray-100 dark:border-win-border shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 dark:border-win-border bg-gray-50/80 dark:bg-win-elevated/50">
        <Icon className="w-4 h-4 text-indigo-400 dark:text-indigo-300" />
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</span>
      </div>
      <div className="px-4 py-3 space-y-2.5">{children}</div>
    </div>
  );
}

function IconField({ icon: Icon, label, value, mono = false, highlight = false, danger = false }) {
  const isEmpty = !value || value === "—";
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
        <p className={[
          "text-sm font-semibold leading-snug",
          isEmpty ? "text-gray-300 dark:text-gray-600" : highlight ? "text-emerald-600 dark:text-emerald-400" : danger ? "text-red-500 dark:text-red-400" : "text-gray-800 dark:text-gray-100",
          mono ? "font-mono text-xs" : "",
        ].join(" ")}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function OwnerCard({ ownerName, ownerPhone, ownerEmail, ownerAddress, ownerCity, ownerAfm, display }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-win-surface border border-gray-100 dark:border-win-border shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 dark:border-win-border bg-gray-50/80 dark:bg-win-elevated/50">
        <User className="w-4 h-4 text-indigo-400 dark:text-indigo-300" />
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Ιδιοκτήτης</span>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        <IconField icon={User}    label="Ονοματεπώνυμο" value={display(ownerName)} />
        <IconField icon={Phone}    label="Τηλέφωνο"    value={display(ownerPhone)} />
        <IconField icon={Mail}     label="Email"        value={display(ownerEmail)} />
        <IconField icon={MapPin}   label="Διεύθυνση"   value={display(ownerAddress)} />
        <IconField icon={Home}     label="Πόλη"        value={display(ownerCity)} />
        <IconField icon={FileText} label="ΑΦΜ"         value={display(ownerAfm)} />
      </div>
    </div>
  );
}

function StatusPill({ active, activeLabel, inactiveLabel, danger = false }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-400/30 text-white rounded-full px-2.5 py-0.5 text-[11px] font-bold">
        <BadgeCheck className="w-3 h-3" />{activeLabel}
      </span>
    );
  }
  if (danger) {
    return (
      <span className="inline-flex items-center gap-1 bg-red-500/30 text-red-200 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
        <AlertCircle className="w-3 h-3" />{inactiveLabel}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-white/15 text-white/70 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
      {inactiveLabel}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-win-border bg-white dark:bg-win-surface p-8 text-center text-sm text-gray-400 dark:text-gray-500">
      {text}
    </div>
  );
}
