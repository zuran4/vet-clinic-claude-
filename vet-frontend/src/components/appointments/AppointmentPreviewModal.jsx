import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Calendar, Clock, Stethoscope, Scissors,
  StickyNote, PawPrint, Pill, X,
  Plus, ChevronDown, ChevronUp, Activity, ChevronRight, ArrowLeft,
  CheckCircle, AlertCircle, Syringe, Zap,
  UserCheck, DoorOpen, XCircle, Dna,
  Phone, Mail, BellRing, Camera,
} from "lucide-react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useCustomerPets } from "../../hooks/useCustomerPets";
import { addPetHistoryEntry, getPetsByOwner, updatePet } from "../../api/petsApi.js";
import { getCustomerById } from "../../api/customersApi.js";
import request from "../../api/apiClient.js";

const emptyConsultForm = {
  reason: "", result: "", weight: "", temperature: "", heartRate: "", diagnosis: "", treatment: "",
};

const inputClass =
  "border border-gray-200 dark:border-win-border-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 w-full";

const VISIT_STEPS = [
  { key: "exam",      label: "Εξέταση" },
  { key: "treatment", label: "Θεραπεία" },
  { key: "complete",  label: "Ολοκλήρωση" },
];

const BEHAVIOR_OPTIONS = [
  { key: "Ήρεμο",         color: "green"  },
  { key: "Στρεσαρισμένο", color: "amber"  },
  { key: "Επιθετικό",     color: "red"    },
  { key: "Επείγον",       color: "purple" },
];

const QUICK_ACTION_STYLES = {
  teal:   "bg-teal-50   dark:bg-teal-900/20   text-teal-500   dark:text-teal-400   group-hover:bg-teal-100   dark:group-hover:bg-teal-900/40",
  indigo: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40",
  blue:   "bg-blue-50   dark:bg-blue-900/20   text-blue-500   dark:text-blue-400   group-hover:bg-blue-100   dark:group-hover:bg-blue-900/40",
  slate:  "bg-slate-100 dark:bg-slate-800/40  text-slate-500  dark:text-slate-400  group-hover:bg-slate-200  dark:group-hover:bg-slate-700/60",
  amber:  "bg-amber-50  dark:bg-amber-900/20  text-amber-500  dark:text-amber-400  group-hover:bg-amber-100  dark:group-hover:bg-amber-900/40",
  purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-500 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40",
};

const QUICK_ACTION_RING = {
  teal:   "ring-teal-400   dark:ring-teal-500",
  indigo: "ring-indigo-400 dark:ring-indigo-500",
  blue:   "ring-blue-400   dark:ring-blue-500",
  slate:  "ring-slate-400  dark:ring-slate-500",
  amber:  "ring-amber-400  dark:ring-amber-500",
  purple: "ring-purple-400 dark:ring-purple-500",
};

const QUICK_ACTION_TEXT_ACTIVE = {
  teal:   "text-teal-600   dark:text-teal-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  blue:   "text-blue-600   dark:text-blue-400",
  slate:  "text-slate-600  dark:text-slate-300",
  amber:  "text-amber-600  dark:text-amber-400",
  purple: "text-purple-600 dark:text-purple-400",
};

const QUICK_CARD_META = {
  history: { icon: Clock,       label: "Ιστορικό",     title: "Ιστορικό Επισκέψεων", color: "teal"   },
  chip:    { icon: Dna,         label: "Σάρωση chip",  title: "Σάρωση chip",         color: "indigo" },
  photo:   { icon: Camera,      label: "Φωτογραφία",   title: "Φωτογραφία",          color: "blue"   },
  file:    { icon: StickyNote,  label: "Αρχείο",        title: "Αρχείο",              color: "slate"  },
  alert:   { icon: AlertCircle, label: "Alert",         title: "Alert",               color: "amber"  },
  quickRx: { icon: Pill,        label: "Συνταγή",       title: "Συνταγή",             color: "purple" },
};

const BEHAVIOR_STYLES = {
  green:  { base: "border-green-200  dark:border-green-700/50  text-green-700  dark:text-green-300  bg-green-50   dark:bg-green-900/20",  active: "border-green-400  bg-green-100  dark:bg-green-800/40  text-green-800  dark:text-green-200"  },
  amber:  { base: "border-amber-200  dark:border-amber-700/50  text-amber-700  dark:text-amber-300  bg-white      dark:bg-transparent",    active: "border-amber-400  bg-amber-100  dark:bg-amber-800/40  text-amber-800  dark:text-amber-200"  },
  red:    { base: "border-red-200    dark:border-red-700/50    text-red-700    dark:text-red-300    bg-white      dark:bg-transparent",    active: "border-red-400    bg-red-100    dark:bg-red-800/40    text-red-800    dark:text-red-200"    },
  purple: { base: "border-purple-200 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 bg-white      dark:bg-transparent",    active: "border-purple-400 bg-purple-100 dark:bg-purple-800/40 text-purple-800 dark:text-purple-200" },
};

// Quick templates per visit type
const TYPE_TEMPLATES = {
  "Εξέταση":       "Κλινική εξέταση ρουτίνας. Γενική κατάσταση καλή.",
  "Εμβόλιο":       "Εμβολιασμός. Χωρίς αντίδραση. Χορηγήθηκε: ",
  "Chip":           "Τοποθέτηση microchip. Αριθμός: ",
  "Αποπαρασίτωση": "Αποπαρασίτωση. Χορηγήθηκε: ",
  "Χειρουργείο":   "Χειρουργική επέμβαση. Ζώο σε καλή κατάσταση.",
  "Στείρωση":      "Στείρωση. Ζώο σε καλή κατάσταση προ-εγχειρητικά.",
  "Μπάνιο":        "Grooming - Μπάνιο. Χωρίς πρόβλημα.",
  "Κούρεμα":       "Grooming - Κούρεμα. ",
  "Καλλωπισμός":   "Καλλωπισμός. ",
  "Επανέλεγχος":   "Επανέλεγχος. ",
};

const INSTRUCTION_TEMPLATES = {
  chip:    "Τοποθετήθηκε microchip με επιτυχία και καταχωρήθηκε στο registry.\nΕίναι φυσιολογικό μια ήπια ευαισθησία στην περιοχή για 1-2 ημέρες.\nΠαρακολουθήστε για ερυθρότητα, οίδημα ή πόνο και επικοινωνήστε μαζί μας αν παρατηρήσετε κάτι ασυνήθιστο.\nΣυνεχίστε κανονικά τη ρουτίνα πρόληψης και τη σωστή διατροφή.",
  vaccine: "Χορηγήθηκε εμβόλιο. Μπορεί να εμφανιστεί ήπια αδυναμία ή ευαισθησία στο σημείο έγχυσης για 24-48 ώρες.\nΕπικοινωνήστε αμέσως αν εμφανιστεί έντονη αντίδραση ή αλλεργία.\nΤο επόμενο εμβόλιο προγραμματίζεται σε 1 χρόνο.",
  followup: "Παρακαλώ επισκεφθείτε μας σε ____ εβδομάδες για επανέλεγχο.\nΕπικοινωνήστε μαζί μας αν παρατηρήσετε επιδείνωση της κατάστασης ή νέα συμπτώματα.",
};

const emptyTreatmentForm = {
  procedures:       [],
  medications:      [],
  instructions:     "",
  followUpReminder: false,
  sendEmailSms:     false,
  scheduleFollowUp: false,
  reminderDate:     "",
};

const VAX_KEYWORDS = ["εμβόλ", "vaccine", "bravecto", "nexgard", "frontline", "αποπαρ", "stronghold", "advocate"];
const isVaccination = (reason = "") => VAX_KEYWORDS.some((kw) => reason.toLowerCase().includes(kw));

const SYMPTOM_CHIPS = ["Έμετος", "Διάρροια", "Ανορεξία", "Κινησιο", "Βήχας", "Χωλότητα", "Μάζα", "Επανέλεγχος", "Λήθαργος", "Κνησμός", "Πόνος", "Πυρετός"];

const VISIT_REASONS = [
  "Τακτικός έλεγχος", "Εμβολιασμός", "Αποπαρασίτωση", "Microchip",
  "Στείρωση", "Χειρουργείο", "Επανέλεγχος",
  "Δέρμα / Αλλεργία", "Γαστρεντερολογικό", "Αναπνευστικό",
  "Ορθοπεδικό / Χωλότητα", "Οφθαλμολογικό", "Ωτολογικό",
  "Οδοντολογικό", "Ουρολογικό", "Νευρολογικό", "Επείγον",
];

const BODY_SYSTEMS = [
  "Γενική εικόνα", "Δέρμα / Τρίχωμα", "Μάτια", "Αυτιά",
  "Στόμα / Δόντια", "Καρδιά / Αναπνευστικό", "Κοιλιά", "Λεμφαδένες",
  "Μυοσκελετικό", "Ουρογεννητικό", "Νευρολογικά",
];

const emptyExamForm = {
  ownerHistory:     "",
  symptoms:         [],
  respRate:         "",
  gumsColor:        "Ρόζ",
  crt:              "",
  o2sat:            "",
  hydration:        "Φυσιολογική",
  painScore:        "0/5",
  examBehavior:     "Ήρεμη",
  generalState:     "Καλή",
  bodyNotes:        "",
  bodySystemStatus: {},
};

function entryDotColor(reason = "") {
  const r = reason.toLowerCase();
  if (VAX_KEYWORDS.some((kw) => r.includes(kw)))               return "bg-green-400";
  if (r.includes("χειρουργ") || r.includes("στείρωση"))         return "bg-red-400";
  if (r.includes("οδοντ") || r.includes("καθαρισμ"))            return "bg-cyan-400";
  if (r.includes("γαστρ") || r.includes("δερμ") || r.includes("παθολ")) return "bg-amber-400";
  return "bg-indigo-400";
}

function SectionLabel({ children, className = "" }) {
  return <p className={`text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ${className}`}>{children}</p>;
}

function WeightChart({ history }) {
  const data = [...history]
    .filter((e) => e.weight)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-6);

  const W = 176, H = 64, PAD = 10;

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-16 bg-gray-50 dark:bg-win-elevated/20 rounded-xl border border-dashed border-gray-200 dark:border-win-border">
        <p className="text-[10px] text-gray-300 dark:text-gray-600">Δεν υπάρχουν δεδομένα βάρους</p>
      </div>
    );
  }

  const last    = data[data.length - 1];
  const weights = data.map((d) => d.weight);
  const minW    = Math.min(...weights) - 0.5;
  const maxW    = Math.max(...weights) + 0.5;
  const range   = maxW - minW || 1;

  const px = (i)  => PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
  const py = (w)  => H - PAD - ((w - minW) / range) * (H - PAD * 2);

  const linePts  = data.map((d, i) => `${px(i)},${py(d.weight)}`).join(" ");
  const areaPath = `M${px(0)},${H} ` + data.map((d, i) => `L${px(i)},${py(d.weight)}`).join(" ") + ` L${px(data.length - 1)},${H} Z`;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <SectionLabel className="mb-0">Γράφημα Βάρους</SectionLabel>
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
          {last.weight} kg
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"    />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path d={areaPath} fill="url(#wg)" />
        {/* Line */}
        {data.length > 1 && (
          <polyline fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={linePts} />
        )}
        {/* Dots + date labels */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={px(i)} cy={py(d.weight)} r="3" fill="#3b82f6" />
            <text x={px(i)} y={H + 2} textAnchor="middle" style={{ fontSize: 7, fill: "#9ca3af" }}>
              {dayjs(d.date).format("D/M")}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function PlaceholderCard({ icon: Icon, title, color = "slate" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-win-elevated/30 rounded-xl border border-dashed border-gray-200 dark:border-win-border-light">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${QUICK_ACTION_STYLES[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Σύντομα διαθέσιμο</p>
    </div>
  );
}

function ChipScanCard({ pet, onSaved }) {
  const [value, setValue] = useState(pet?.microchip || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(pet?.microchip || "");
    setError("");
  }, [pet?._id]);

  if (!pet) {
    return <PlaceholderCard icon={Dna} title="Σάρωση chip" color="indigo" />;
  }

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) { setError("Εισάγετε αριθμό chip."); return; }
    setSaving(true);
    setError("");
    try {
      const updated = await updatePet(pet._id, { microchip: trimmed });
      toast.success("✅ Το chip καταχωρήθηκε.");
      onSaved?.(updated);
    } catch (err) {
      setError(
        err.status === 409
          ? "Αυτό το chip υπάρχει ήδη καταχωρημένο σε άλλο κατοικίδιο."
          : (err.message || "Αποτυχία αποθήκευσης.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center text-center py-2">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400">
          <Dna className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Αριθμός Microchip</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{pet.name}</p>
      </div>
      <div className="relative">
        <Dna className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600" />
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }}
          placeholder="π.χ. 941000012345678"
          className="w-full border border-gray-200 dark:border-win-border-light rounded-2xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm"
      >
        <CheckCircle className="w-4 h-4" />
        {saving ? "Αποθήκευση..." : "Αποθήκευση Chip"}
      </button>
    </div>
  );
}

function DrugSearchInput({ value, onChange, onSelect, placeholder, className }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value.trim().length < 1) { setResults([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await request(`/products?search=${encodeURIComponent(value)}`);
        const meds = (Array.isArray(data) ? data : []).filter((p) => p.category === "Φάρμακο");
        if (!cancelled) setResults(meds);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [value]);

  const openDropdown = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
  };

  const handleSelect = (p) => {
    onSelect(p);
    setResults([]);
    setDropdownPos(null);
  };

  const showDropdown = dropdownPos && value.trim().length > 0;

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (e.target.value.trim()) openDropdown(); else setDropdownPos(null);
        }}
        onFocus={openDropdown}
        onBlur={() => setTimeout(() => setDropdownPos(null), 200)}
        placeholder={placeholder}
        className={className}
      />
      {showDropdown && createPortal(
        <div style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
          className="bg-white dark:bg-win-surface border border-gray-100 dark:border-win-border rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-3 text-xs text-gray-400 dark:text-gray-500 text-center">Αναζήτηση...</div>
          ) : results.length > 0 ? (
            <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50 dark:divide-win-border">
              {results.map((p) => (
                <li key={p._id}>
                  <button type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                        <Pill className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-300" />
                      </div>
                      <span className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{p.name}</span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">απόθ. {p.stockTotal ?? 0}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-xs text-gray-400 dark:text-gray-500 text-center">Δεν βρέθηκαν φάρμακα στην αποθήκη.</div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

function InfoItem({ icon: Icon, value, iconColor = "text-gray-400" }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${iconColor}`} />
      <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{value || "—"}</span>
    </div>
  );
}

const AppointmentPreviewModal = ({ isOpen, onClose, appointment, initialTab = "overview" }) => {
  const [visitStep,     setVisitStep]     = useState(1);
  const [checkInStatus, setCheckInStatus] = useState("waiting"); // "waiting"|"entered"|"noshow"
  const [behavior,      setBehavior]    = useState("");
  const [consultForm,   setConsultForm] = useState(emptyConsultForm);
  const [examForm,      setExamForm]      = useState(emptyExamForm);
  const [pendingTasks,    setPendingTasks]    = useState([]);
  const [treatmentForm,   setTreatmentForm]   = useState(emptyTreatmentForm);
  const [medicationInput, setMedicationInput] = useState({ drug: "", dose: "", frequency: "", duration: "" });
  const [saving,          setSaving]          = useState(false);
  const [recentHistory, setRecentHistory] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [fullPet,       setFullPet]       = useState(null);
  const [fullCustomer,  setFullCustomer]  = useState(null);
  const [quickCard,     setQuickCard]     = useState(null);

  const ownerId = typeof appointment?.owner === "object"
    ? appointment?.owner._id
    : appointment?.owner || null;

  const { pets } = useCustomerPets(ownerId);

  useEffect(() => {
    if (isOpen) {
      setVisitStep(1);
      setCheckInStatus("waiting");
      setBehavior("");
      const initTypes = Array.isArray(appointment?.type) ? appointment.type : [appointment?.type].filter(Boolean);
      const initReasons = initTypes.filter((t) => VISIT_REASONS.includes(t));
      setConsultForm({ ...emptyConsultForm, reason: initReasons.join(", ") });
      setExamForm(emptyExamForm);
      setFullPet(null);
      setRecentHistory([]);
      setSelectedEntry(null);
      setQuickCard(null);
      const apptTypes = Array.isArray(appointment?.type) ? appointment.type : [appointment?.type].filter(Boolean);
      const defaultTasks = [];
      if (apptTypes.some((t) => t === "Chip" || t === "Microchip")) {
        defaultTasks.push({ id: 1, text: "Σάρωση chip", done: false });
        defaultTasks.push({ id: 2, text: "Εγγραφή στο μητρώο", done: false });
      }
      if (apptTypes.includes("Εμβόλιο")) defaultTasks.push({ id: 3, text: "Εμβολιασμός", done: false });
      if (apptTypes.includes("Αποπαρασίτωση")) defaultTasks.push({ id: 4, text: "Αποπαρασίτωση", done: false });
      if (apptTypes.includes("Στείρωση") || apptTypes.includes("Χειρουργείο"))
        defaultTasks.push({ id: 5, text: "Προεγχειρητικές εξετάσεις", done: false });
      if (defaultTasks.length === 0) defaultTasks.push({ id: 1, text: "Ολοκλήρωση καταχώρισης", done: false });
      setPendingTasks(defaultTasks);
      setTreatmentForm(emptyTreatmentForm);
      setMedicationInput({ drug: "", dose: "", frequency: "", duration: "" });
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen || !ownerId) return;
    let cancelled = false;
    getPetsByOwner(ownerId).then((allPets) => {
      if (cancelled) return;
      const match = allPets.find(
        (p) => p.name?.toLowerCase() === appointment?.animalName?.toLowerCase()
      ) || allPets[0] || null;
      setFullPet(match);
      if (match?.history) {
        const sorted = [...match.history].sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentHistory(sorted.slice(0, 5));
      } else {
        setRecentHistory([]);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isOpen, ownerId, appointment?.animalName]);

  useEffect(() => {
    if (!isOpen || !ownerId) return;
    let cancelled = false;
    getCustomerById(ownerId).then((data) => {
      if (!cancelled) setFullCustomer(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isOpen, ownerId]);

  if (!isOpen || !appointment) return null;

  const isGrooming  = appointment.doctor === "Grooming";
  const headerBg    = isGrooming
    ? "bg-gradient-to-r from-blue-500 to-cyan-400"
    : "bg-gradient-to-r from-green-500 to-emerald-400";

  const types = Array.isArray(appointment.type)
    ? appointment.type : [appointment.type].filter(Boolean);

  const initials = appointment.clientName
    ?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  const latestVitals  = recentHistory.find((e) => e.weight || e.temperature || e.heartRate);
  const latestWeightEntry = fullPet?.history
    ?.filter((e) => e.weight != null)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;
  const vaccinations  = recentHistory.filter((e) => isVaccination(e.reason)).slice(0, 4);
  const alertLines    = fullPet?.notes ? fullPet.notes.split("\n").map((l) => l.trim()).filter(Boolean) : [];
  const otherPets     = pets.filter((p) => p.name?.toLowerCase() !== appointment.animalName?.toLowerCase());

  // Pet bio
  const petAge = fullPet?.birthDate ? dayjs().diff(dayjs(fullPet.birthDate), "year")  : null;
  const petAgeMonths = fullPet?.birthDate ? dayjs().diff(dayjs(fullPet.birthDate), "month") % 12 : 0;
  const ageLabel = petAge !== null
    ? petAge > 0 ? `${petAge} ετ${petAge === 1 ? "ό" : "ών"}${petAgeMonths > 0 ? ` ${petAgeMonths} μ.` : ""}` : `${petAgeMonths} μήν.`
    : null;

  // Check-in delay
  const scheduledDayjs = dayjs(`${appointment.date}T${appointment.time}`);
  const delayMinutes = Math.max(0, dayjs().diff(scheduledDayjs, "minute"));

  // Templates for current appointment types
  const availableTemplates = types.filter((t) => TYPE_TEMPLATES[t]);

  const handleConsultChange = (e) => {
    const { name, value } = e.target;
    setConsultForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSymptom = (s) =>
    setExamForm((p) => ({
      ...p,
      symptoms: p.symptoms.includes(s) ? p.symptoms.filter((x) => x !== s) : [...p.symptoms, s],
    }));

  const setBodySystem = (system, value) =>
    setExamForm((p) => ({ ...p, bodySystemStatus: { ...p.bodySystemStatus, [system]: value } }));

  const handleContinueToTherapy = () => {
    const procs = [];
    let pid = 1;
    if (types.includes("Εξέταση"))       procs.push({ id: pid++, text: "Κλινική εξέταση", done: true });
    if (types.includes("Chip")) {
      procs.push({ id: pid++, text: "Τοποθέτηση microchip", done: true });
      procs.push({ id: pid++, text: "Καταχώριση microchip στο registry", done: true });
      procs.push({ id: pid++, text: "Οδηγίες προς ιδιοκτήτη", done: false });
    }
    if (types.includes("Εμβόλιο")) {
      procs.push({ id: pid++, text: "Χορήγηση εμβολίου", done: true });
      procs.push({ id: pid++, text: "Ενημέρωση εμβολιαστικού βιβλίου", done: false });
    }
    if (types.includes("Αποπαρασίτωση")) procs.push({ id: pid++, text: "Χορήγηση αποπαρασιτωτικού", done: true });
    if (types.includes("Στείρωση"))      procs.push({ id: pid++, text: "Χειρουργική επέμβαση στείρωσης", done: false });
    if (types.includes("Χειρουργείο"))   procs.push({ id: pid++, text: "Χειρουργική επέμβαση", done: false });
    if (procs.length === 0)              procs.push({ id: 1, text: "Ολοκλήρωση επίσκεψης", done: false });
    setTreatmentForm((p) => ({ ...p, procedures: procs }));
    setVisitStep(2);
  };

  const buildFinalPayload = () => {
    const abnormal = Object.entries(examForm.bodySystemStatus).filter(([, v]) => v === "Παθολογικό").map(([k]) => k);
    const doneProcedures = treatmentForm.procedures.filter((p) => p.done).map((p) => p.text);
    const medsText = treatmentForm.medications.length > 0
      ? treatmentForm.medications.map((m) => [m.drug, m.dose, m.frequency, m.duration].filter(Boolean).join(" ")).join("; ")
      : "—";

    const resultLines = [
      `Λόγος επίσκεψης: ${consultForm.reason || "—"}`,
      "",
      "1. ΙΣΤΟΡΙΚΟ ΑΠΟ ΙΔΙΟΚΤΗΤΗ",
      `Ιστορικό ιδιοκτήτη: ${examForm.ownerHistory?.trim() || "—"}`,
      `Συμπεριφορά ζώου (άφιξη): ${behavior || "—"}`,
      `Συμπτώματα: ${examForm.symptoms.length > 0 ? examForm.symptoms.join(", ") : "—"}`,
      "",
      "2. ΚΛΙΝΙΚΑ ΣΤΟΙΧΕΙΑ",
      `Ενυδάτωση: ${examForm.hydration || "—"}`,
      `Πόνος (0-5): ${examForm.painScore || "—"}`,
      `Συμπεριφορά (εξέταση): ${examForm.examBehavior || "—"}`,
      `Γενική κατάσταση: ${examForm.generalState || "—"}`,
      "",
      "3. ΣΩΜΑΤΙΚΗ ΕΞΕΤΑΣΗ",
      `Παθολογικά ευρήματα: ${abnormal.length > 0 ? abnormal.join(", ") : "—"}`,
      `Σημειώσεις: ${examForm.bodyNotes || "—"}`,
      "",
      "4. ΠΡΑΞΕΙΣ ΠΟΥ ΕΓΙΝΑΝ",
      doneProcedures.length > 0 ? doneProcedures.join(", ") : "—",
      "",
      "5. ΦΑΡΜΑΚΕΥΤΙΚΗ ΑΓΩΓΗ",
      medsText,
      "",
      "6. ΟΔΗΓΙΕΣ / ΣΧΕΔΙΟ",
      treatmentForm.instructions || "—",
    ];

    return {
      reason:      consultForm.reason || "Εξέταση",
      result:      resultLines.join("\n"),
      weight:      consultForm.weight      ? parseFloat(consultForm.weight)      : undefined,
      temperature: consultForm.temperature ? parseFloat(consultForm.temperature) : undefined,
      heartRate:   consultForm.heartRate   ? parseInt(consultForm.heartRate)     : undefined,
      diagnosis:   consultForm.diagnosis   || undefined,
      treatment:   consultForm.treatment   || undefined,
      nextVisit:   treatmentForm.scheduleFollowUp && treatmentForm.reminderDate ? treatmentForm.reminderDate : undefined,
    };
  };

  const handleComplete = async () => {
    if (fullPet) {
      setSaving(true);
      try {
        await addPetHistoryEntry(fullPet._id, buildFinalPayload());
      } catch (err) {
        alert("❌ " + err.message);
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    setTimeout(() => onClose(), 300);
  };

  const handleCheckIn = (status) => {
    setCheckInStatus(status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-[58rem] rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh] bg-white dark:bg-win-surface">

        {/* ── Compact header ── */}
        <div className={`${headerBg} px-5 py-3 flex-shrink-0 flex items-center gap-2.5`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isGrooming ? <Scissors className="w-4 h-4 text-white/70 flex-shrink-0" /> : <Stethoscope className="w-4 h-4 text-white/70 flex-shrink-0" />}
            <span className="text-white font-bold text-sm">{appointment.doctor}</span>
            <div className="flex flex-wrap gap-1">
              {types.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">{t}</span>
              ))}
            </div>
            <span className="text-white/30 hidden sm:inline mx-1">|</span>
            <span className="text-white/80 text-xs hidden sm:inline">
              {appointment.time} &middot; {appointment.duration} λεπτά &middot; {dayjs(appointment.date).locale("el").format("D MMM YYYY")}
            </span>
          </div>

          {appointment.notes && (
            <div className="flex items-center gap-1.5 bg-black/15 rounded-xl px-3 py-1.5 flex-shrink-0 max-w-[16rem]">
              <StickyNote className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
              <span className="text-white text-xs truncate" title={appointment.notes}>{appointment.notes}</span>
            </div>
          )}

          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Info bar: owner | pet | actions ── */}
        <div className="flex-shrink-0 border-b border-gray-100 dark:border-win-border bg-white dark:bg-win-surface px-5 py-2.5 flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-0">

        <div className="flex items-stretch divide-x divide-gray-100 dark:divide-win-border">
          {/* Owner */}
          <div className="flex items-center gap-3 pr-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold">{initials}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{appointment.clientName}</p>
              <div className="mt-0.5 space-y-0.5">
                {(fullCustomer?.phone || appointment.phone) && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Phone className="w-3 h-3 flex-shrink-0" />
                    {fullCustomer?.phone || appointment.phone}
                  </div>
                )}
                {fullCustomer?.email && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    {fullCustomer.email}
                  </div>
                )}
                {fullCustomer?.notifications && (fullCustomer.notifications.email || fullCustomer.notifications.sms) && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <BellRing className="w-3 h-3 flex-shrink-0" />
                    {[fullCustomer.notifications.sms && "SMS", fullCustomer.notifications.email && "Email"].filter(Boolean).join(" & ")}
                  </div>
                )}
                {alertLines.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {alertLines[0]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pet */}
          {appointment.animalName && (
            <div className="flex items-center gap-3 px-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <PawPrint className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{appointment.animalName}</p>
                <div className="mt-0.5 space-y-0.5">
                  {(fullPet?.species || fullPet?.gender) && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <PawPrint className="w-3 h-3 flex-shrink-0" />
                      {[fullPet?.species, fullPet?.gender && (fullPet.gender === "Θηλυκό" ? "♀" : "♂")].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {fullPet && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Activity className="w-3 h-3 flex-shrink-0" />
                      {latestWeightEntry ? `${latestWeightEntry.weight} kg` : "—"}
                    </div>
                  )}
                  {fullPet && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      {ageLabel || "—"}
                    </div>
                  )}
                  {fullPet?.microchip && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Dna className="w-3 h-3 flex-shrink-0" />
                      {fullPet.microchip}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2 sm:pt-0 sm:pl-5 sm:ml-auto border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-win-border">
            {Object.entries(QUICK_CARD_META).map(([key, { icon: Icon, label, color }]) => {
              const active = quickCard === key;
              return (
                <button key={key} type="button"
                  onClick={() => { setQuickCard(active ? null : key); setSelectedEntry(null); }}
                  className="group flex flex-col items-center gap-1 px-1.5 py-1 rounded-xl transition-colors">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${QUICK_ACTION_STYLES[color]} ${active ? `ring-2 ${QUICK_ACTION_RING[color]}` : ""}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className={`text-[9px] font-medium whitespace-nowrap ${active ? QUICK_ACTION_TEXT_ACTIVE[color] : "text-gray-500 dark:text-gray-400"}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0">

          {/* ── Full-width content column ── */}
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-win-bg/30">
              <div className="p-4 space-y-4">
                {!fullPet && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                        Το ζώο δεν βρέθηκε στο μητρώο. Δεν είναι δυνατή η καταχώριση.
                      </div>
                    )}

                    {/* ── New entry form (step 1 only) ── */}
                    {fullPet && visitStep === 1 && (
                      <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse flex-shrink-0" />
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Νέα Επίσκεψη</p>
                        </div>

                        {/* Visit reason chips — multi-select, sync to reason field */}
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Λόγος επίσκεψης</p>
                          <div className="flex flex-wrap gap-1.5">
                            {VISIT_REASONS.map((r) => {
                              const active = consultForm.reason.split(",").map((s) => s.trim()).includes(r);
                              return (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => setConsultForm((prev) => {
                                    const parts = prev.reason.split(",").map((s) => s.trim()).filter(Boolean);
                                    const next = active
                                      ? parts.filter((x) => x !== r)
                                      : [...parts, r];
                                    return { ...prev, reason: next.join(", ") };
                                  })}
                                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                    active
                                      ? "bg-indigo-500 border-indigo-500 text-white font-medium"
                                      : "border-gray-200 dark:border-win-border-light text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400"
                                  }`}
                                >
                                  {r}
                                </button>
                              );
                            })}
                          </div>
                        </div>


                        {/* Behavioral state + Weight side by side */}
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Συμπεριφορά ζώου</p>
                            <div className="flex flex-wrap gap-1.5">
                              {BEHAVIOR_OPTIONS.map(({ key, color }) => {
                                const s = BEHAVIOR_STYLES[color];
                                const isActive = behavior === key;
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => setBehavior(isActive ? "" : key)}
                                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${isActive ? s.active : s.base}`}
                                  >
                                    {key}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="w-px self-stretch bg-gray-200 dark:bg-win-border-light flex-shrink-0" />

                          <div className="flex-shrink-0">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Βάρος σήμερα</p>
                            <div className="flex items-center gap-1.5">
                              <input
                                name="weight"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder={latestWeightEntry ? `τελ. ${latestWeightEntry.weight}` : "0.0"}
                                value={consultForm.weight}
                                onChange={handleConsultChange}
                                className="border border-blue-200 dark:border-blue-700/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-300 dark:placeholder-gray-600 bg-blue-50/50 dark:bg-blue-900/10 text-gray-900 dark:text-gray-100 w-24"
                              />
                              <span className="text-xs text-gray-400">kg</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* ── Step 2 (now 1): Εξέταση ── */}
                    {fullPet && visitStep === 1 && (
                      <div className="flex gap-3 items-start">
                      {/* Main exam content */}
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* 1. Owner History */}
                        <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light overflow-hidden">
                          <div className="bg-gray-50 dark:bg-win-elevated/60 border-b border-gray-100 dark:border-win-border-light px-4 py-2.5 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">Ιστορικό από Ιδιοκτήτη</p>
                          </div>
                          <div className="p-4 space-y-3">
                            <textarea
                              rows={3}
                              placeholder="Ο ιδιοκτήτης αναφέρει..."
                              value={examForm.ownerHistory}
                              onChange={(e) => setExamForm((p) => ({ ...p, ownerHistory: e.target.value }))}
                              className={inputClass + " resize-none"}
                            />
                            <div className="flex flex-wrap gap-1.5">
                              {SYMPTOM_CHIPS.map((s) => {
                                const sel = examForm.symptoms.includes(s);
                                return (
                                  <button key={s} type="button" onClick={() => toggleSymptom(s)}
                                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                                      sel ? "border-indigo-400 bg-indigo-100 dark:bg-indigo-800/40 text-indigo-700 dark:text-indigo-200 font-semibold"
                                          : "border-gray-200 dark:border-win-border text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-win-elevated/50"
                                    }`}
                                  >{s}</button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* 2. Clinical Data */}
                        <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light overflow-hidden">
                          <div className="bg-gray-50 dark:bg-win-elevated/60 border-b border-gray-100 dark:border-win-border-light px-4 py-2.5 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">Κλινικά Στοιχεία</p>
                          </div>
                          <div className="p-4 space-y-3">
                            {/* Row 1: vitals */}
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: "Βάρος",      name: "weight",      val: consultForm.weight,      unit: "kg", handler: handleConsultChange },
                                { label: "Θερμοκρασία", name: "temperature", val: consultForm.temperature, unit: "°C", handler: handleConsultChange },
                              ].map(({ label, name, val, unit, handler }) => (
                                <div key={name}>
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                                  <div className="flex items-center gap-1">
                                    <input name={name} type="number" step="0.1" min="0" value={val} onChange={handler}
                                      className="border border-gray-200 dark:border-win-border-light rounded-lg px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 w-full" />
                                    <span className="text-[10px] text-gray-400 flex-shrink-0">{unit}</span>
                                  </div>
                                </div>
                              ))}
                              <div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Ενυδάτωση</p>
                                <select value={examForm.hydration} onChange={(e) => setExamForm((p) => ({ ...p, hydration: e.target.value }))}
                                  className="border border-gray-200 dark:border-win-border-light rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 w-full">
                                  {["Φυσιολογική", "Ήπια αφυδ.", "Μέτρια", "Σοβαρή"].map((o) => <option key={o}>{o}</option>)}
                                </select>
                              </div>
                            </div>
                            {/* Row 2 */}
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: "Πόνος (0-5)",     name: "painScore",    val: examForm.painScore,    opts: ["0/5","1/5","2/5","3/5","4/5","5/5"] },
                                { label: "Συμπεριφορά",     name: "examBehavior", val: examForm.examBehavior ?? "Ήρεμη", opts: ["Ήρεμη","Στρεσαρισμένη","Επιθετική","Ληθαργική"] },
                                { label: "Γενική κατάσταση",name: "generalState", val: examForm.generalState, opts: ["Καλή","Μέτρια","Κακή","Κρίσιμη"] },
                              ].map(({ label, name, val, opts }) => (
                                <div key={name}>
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                                  <select value={val} onChange={(e) => setExamForm((p) => ({ ...p, [name]: e.target.value }))}
                                    className="border border-gray-200 dark:border-win-border-light rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 w-full">
                                    {opts.map((o) => <option key={o}>{o}</option>)}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 3. Physical Examination */}
                        <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light overflow-hidden">
                          <div className="bg-gray-50 dark:bg-win-elevated/60 border-b border-gray-100 dark:border-win-border-light px-4 py-2.5 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">Σωματική Εξέταση</p>
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                              {BODY_SYSTEMS.map((sys) => {
                                const val = examForm.bodySystemStatus[sys] ?? "Φυσιολογικό";
                                const color = val === "Φυσιολογικό" ? "text-green-600 dark:text-green-400" : val === "Παθολογικό" ? "text-red-600 dark:text-red-400" : "text-gray-400";
                                return (
                                  <div key={sys} className="flex items-center justify-between gap-2">
                                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1 min-w-0">{sys}</span>
                                    <select value={val} onChange={(e) => setBodySystem(sys, e.target.value)}
                                      className={`text-xs rounded-lg px-2 py-1 border border-gray-200 dark:border-win-border focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white dark:bg-win-elevated font-medium flex-shrink-0 ${color}`}>
                                      <option>Φυσιολογικό</option>
                                      <option>Παθολογικό</option>
                                      <option>Δεν εξετάστηκε</option>
                                    </select>
                                  </div>
                                );
                              })}
                            </div>
                            <textarea rows={2} placeholder="Σημειώσεις σωματικής εξέτασης..."
                              value={examForm.bodyNotes}
                              onChange={(e) => setExamForm((p) => ({ ...p, bodyNotes: e.target.value }))}
                              className={inputClass + " resize-none"} />
                          </div>
                        </div>

                        {/* Step 2 CTA */}
                        <div className="flex items-center gap-2 pb-2">
                          <button type="button" onClick={handleContinueToTherapy} disabled={saving}
                            className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm">
                            Συνέχεια στη θεραπεία
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      </div>
                    )}

                    {/* ── Step 3 (now 2): Θεραπεία ── */}
                    {fullPet && visitStep === 2 && (
                        <div className="space-y-3">

                          {/* 1. Πράξεις που έγιναν */}
                          <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light overflow-hidden">
                            <div className="bg-gray-50 dark:bg-win-elevated/60 border-b border-gray-100 dark:border-win-border-light px-4 py-2.5 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                              <p className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">Πράξεις που Έγιναν</p>
                            </div>
                            <div className="p-4 space-y-2">
                              {treatmentForm.procedures.map((proc) => (
                                <label key={proc.id} className="flex items-center gap-2.5 cursor-pointer group">
                                  <input type="checkbox" checked={proc.done}
                                    onChange={() => setTreatmentForm((p) => ({ ...p, procedures: p.procedures.map((pr) => pr.id === proc.id ? { ...pr, done: !pr.done } : pr) }))}
                                    className="w-4 h-4 accent-indigo-500 flex-shrink-0" />
                                  <span className={`text-sm ${proc.done ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-200"}`}>{proc.text}</span>
                                </label>
                              ))}
                              <button type="button"
                                onClick={() => {
                                  const txt = window.prompt("Νέα πράξη:");
                                  if (txt?.trim()) setTreatmentForm((p) => ({ ...p, procedures: [...p.procedures, { id: Date.now(), text: txt.trim(), done: false }] }));
                                }}
                                className="mt-1 flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 font-medium transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                                Προσθήκη πράξης
                              </button>
                            </div>
                          </div>

                          {/* 2. Φαρμακευτική αγωγή */}
                          <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light overflow-hidden">
                            <div className="bg-gray-50 dark:bg-win-elevated/60 border-b border-gray-100 dark:border-win-border-light px-4 py-2.5 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                              <p className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">Φαρμακευτική Αγωγή</p>
                            </div>
                            <div className="p-4 space-y-3">
                              {treatmentForm.medications.length > 0 && (
                                <ul className="space-y-1.5">
                                  {treatmentForm.medications.map((m) => (
                                    <li key={m.id} className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-win-elevated/40 rounded-lg px-3 py-1.5">
                                      <Pill className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                      <span className="font-semibold text-gray-800 dark:text-gray-100">{m.drug}</span>
                                      {m.dose && <span className="text-gray-400">{m.dose}</span>}
                                      {m.frequency && <span className="text-gray-400">· {m.frequency}</span>}
                                      {m.duration && <span className="text-gray-400">· {m.duration}</span>}
                                      <button type="button" onClick={() => setTreatmentForm((p) => ({ ...p, medications: p.medications.filter((x) => x.id !== m.id) }))}
                                        className="ml-auto text-red-400 hover:text-red-600 transition-colors">✕</button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <div className="grid grid-cols-4 gap-2">
                                <DrugSearchInput
                                  value={medicationInput.drug}
                                  onChange={(v) => setMedicationInput((p) => ({ ...p, drug: v }))}
                                  onSelect={(prod) => setMedicationInput((p) => ({ ...p, drug: prod.name }))}
                                  placeholder="Αναζήτηση φαρμάκου..."
                                  className={inputClass + " col-span-2"}
                                />
                                <input placeholder="π.χ. 5 mg/kg" value={medicationInput.dose}
                                  onChange={(e) => setMedicationInput((p) => ({ ...p, dose: e.target.value }))}
                                  className={inputClass} />
                                <select value={medicationInput.frequency}
                                  onChange={(e) => setMedicationInput((p) => ({ ...p, frequency: e.target.value }))}
                                  className={inputClass}>
                                  <option value="">Επιλέξτε...</option>
                                  {["1×/ημέρα","2×/ημέρα","3×/ημέρα","Κάθε 8ω","Κάθε 12ω","Εφάπαξ"].map((o) => <option key={o}>{o}</option>)}
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <input placeholder="π.χ. 5 ημέρες" value={medicationInput.duration}
                                  onChange={(e) => setMedicationInput((p) => ({ ...p, duration: e.target.value }))}
                                  className={inputClass + " flex-1"} />
                                <button type="button"
                                  onClick={() => {
                                    if (!medicationInput.drug.trim()) return;
                                    setTreatmentForm((p) => ({ ...p, medications: [...p.medications, { ...medicationInput, id: Date.now() }] }));
                                    setMedicationInput({ drug: "", dose: "", frequency: "", duration: "" });
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-semibold transition-colors flex-shrink-0">
                                  <Plus className="w-3.5 h-3.5" />
                                  Προσθήκη φαρμάκου
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 3. Οδηγίες / Σχέδιο */}
                          <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light overflow-hidden">
                            <div className="bg-gray-50 dark:bg-win-elevated/60 border-b border-gray-100 dark:border-win-border-light px-4 py-2.5 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                              <p className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">Οδηγίες / Σχέδιο</p>
                            </div>
                            <div className="p-4 space-y-3">
                              <textarea rows={5} placeholder="Οδηγίες για τον ιδιοκτήτη..."
                                value={treatmentForm.instructions}
                                onChange={(e) => setTreatmentForm((p) => ({ ...p, instructions: e.target.value }))}
                                className={inputClass + " resize-none"} />
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  { label: "Εισαγωγή οδηγιών chip",     key: "chip",     show: types.includes("Chip") },
                                  { label: "Εισαγωγή οδηγιών εμβολίου", key: "vaccine",  show: types.includes("Εμβόλιο") },
                                  { label: "Εισαγωγή επανελέγχου",       key: "followup", show: true },
                                ].filter((t) => t.show).map(({ label, key }) => (
                                  <button key={key} type="button"
                                    onClick={() => setTreatmentForm((p) => ({ ...p, instructions: p.instructions.trim() ? p.instructions.trimEnd() + "\n\n" + INSTRUCTION_TEMPLATES[key] : INSTRUCTION_TEMPLATES[key] }))}
                                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-win-border text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-win-elevated/50 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* 4. Follow-up / Reminder */}
                          <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light overflow-hidden">
                            <div className="bg-gray-50 dark:bg-win-elevated/60 border-b border-gray-100 dark:border-win-border-light px-4 py-2.5 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0">4</span>
                              <p className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">Follow-up / Reminder</p>
                            </div>
                            <div className="p-4 space-y-3">
                              {[
                                { field: "followUpReminder", label: "Reminder επόμενου εμβολίου" },
                                { field: "sendEmailSms",     label: "Αποστολή οδηγιών με Email/SMS" },
                                { field: "scheduleFollowUp", label: "Προγραμματισμός επανελέγχου αν χρειαστεί" },
                              ].map(({ field, label }) => (
                                <label key={field} className="flex items-center gap-3 cursor-pointer">
                                  <div onClick={() => setTreatmentForm((p) => ({ ...p, [field]: !p[field] }))}
                                    className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 cursor-pointer ${treatmentForm[field] ? "bg-indigo-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${treatmentForm[field] ? "translate-x-4" : "translate-x-0.5"}`} />
                                  </div>
                                  <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
                                </label>
                              ))}
                              {treatmentForm.followUpReminder && (
                                <div className="pl-12 space-y-1">
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Προτεινόμενη ημερομηνία reminder</p>
                                  <input type="date" value={treatmentForm.reminderDate}
                                    onChange={(e) => setTreatmentForm((p) => ({ ...p, reminderDate: e.target.value }))}
                                    className={inputClass} />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* CTA */}
                          <div className="flex items-center gap-2 pb-2">
                            <button type="button" onClick={() => setVisitStep(1)} disabled={saving}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-win-elevated/50 transition-colors">
                              <ArrowLeft className="w-4 h-4" />
                              Πίσω στην εξέταση
                            </button>
                            <button type="button" onClick={handleComplete} disabled={saving}
                              className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm">
                              <CheckCircle className="w-4 h-4" />
                              Ολοκλήρωση Ραντεβού
                            </button>
                          </div>
                        </div>
                    )}

              </div>
          </div>
        </div>

        {/* ── Quick action card (separate overlay, doesn't replace main content) ── */}
        {quickCard && (() => {
          const meta = QUICK_CARD_META[quickCard];
          const CardIcon = meta.icon;
          const close = () => { setQuickCard(null); setSelectedEntry(null); };
          return (
            <div className="absolute inset-0 z-20 bg-black/30 flex items-center justify-center p-4" onClick={close}>
              <div
                className="bg-white dark:bg-win-surface rounded-2xl shadow-2xl w-full max-w-md max-h-[85%] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-win-border flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${QUICK_ACTION_STYLES[meta.color]}`}>
                      <CardIcon className="w-3.5 h-3.5" />
                    </span>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{meta.title}</p>
                  </div>
                  <button onClick={close} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-win-elevated/50 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 overflow-y-auto">
                  {quickCard === "chip" ? (
                    <ChipScanCard
                      pet={fullPet}
                      onSaved={(updated) => { setFullPet(updated); setQuickCard(null); }}
                    />
                  ) : quickCard !== "history" ? (
                    <PlaceholderCard icon={CardIcon} title={meta.title} color={meta.color} />
                  ) : selectedEntry ? (
                    <div className="space-y-3">
                      <button onClick={() => setSelectedEntry(null)} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Επιστροφή
                      </button>
                      <div className="bg-white dark:bg-win-elevated/50 rounded-xl border border-gray-100 dark:border-win-border-light overflow-hidden">
                        <div className="bg-gray-50 dark:bg-win-elevated/80 px-4 py-2.5 border-b border-gray-100 dark:border-win-border-light flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {dayjs(selectedEntry.date).locale("el").format("dddd, DD MMMM YYYY")}
                          </span>
                          <span className="text-xs text-gray-400">
                            {dayjs(selectedEntry.date).format("HH:mm")}
                          </span>
                        </div>
                        <div className="px-4 py-3 space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs bg-blue-50   dark:bg-blue-900/30   text-blue-600   dark:text-blue-300   px-2.5 py-1 rounded-lg font-medium">⚖ {selectedEntry.weight      ?? "—"} kg</span>
                            <span className="text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-2.5 py-1 rounded-lg font-medium">🌡 {selectedEntry.temperature ?? "—"} °C</span>
                            <span className="text-xs bg-red-50    dark:bg-red-900/30    text-red-500    dark:text-red-300    px-2.5 py-1 rounded-lg font-medium">♥ {selectedEntry.heartRate   ?? "—"} bpm</span>
                          </div>
                          <div className="space-y-1.5">
                            {[
                              ["Λόγος",     selectedEntry.reason],
                              ["Αποτέλεσμα", selectedEntry.result],
                              ["Διάγνωση",  selectedEntry.diagnosis],
                              ["Αγωγή",     selectedEntry.treatment],
                              ["Επόμενη",   selectedEntry.nextVisit ? dayjs(selectedEntry.nextVisit).format("DD/MM/YYYY") : null],
                              ["Κτηνίατρος", selectedEntry.vet],
                            ].map(([label, value]) => (
                              <div key={label} className="flex gap-2 text-sm">
                                <span className="text-gray-400 dark:text-gray-500 w-24 flex-shrink-0 text-xs pt-0.5">{label}</span>
                                <span className="text-gray-800 dark:text-gray-100 font-medium whitespace-pre-line">{value || "—"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : !fullPet ? (
                    <p className="text-sm text-gray-400 text-center py-8">Δεν βρέθηκε κατοικίδιο.</p>
                  ) : (
                    <div>
                      {recentHistory.length === 0 ? (
                        <div className="bg-white dark:bg-win-elevated/30 rounded-xl border border-gray-100 dark:border-win-border-light py-8 text-center">
                          <Clock className="w-5 h-5 text-gray-200 dark:text-gray-600 mx-auto mb-1" />
                          <p className="text-xs text-gray-400">Δεν υπάρχουν προηγούμενες επισκέψεις</p>
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {recentHistory.map((entry) => {
                            const dot = entryDotColor(entry.reason);
                            const hasBottom = entry.diagnosis || entry.treatment || entry.nextVisit || entry.vet;
                            const hasVitals = entry.weight || entry.temperature || entry.heartRate;
                            return (
                              <li key={entry._id}
                                onClick={() => setSelectedEntry(entry)}
                                className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-100 dark:border-win-border-light overflow-hidden cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-700/50 hover:shadow-sm transition-all">
                                <div className="p-3">
                                  <div className="flex items-start gap-3">
                                    <div className="flex items-start gap-2 flex-shrink-0 w-12">
                                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />
                                      <div className="text-center">
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">{dayjs(entry.date).format("DD")}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase leading-tight">{dayjs(entry.date).locale("el").format("MMM")}</p>
                                        <p className="text-[10px] text-gray-300 dark:text-gray-600 leading-tight">{dayjs(entry.date).format("YYYY")}</p>
                                      </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-1">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug">{entry.reason}</p>
                                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                                      </div>

                                      {entry.result && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">{entry.result}</p>
                                      )}

                                      {hasVitals && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                          {entry.weight      && <span className="text-xs bg-blue-50   dark:bg-blue-900/30   text-blue-500   dark:text-blue-400   px-1.5 py-0.5 rounded-md font-medium">⚖ {entry.weight} kg</span>}
                                          {entry.temperature && <span className="text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400 px-1.5 py-0.5 rounded-md font-medium">🌡 {entry.temperature}°C</span>}
                                          {entry.heartRate   && <span className="text-xs bg-red-50    dark:bg-red-900/30    text-red-500    dark:text-red-400    px-1.5 py-0.5 rounded-md font-medium">♥ {entry.heartRate} bpm</span>}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {hasBottom && (
                                    <div className="mt-2.5 pt-2.5 border-t border-gray-50 dark:border-win-border/30 ml-14 space-y-2">
                                      {(entry.diagnosis || entry.treatment) && (
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Διάγνωση / Εκτίμηση</p>
                                            <p className="text-xs text-gray-700 dark:text-gray-200">{entry.diagnosis || "Καμία"}</p>
                                          </div>
                                          <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Θεραπείες</p>
                                            <p className="text-xs text-gray-700 dark:text-gray-200">{entry.treatment || "Καμία"}</p>
                                          </div>
                                        </div>
                                      )}
                                      {entry.nextVisit && (
                                        <div className="flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-400">
                                          <Calendar className="w-3 h-3 flex-shrink-0" />
                                          Επόμενο: {dayjs(entry.nextVisit).format("DD/MM/YYYY")}
                                        </div>
                                      )}
                                      {entry.vet && (
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">Dr. {entry.vet}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default AppointmentPreviewModal;
