import React, { useEffect, useMemo, useState } from "react";
import {
  Cpu, Phone, Mail, MapPin, User, Calendar,
  Heart, Shield, Scissors, FileText, X,
  PawPrint, Home, Stethoscope, ClipboardList,
  UserPlus, FolderOpen, BadgeCheck, AlertCircle,
} from "lucide-react";

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
  const [tab, setTab] = useState("summary");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => { if (open) setTab("summary"); }, [open]);

  const {
    microchip, markingDate, passportNumber,
    petName, sex, age, breed, species, isSmallPet, color,
    managedBy, ownerName, ownerPhone, ownerEmail,
    ownerAddress, ownerCity, ownerAfm,
    isSterilized, isVaccinated, sterilizationData,
  } = data || {};

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
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("el-GR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
  };
  const displayBool = (v) => v === true ? "Ναι" : v === false ? "Όχι" : "—";

  const tabs = useMemo(() => [
    { key: "summary",  label: "Σύνοψη",     icon: ClipboardList,  enabled: true },
    { key: "pet",      label: "Ζώο",         icon: PawPrint,       enabled: true },
    { key: "owner",    label: "Ιδιοκτήτης",  icon: User,           enabled: hasOwner },
    { key: "health",   label: "Υγεία",       icon: Heart,          enabled: true },
    { key: "admin",    label: "Διαχείριση",  icon: Stethoscope,    enabled: true },
  ], [hasOwner]);

  const dialogId = "pet-details-modal-title";
  const descId   = "pet-details-modal-desc";

  if (!open) return null;

  const emoji = speciesEmoji(species);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3 py-4">
      <button type="button" className="absolute inset-0 h-full w-full cursor-default" onClick={onClose} aria-label="Κλείσιμο" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogId}
        aria-describedby={descId}
        className="relative z-50 flex w-full max-h-[88vh] max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* ── HEADER (gradient) ── */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500 px-6 pt-6 pb-4">
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

          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/25 flex items-center justify-center text-3xl flex-shrink-0 shadow-inner">
              {emoji}
            </div>
            <div className="min-w-0">
              <h2 id={dialogId} className="text-2xl font-bold text-white tracking-tight leading-tight truncate">
                {display(petName)}
              </h2>
              <p id={descId} className="text-indigo-200 text-sm mt-0.5 truncate">
                {[display(species), display(breed)].filter(v => v !== "—").join(" • ") || "—"}
              </p>
            </div>
          </div>

          {/* Status pills + microchip */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1 text-xs text-white/90 font-mono">
              <Cpu className="w-3 h-3 text-indigo-200 flex-shrink-0" />
              {display(microchip)}
            </div>
            <StatusPill active={sterilizedActive} activeLabel="Στειρωμένο" inactiveLabel="Στείρωση: —" />
            <StatusPill active={vaccinatedActive} activeLabel="Εμβολιασμένο" inactiveLabel="Εμβολιασμός: —" />
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  disabled={!t.enabled}
                  onClick={() => t.enabled && setTab(t.key)}
                  className={[
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex-shrink-0",
                    !t.enabled
                      ? "opacity-40 cursor-not-allowed text-white/60"
                      : isActive
                      ? "bg-white text-indigo-700 shadow"
                      : "text-white/80 hover:bg-white/20",
                  ].join(" ")}
                  title={!t.enabled ? "Δεν υπάρχουν δεδομένα" : ""}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto bg-gray-50 px-5 py-4">
          {!data ? (
            <EmptyState text="Δεν υπάρχουν δεδομένα για εμφάνιση." />
          ) : tab === "summary" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* Ζώο */}
                <Card title="Ζώο" icon={PawPrint}>
                  <IconField icon={PawPrint}    label="Είδος"  value={display(species)} />
                  <IconField icon={FileText}     label="Φυλή"   value={display(breed)} />
                  <IconField icon={User}         label="Φύλο"   value={display(sex)} />
                  <IconField icon={Home}         label="Χρώμα"  value={display(color)} />
                </Card>
                {/* Μητρώο */}
                <Card title="Μητρώο" icon={Cpu}>
                  <IconField icon={Cpu}          label="Microchip"       value={display(microchip)} mono />
                  <IconField icon={Calendar}     label="Ημ. σήμανσης"    value={displayDateTime(markingDate)} />
                  <IconField icon={FileText}     label="Διαβατήριο"      value={display(passportNumber)} />
                  <IconField icon={Scissors}     label="Στείρωση"        value={sterilizedActive ? "Στειρωμένο" : "—"} highlight={sterilizedActive} />
                  <IconField icon={Shield}       label="Εμβολιασμός"     value={vaccinatedActive ? "Εμβολιασμένο" : "—"} highlight={vaccinatedActive} />
                </Card>
              </div>
              {/* Ιδιοκτήτης (full-width) */}
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
          ) : tab === "pet" ? (
            <Card title="Στοιχεία Ζώου" icon={PawPrint}>
              <IconField icon={PawPrint}  label="Είδος"             value={display(species)} />
              <IconField icon={FileText}  label="Φυλή"              value={display(breed)} />
              <IconField icon={User}      label="Φύλο"              value={display(sex)} />
              <IconField icon={Calendar}  label="Ηλικία"            value={display(age)} />
              <IconField icon={Home}      label="Χρώμα"             value={display(color)} />
              <IconField icon={FileText}  label="Μικρό ζώο (<10kg)" value={displaySmallPet(isSmallPet)} />
            </Card>
          ) : tab === "owner" ? (
            hasOwner
              ? <OwnerCard ownerName={ownerName} ownerPhone={ownerPhone} ownerEmail={ownerEmail} ownerAddress={ownerAddress} ownerCity={ownerCity} ownerAfm={ownerAfm} display={display} />
              : <EmptyState text="Δεν υπάρχουν στοιχεία ιδιοκτήτη." />
          ) : tab === "health" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <HealthCard title="Στείρωση" active={sterilizedActive} activeLabel="Στειρωμένο" inactiveLabel="Μη καταχωρημένη" icon={Scissors}>
                  <IconField icon={Scissors}  label="Κατάσταση"            value={s?.isSterilized === true ? "Στειρωμένο" : s?.isSterilized === false ? "Μη στειρωμένο" : "—"} highlight={sterilizedActive} />
                  <IconField icon={Calendar}  label="Ημερομηνία"           value={displayDateTime(s?.sterilizationDate)} />
                  <IconField icon={User}      label="Δήλωση ιδιοκτήτη"    value={displayBool(s?.sterilizationOwnerSubmission)} />
                  <IconField icon={FileText}  label="Διαγν. τεχνική"       value={display(s?.sterilizationDiagnosticTechnique)} />
                </HealthCard>
                <HealthCard title="Εμβολιασμός" active={vaccinatedActive} activeLabel="Εμβολιασμένο" inactiveLabel="Μη καταχωρημένος" icon={Shield}>
                  <IconField icon={Calendar}  label="Τελευταίος"   value="—" />
                  <IconField icon={FileText}  label="Σημειώσεις"   value="—" />
                </HealthCard>
              </div>
              <Card title="Σήμανση Microchip" icon={Cpu}>
                <IconField icon={Cpu}       label="Microchip"       value={display(microchip)} mono />
                <IconField icon={Calendar}  label="Ημ. σήμανσης"   value={displayDateTime(markingDate)} />
                <IconField icon={FileText}  label="Διαβατήριο"     value={display(passportNumber)} />
              </Card>
            </div>
          ) : (
            <Card title="Διαχείριση / Κτηνίατρος" icon={Stethoscope}>
              <IconField icon={Stethoscope} label="Διαχείριση από" value={display(managedBy)} />
            </Card>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="border-t border-gray-200 bg-white px-5 py-4">
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
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 transition"
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
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 bg-gray-50/80">
        <Icon className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">{title}</span>
      </div>
      <div className="px-4 py-3 space-y-2.5">{children}</div>
    </div>
  );
}

function HealthCard({ title, active, activeLabel, inactiveLabel, icon: Icon, children }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/80">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wide text-gray-500">{title}</span>
        </div>
        {active
          ? <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 rounded-full px-2.5 py-0.5 text-[11px] font-bold"><BadgeCheck className="w-3 h-3" />{activeLabel}</span>
          : <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-500 rounded-full px-2.5 py-0.5 text-[11px] font-bold"><AlertCircle className="w-3 h-3" />{inactiveLabel}</span>
        }
      </div>
      <div className="px-4 py-3 space-y-2.5">{children}</div>
    </div>
  );
}

function IconField({ icon: Icon, label, value, mono = false, highlight = false }) {
  const isEmpty = !value || value === "—";
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className={[
          "text-sm font-semibold leading-snug",
          isEmpty ? "text-gray-300" : highlight ? "text-emerald-600" : "text-gray-800",
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
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 bg-gray-50/80">
        <User className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Ιδιοκτήτης</span>
      </div>
      {/* Owner name + avatar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
          {display(ownerName) !== "—" ? display(ownerName).charAt(0).toUpperCase() : "?"}
        </div>
        <div>
          <p className="font-bold text-gray-900">{display(ownerName)}</p>
          {ownerCity && <p className="text-xs text-gray-400">{display(ownerCity)}</p>}
        </div>
      </div>
      <div className="px-4 py-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <IconField icon={Phone}    label="Τηλέφωνο"    value={display(ownerPhone)} />
        <IconField icon={Mail}     label="Email"        value={display(ownerEmail)} />
        <IconField icon={MapPin}   label="Διεύθυνση"   value={display(ownerAddress)} />
        <IconField icon={Home}     label="Πόλη"        value={display(ownerCity)} />
        <IconField icon={FileText} label="ΑΦΜ"         value={display(ownerAfm)} />
      </div>
    </div>
  );
}

function StatusPill({ active, activeLabel, inactiveLabel }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-400/30 text-white rounded-full px-2.5 py-0.5 text-[11px] font-bold">
        <BadgeCheck className="w-3 h-3" />{activeLabel}
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
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
      {text}
    </div>
  );
}
