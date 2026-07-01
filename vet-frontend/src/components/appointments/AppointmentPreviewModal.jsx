import React, { useState, useEffect, useRef } from "react";
import {
  Calendar, Clock, Stethoscope, Scissors,
  StickyNote, PawPrint, ShoppingBag, Pill, X,
  Plus, ChevronDown, ChevronUp, Activity, ChevronRight, ArrowLeft,
  CheckCircle, AlertCircle, Syringe, Check, Timer, Zap,
  UserCheck, DoorOpen, XCircle, Dna, MoreVertical,
  Phone, Mail, BellRing,
} from "lucide-react";
import dayjs from "dayjs";
import { useCustomerPets } from "../../hooks/useCustomerPets";
import PetProfile from "../pets/PetProfile";
import InlinePurchases from "./InlinePurchases.jsx";
import InlinePrescriptions from "./InlinePrescriptions.jsx";
import { addPetHistoryEntry, getPetsByOwner } from "../../api/petsApi.js";
import { getCustomerById } from "../../api/customersApi.js";

const emptyConsultForm = {
  reason: "", result: "", weight: "", temperature: "", heartRate: "", diagnosis: "", treatment: "",
};

const inputClass =
  "border border-gray-200 dark:border-win-border-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 w-full";

const VISIT_STEPS = [
  { key: "arrival",   label: "Άφιξη" },
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

const SUGGESTED_CHARGES = {
  "Εξέταση":       { label: "Κλινική εξέταση",      price: 25 },
  "Chip":           { label: "Τοποθέτηση microchip", price: 20 },
  "Εμβόλιο":       { label: "Εμβολιασμός",           price: 20 },
  "Αποπαρασίτωση": { label: "Αποπαρασίτωση",         price: 15 },
  "Στείρωση":      { label: "Στείρωση",              price: 80 },
  "Χειρουργείο":   { label: "Χειρουργείο",           price: 150 },
  "Μπάνιο":        { label: "Grooming - Μπάνιο",     price: 25 },
  "Κούρεμα":       { label: "Grooming - Κούρεμα",    price: 20 },
};

const INSTRUCTION_TEMPLATES = {
  chip:    "Τοποθετήθηκε microchip με επιτυχία και καταχωρήθηκε στο registry.\nΕίναι φυσιολογικό μια ήπια ευαισθησία στην περιοχή για 1-2 ημέρες.\nΠαρακολουθήστε για ερυθρότητα, οίδημα ή πόνο και επικοινωνήστε μαζί μας αν παρατηρήσετε κάτι ασυνήθιστο.\nΣυνεχίστε κανονικά τη ρουτίνα πρόληψης και τη σωστή διατροφή.",
  vaccine: "Χορηγήθηκε εμβόλιο. Μπορεί να εμφανιστεί ήπια αδυναμία ή ευαισθησία στο σημείο έγχυσης για 24-48 ώρες.\nΕπικοινωνήστε αμέσως αν εμφανιστεί έντονη αντίδραση ή αλλεργία.\nΤο επόμενο εμβόλιο προγραμματίζεται σε 1 χρόνο.",
  followup: "Παρακαλώ επισκεφθείτε μας σε ____ εβδομάδες για επανέλεγχο.\nΕπικοινωνήστε μαζί μας αν παρατηρήσετε επιδείνωση της κατάστασης ή νέα συμπτώματα.",
};

const emptyCompletionForm = {
  summary:             "",
  printedInstructions: false,
  sentEmailSms:        false,
  registeredChip:      false,
};

const emptyTreatmentForm = {
  procedures:       [],
  noPharma:         true,
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
  findings:         "",
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

function formatElapsed(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
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

function InfoItem({ icon: Icon, value, iconColor = "text-gray-400" }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${iconColor}`} />
      <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{value || "—"}</span>
    </div>
  );
}

const TAB_VIEW_MAP = { consult: null, overview: null, purchases: "purchases", prescriptions: "prescriptions", pet: "pet" };

const BOTTOM_ACTIONS = [
  { key: "purchases",     label: "Αγορές",     icon: ShoppingBag },
  { key: "prescriptions", label: "Συνταγές",   icon: Pill },
  { key: "pet",           label: "Κατοικίδιο", icon: PawPrint },
];

const AppointmentPreviewModal = ({ isOpen, onClose, appointment, initialTab = "overview" }) => {
  const [activeView,    setActiveView]    = useState(TAB_VIEW_MAP[initialTab] ?? null);
  const [visitStep,     setVisitStep]     = useState(1);
  const [elapsed,       setElapsed]       = useState(0);
  const [completing,    setCompleting]    = useState(false);
  const [checkInStatus, setCheckInStatus] = useState("waiting"); // "waiting"|"entered"|"noshow"
  const [behavior,      setBehavior]      = useState("");
  const [consultForm,   setConsultForm]   = useState(emptyConsultForm);
  const [examForm,      setExamForm]      = useState(emptyExamForm);
  const [pendingTasks,    setPendingTasks]    = useState([]);
  const [treatmentForm,   setTreatmentForm]   = useState(emptyTreatmentForm);
  const [medicationInput, setMedicationInput] = useState({ drug: "", dose: "", frequency: "", duration: "" });
  const [completionForm,  setCompletionForm]  = useState(emptyCompletionForm);
  const [saving,          setSaving]          = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [recentHistory, setRecentHistory] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [fullPet,       setFullPet]       = useState(null);
  const [fullCustomer,  setFullCustomer]  = useState(null);
  const timerRef = useRef(null);

  const ownerId = typeof appointment?.owner === "object"
    ? appointment?.owner._id
    : appointment?.owner || null;

  const { pets } = useCustomerPets(ownerId);
  const matchedPet = pets.find(
    (p) => p.name?.toLowerCase() === appointment?.animalName?.toLowerCase()
  ) || pets[0] || null;

  useEffect(() => {
    if (isOpen) {
      setActiveView(TAB_VIEW_MAP[initialTab] ?? null);
      setVisitStep(1);
      setElapsed(0);
      setCompleting(false);
      setCheckInStatus("waiting");
      setBehavior("");
      setConsultForm(emptyConsultForm);
      setExamForm(emptyExamForm);
      setSaved(false);
      setFullPet(null);
      setRecentHistory([]);
      setSelectedEntry(null);
      setPendingTasks([]);
      setTreatmentForm(emptyTreatmentForm);
      setMedicationInput({ drug: "", dose: "", frequency: "", duration: "" });
      setCompletionForm(emptyCompletionForm);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [isOpen]);

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

  const appointmentCharges = [
    ...types.flatMap((t) => (SUGGESTED_CHARGES[t] ? [SUGGESTED_CHARGES[t]] : [])),
    ...(types.includes("Chip") ? [{ label: "Microchip", price: 15 }] : []),
  ];
  const chargesSubtotal = appointmentCharges.reduce((s, c) => s + c.price, 0);
  const chargesVat      = +(chargesSubtotal * 0.24).toFixed(2);
  const chargesTotal    = +(chargesSubtotal + chargesVat).toFixed(2);

  const initials = appointment.clientName
    ?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  const latestVitals  = recentHistory.find((e) => e.weight || e.temperature || e.heartRate);
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

  const buildPayload = () => {
    const resultParts = [
      behavior ? `Κατάσταση: ${behavior}` : null,
      consultForm.result || null,
    ].filter(Boolean);
    return {
      reason:      consultForm.reason,
      result:      resultParts.length ? resultParts.join(". ") : undefined,
      weight:      consultForm.weight      ? parseFloat(consultForm.weight)      : undefined,
      temperature: consultForm.temperature ? parseFloat(consultForm.temperature) : undefined,
      heartRate:   consultForm.heartRate   ? parseInt(consultForm.heartRate)     : undefined,
      diagnosis:   consultForm.diagnosis   || undefined,
      treatment:   consultForm.treatment   || undefined,
    };
  };

  const doSave = async () => {
    if (!consultForm.reason.trim() || !fullPet) return false;
    setSaving(true);
    try {
      await addPetHistoryEntry(fullPet._id, buildPayload());
      setConsultForm(emptyConsultForm);
      setBehavior("");
      setSaved(true);
      const freshPets = await getPetsByOwner(ownerId);
      const fresh = freshPets.find((p) => p._id === fullPet._id);
      if (fresh?.history) {
        const sorted = [...fresh.history].sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentHistory(sorted.slice(0, 5));
        setFullPet(fresh);
      }
      return true;
    } catch (err) {
      alert("❌ " + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e) => { e.preventDefault(); await doSave(); };

  const handleStartExam = async () => {
    if (consultForm.reason.trim() && fullPet) await doSave();
    const apptTypes = Array.isArray(appointment?.type) ? appointment.type : [appointment?.type].filter(Boolean);
    const defaultTasks = [];
    if (apptTypes.some((t) => t === "Chip" || t === "Microchip")) {
      defaultTasks.push({ id: 1, text: "Καταχώριση αριθμού chip", done: false });
      defaultTasks.push({ id: 2, text: "Εκτύπωση/αποστολή οδηγιών", done: false });
    }
    if (apptTypes.some((t) => t === "Εμβόλιο")) {
      defaultTasks.push({ id: 3, text: "Reminder επόμενου εμβολίου", done: false });
    }
    if (defaultTasks.length === 0) {
      defaultTasks.push({ id: 1, text: "Ολοκλήρωση καταχώρισης", done: false });
    }
    setPendingTasks(defaultTasks);
    setVisitStep(2);
  };

  const toggleSymptom = (s) =>
    setExamForm((p) => ({
      ...p,
      symptoms: p.symptoms.includes(s) ? p.symptoms.filter((x) => x !== s) : [...p.symptoms, s],
    }));

  const setBodySystem = (system, value) =>
    setExamForm((p) => ({ ...p, bodySystemStatus: { ...p.bodySystemStatus, [system]: value } }));

  const buildExamPayload = () => {
    const symptomText = examForm.symptoms.length > 0 ? `Συμπτώματα: ${examForm.symptoms.join(", ")}` : null;
    const reasonParts = [consultForm.reason, symptomText].filter(Boolean);
    const abnormal = Object.entries(examForm.bodySystemStatus).filter(([, v]) => v === "Παθολογικό").map(([k]) => k);
    const resultParts = [
      behavior ? `Συμπεριφορά: ${behavior}` : null,
      examForm.generalState ? `Γεν. κατάσταση: ${examForm.generalState}` : null,
      examForm.findings || null,
      examForm.bodyNotes || null,
      abnormal.length > 0 ? `Παθολογικά: ${abnormal.join(", ")}` : null,
    ].filter(Boolean);
    const ownerNote = examForm.ownerHistory?.trim()
      ? `Ιστορικό ιδιοκτήτη: ${examForm.ownerHistory.trim()}`
      : null;
    return {
      reason:      reasonParts.join(". ") || "Εξέταση",
      result:      [ownerNote, ...resultParts].filter(Boolean).join(". ") || undefined,
      weight:      consultForm.weight      ? parseFloat(consultForm.weight)      : undefined,
      temperature: consultForm.temperature ? parseFloat(consultForm.temperature) : undefined,
      heartRate:   consultForm.heartRate   ? parseInt(consultForm.heartRate)     : undefined,
      diagnosis:   consultForm.diagnosis   || undefined,
      treatment:   consultForm.treatment   || undefined,
    };
  };

  const doSaveExam = async () => {
    if (!fullPet) return false;
    setSaving(true);
    try {
      await addPetHistoryEntry(fullPet._id, buildExamPayload());
      setSaved(true);
      const freshPets = await getPetsByOwner(ownerId);
      const fresh = freshPets.find((p) => p._id === fullPet._id);
      if (fresh?.history) {
        const sorted = [...fresh.history].sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentHistory(sorted.slice(0, 5));
        setFullPet(fresh);
      }
      return true;
    } catch (err) {
      alert("❌ " + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleContinueToTherapy = async () => {
    await doSaveExam();
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
    setVisitStep(3);
  };

  const handleGoToCompletion = () => {
    const petName = fullPet?.name || "Το ζώο";
    const doneProcedures = treatmentForm.procedures.filter((p) => p.done).map((p) => p.text.toLowerCase());
    const parts = [];
    if (doneProcedures.some((p) => p.includes("εξέταση")))
      parts.push(`${petName} εξετάστηκε κλινικά και βρέθηκε σε καλή κατάσταση.`);
    if (doneProcedures.some((p) => p.includes("microchip")))
      parts.push("Τοποθετήθηκε microchip επιτυχώς και καταχωρήθηκε στο Εθνικό Μητρώο Ζώων Συντροφιάς.");
    if (doneProcedures.some((p) => p.includes("εμβόλ")))
      parts.push("Πραγματοποιήθηκε εμβολιασμός χωρίς επιπλοκές.");
    if (doneProcedures.some((p) => p.includes("αποπαρ")))
      parts.push("Χορηγήθηκε αποπαρασιτωτικό.");
    if (treatmentForm.instructions)
      parts.push("Ο ιδιοκτήτης ενημερώθηκε για τη φροντίδα του ζώου και έλαβε οδηγίες.");
    parts.push(treatmentForm.medications.length > 0
      ? "Χορηγήθηκε φαρμακευτική αγωγή."
      : "Δεν παρουσιάστηκαν επιπλοκές κατά τη διάρκεια της επίσκεψης."
    );
    setCompletionForm({
      summary: parts.join(" "),
      printedInstructions: treatmentForm.instructions.length > 0,
      sentEmailSms: treatmentForm.sendEmailSms,
      registeredChip: types.includes("Chip"),
    });
    setVisitStep(4);
  };

  const handleFinalComplete = () => {
    setCompleting(true);
    clearInterval(timerRef.current);
    setTimeout(() => onClose(), 300);
  };

  const handleComplete = () => {
    setCompleting(true);
    clearInterval(timerRef.current);
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

          <div className="flex items-center gap-1.5 bg-black/15 rounded-xl px-3 py-1.5 flex-shrink-0">
            <Timer className="w-3.5 h-3.5 text-white/70" />
            <span className="text-white font-mono text-sm font-bold tracking-wider">{formatElapsed(elapsed)}</span>
            <span className="text-white/50 text-[10px] hidden sm:inline">Διάρκεια</span>
          </div>

          <button
            onClick={handleComplete}
            disabled={completing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white disabled:opacity-70 text-emerald-600 text-xs font-bold transition-all shadow-sm flex-shrink-0"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ολοκλήρωση</span>
          </button>

          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── 2-column body ── */}
        <div className="flex flex-1 min-h-0">

          {/* ── Left column ── */}
          <div className="w-56 flex-shrink-0 border-r border-gray-100 dark:border-win-border overflow-y-auto bg-white dark:bg-win-surface p-4 space-y-5">

            {/* Patient */}
            <div>
              <SectionLabel>Ιδιοκτήτης</SectionLabel>
              <div className="rounded-xl border border-gray-200 dark:border-win-border-light bg-gray-50 dark:bg-win-elevated/30 divide-y divide-gray-100 dark:divide-win-border-light overflow-hidden">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{appointment.clientName}</p>
                </div>
                {(fullCustomer?.phone || appointment.phone) && (
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">{fullCustomer?.phone || appointment.phone}</span>
                  </div>
                )}
                {fullCustomer?.email && (
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-300 break-all">{fullCustomer.email}</span>
                  </div>
                )}
                {fullCustomer?.notifications && (
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <BellRing className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {fullCustomer.notifications.email || fullCustomer.notifications.sms ? (
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        Προτιμά {[
                          fullCustomer.notifications.sms   && "SMS",
                          fullCustomer.notifications.email && "Email",
                        ].filter(Boolean).join(" & ")}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Χωρίς ειδοποιήσεις</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Alerts — always visible */}
            <div>
              <SectionLabel>⚠ Σημαντικά Alerts</SectionLabel>
              {alertLines.length > 0 ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 rounded-xl p-2.5 space-y-1.5">
                  {alertLines.map((line, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-red-700 dark:text-red-300 leading-snug">{line}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-300 dark:text-gray-600 italic">Δεν υπάρχουν καταγεγραμμένα alerts</p>
              )}
            </div>

            {/* Pet — full details */}
            {appointment.animalName && (
              <div>
                <SectionLabel>Κατοικίδιο</SectionLabel>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                    <PawPrint className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{appointment.animalName}</p>
                    {fullPet?.species && <p className="text-xs text-gray-400">{fullPet.species}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  {fullPet?.gender && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 dark:text-gray-500">Φύλο</span>
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {fullPet.gender === "Θηλυκό" ? "♀ Θηλυκό" : "♂ Αρσενικό"}
                      </span>
                    </div>
                  )}
                  {ageLabel && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 dark:text-gray-500">Ηλικία</span>
                      <span className="font-medium text-gray-700 dark:text-gray-200">{ageLabel}</span>
                    </div>
                  )}
                  {latestVitals?.weight && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 dark:text-gray-500">Βάρος</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">{latestVitals.weight} kg</span>
                    </div>
                  )}
                  {fullPet !== null && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 dark:text-gray-500">Στειρωμένο</span>
                      <span className={`font-medium px-1.5 py-0.5 rounded-md text-[10px] ${fullPet?.neutered ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "text-gray-400 dark:text-gray-500"}`}>
                        {fullPet?.neutered ? "Ναι" : "Όχι"}
                      </span>
                    </div>
                  )}
                  {fullPet?.microchip && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Dna className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                      <span className="text-gray-400 dark:text-gray-500">Chip</span>
                      <span className="font-mono text-gray-700 dark:text-gray-200 truncate">{fullPet.microchip}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Weight chart */}
            <WeightChart history={recentHistory} />

            {/* Vitals */}
            {latestVitals && (latestVitals.temperature || latestVitals.heartRate) && (
              <div>
                <SectionLabel>Τελευταίες Μετρήσεις</SectionLabel>
                <div className="space-y-1.5">
                  {latestVitals.temperature && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 dark:text-gray-500">Θερμ.</span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-md">{latestVitals.temperature}°C</span>
                    </div>
                  )}
                  {latestVitals.heartRate && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 dark:text-gray-500">Καρδιά</span>
                      <span className="font-semibold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-md">{latestVitals.heartRate} bpm</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vaccinations */}
            {vaccinations.length > 0 && (
              <div>
                <SectionLabel>Εμβόλια / Προληπτικά</SectionLabel>
                <div className="space-y-1.5">
                  {vaccinations.map((v) => (
                    <div key={v._id} className="flex items-center gap-2">
                      <Syringe className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{v.reason}</p>
                        <p className="text-[10px] text-gray-400">{dayjs(v.date).format("DD/MM/YYYY")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes (if not shown as alerts) */}
            {appointment.notes && !alertLines.length && (
              <div>
                <SectionLabel>Σημειώσεις</SectionLabel>
                <div className="flex gap-2">
                  <StickyNote className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{appointment.notes}</p>
                </div>
              </div>
            )}

            {/* Other pets */}
            {otherPets.length > 0 && (
              <div>
                <SectionLabel>Άλλα Κατοικίδια</SectionLabel>
                <div className="space-y-1.5">
                  {otherPets.map((pet) => (
                    <div key={pet._id} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                      <PawPrint className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                      <span className="font-medium">{pet.name}</span>
                      {pet.species && <span className="text-gray-400">{pet.species}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-win-bg/30">
            {activeView === null && (
              <div className="p-4 space-y-4">

                {/* Progress steps */}
                <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-100 dark:border-win-border-light px-4 py-3">
                  <div className="flex items-center">
                    {VISIT_STEPS.map((step, idx) => {
                      const stepNum = idx + 1;
                      const done   = stepNum < visitStep;
                      const active = stepNum === visitStep;
                      return (
                        <React.Fragment key={step.key}>
                          <button type="button" onClick={() => setVisitStep(stepNum)} className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                              done   ? "bg-indigo-500 border-indigo-500 text-white" :
                              active ? "bg-white dark:bg-win-surface border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm" :
                                       "bg-transparent border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-600"
                            }`}>
                              {done ? <Check className="w-3 h-3" /> : stepNum}
                            </div>
                            <span className={`text-[10px] font-semibold whitespace-nowrap ${
                              active ? "text-indigo-600 dark:text-indigo-400" :
                              done   ? "text-indigo-400 dark:text-indigo-500" :
                                       "text-gray-300 dark:text-gray-600"
                            }`}>{step.label}</span>
                          </button>
                          {idx < VISIT_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-colors ${idx + 1 < visitStep ? "bg-indigo-400" : "bg-gray-100 dark:bg-gray-700"}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* ── CHECK-IN BLOCK (only step 1) ── */}
                {visitStep === 1 && (
                  <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light overflow-hidden">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-700/30 px-4 py-2.5 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-500" />
                      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">Κατάσταση Άφιξης</p>
                    </div>
                    <div className="p-4 space-y-3">
                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Ώρα ραντ.</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{appointment.time}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Καθυστέρηση</p>
                          <p className={`text-sm font-bold ${delayMinutes > 0 ? "text-amber-500" : "text-green-500"}`}>
                            {delayMinutes > 0 ? `+${delayMinutes} λεπτά` : "Στην ώρα"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Αναμονή</p>
                          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">{formatElapsed(elapsed)}</p>
                        </div>
                      </div>
                      {/* Status buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleCheckIn("waiting")}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            checkInStatus === "waiting"
                              ? "bg-amber-50 dark:bg-amber-900/30 border-amber-300 text-amber-700 dark:text-amber-300"
                              : "border-gray-200 dark:border-win-border text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-win-elevated/50"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Σε αναμονή
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCheckIn("entered")}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            checkInStatus === "entered"
                              ? "bg-green-50 dark:bg-green-900/30 border-green-300 text-green-700 dark:text-green-300"
                              : "border-gray-200 dark:border-win-border text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-win-elevated/50"
                          }`}
                        >
                          <DoorOpen className="w-3.5 h-3.5" />
                          Μπήκε
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCheckIn("noshow")}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            checkInStatus === "noshow"
                              ? "bg-red-50 dark:bg-red-900/30 border-red-300 text-red-700 dark:text-red-300"
                              : "border-gray-200 dark:border-win-border text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-win-elevated/50"
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Δεν ήρθε
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* History entry detail */}
                {selectedEntry ? (
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
                      </div>
                      <div className="px-4 py-3 space-y-3">
                        {(selectedEntry.weight || selectedEntry.temperature || selectedEntry.heartRate) && (
                          <div className="flex flex-wrap gap-2">
                            {selectedEntry.weight      && <span className="text-xs bg-blue-50   dark:bg-blue-900/30   text-blue-600   dark:text-blue-300   px-2.5 py-1 rounded-lg font-medium">⚖ {selectedEntry.weight} kg</span>}
                            {selectedEntry.temperature && <span className="text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-2.5 py-1 rounded-lg font-medium">🌡 {selectedEntry.temperature}°C</span>}
                            {selectedEntry.heartRate   && <span className="text-xs bg-red-50    dark:bg-red-900/30    text-red-500    dark:text-red-300    px-2.5 py-1 rounded-lg font-medium">♥ {selectedEntry.heartRate} bpm</span>}
                          </div>
                        )}
                        <div className="space-y-1.5">
                          {[["Λόγος", selectedEntry.reason], ["Αποτέλεσμα", selectedEntry.result], ["Διάγνωση", selectedEntry.diagnosis], ["Αγωγή", selectedEntry.treatment], ["Κτηνίατρος", selectedEntry.vet]]
                            .filter(([, v]) => v).map(([label, value]) => (
                            <div key={label} className="flex gap-2 text-sm">
                              <span className="text-gray-400 dark:text-gray-500 w-24 flex-shrink-0 text-xs pt-0.5">{label}</span>
                              <span className="text-gray-800 dark:text-gray-100 font-medium">{value}</span>
                            </div>
                          ))}
                          {selectedEntry.nextVisit && (
                            <div className="flex gap-2 text-sm">
                              <span className="text-gray-400 dark:text-gray-500 w-24 flex-shrink-0 text-xs pt-0.5">Επόμενη</span>
                              <span className="text-gray-800 dark:text-gray-100 font-medium">{dayjs(selectedEntry.nextVisit).format("DD/MM/YYYY")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                ) : (
                  <>
                    {!fullPet && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                        Το ζώο δεν βρέθηκε στο μητρώο. Δεν είναι δυνατή η καταχώριση.
                      </div>
                    )}

                    {/* ── New entry form (step 1 only) ── */}
                    {fullPet && visitStep === 1 && (
                      <form onSubmit={handleSave} className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse flex-shrink-0" />
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Νέα Επίσκεψη</p>
                          {saved && <span className="ml-auto text-xs text-green-600 dark:text-green-400 font-medium">✓ Αποθηκεύτηκε</span>}
                        </div>

                        {/* Booking reason chips */}
                        {types.length > 0 && (
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Λόγος ραντεβού</p>
                            <div className="flex flex-wrap gap-1.5">
                              {types.map((t) => (
                                <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-100 dark:border-indigo-700/40">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quick templates */}
                        {availableTemplates.length > 0 && (
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-400" />
                              Γρήγορα templates
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {availableTemplates.map((t) => {
                                const tpl = TYPE_TEMPLATES[t];
                                const isSelected = consultForm.reason.includes(tpl.slice(0, 12));
                                return (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) return;
                                      setConsultForm((prev) => ({
                                        ...prev,
                                        reason: prev.reason.trim()
                                          ? prev.reason.trimEnd() + " " + tpl
                                          : tpl,
                                      }));
                                    }}
                                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                                      isSelected
                                        ? "border-indigo-400 bg-indigo-100 dark:bg-indigo-800/40 text-indigo-700 dark:text-indigo-200 font-semibold"
                                        : "border-dashed border-indigo-200 dark:border-indigo-700/50 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                    }`}
                                  >
                                    {isSelected ? "✓" : "+"} {t}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Behavioral state */}
                        <div>
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

                        {/* Weight today — prominent */}
                        <div className="flex items-center gap-3">
                          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-28 flex-shrink-0">
                            Βάρος σήμερα
                          </label>
                          <div className="relative flex-1">
                            <input
                              name="weight"
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder={latestVitals?.weight ? `τελ. ${latestVitals.weight} kg` : "kg"}
                              value={consultForm.weight}
                              onChange={handleConsultChange}
                              className="border border-blue-200 dark:border-blue-700/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-300 dark:placeholder-gray-600 bg-blue-50/50 dark:bg-blue-900/10 text-gray-900 dark:text-gray-100 w-full"
                            />
                          </div>
                          <span className="text-xs text-gray-400">kg</span>
                        </div>

                        <input name="reason" type="text" placeholder="Λόγος επίσκεψης (κλινικό) *" value={consultForm.reason} onChange={handleConsultChange} required className={inputClass} />
                        {/* CTA */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleStartExam}
                            disabled={saving}
                            className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm"
                          >
                            Έναρξη εξέτασης
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    )}

                    {/* ── Step 2: Εξέταση ── */}
                    {fullPet && visitStep === 2 && (
                      <div className="flex gap-3 items-start">
                      {/* Main exam content */}
                      <div className="flex-1 min-w-0 space-y-3">
                        {saved && <p className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Αποθηκεύτηκε</p>}

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
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { label: "Βάρος", name: "weight",      val: consultForm.weight,      unit: "kg",  handler: handleConsultChange },
                                { label: "Θερμοκρασία", name: "temperature", val: consultForm.temperature, unit: "°C",  handler: handleConsultChange },
                                { label: "Καρδ. ρυθμός", name: "heartRate",  val: consultForm.heartRate,  unit: "bpm", handler: handleConsultChange },
                                { label: "Αναπνοές",    name: "respRate",   val: examForm.respRate,      unit: "rpm", handler: (e) => setExamForm((p) => ({ ...p, respRate: e.target.value })) },
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
                            </div>
                            {/* Row 2 */}
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { label: "Ελέγχονται", name: "gumsColor", val: examForm.gumsColor, opts: ["Ρόζ", "Λευκά", "Κίτρινα", "Μπλε", "Κόκκινα"] },
                                { label: "Ενυδάτωση",  name: "hydration", val: examForm.hydration, opts: ["Φυσιολογική", "Ήπια αφυδ.", "Μέτρια", "Σοβαρή"] },
                              ].map(({ label, name, val, opts }) => (
                                <div key={name} className="col-span-2">
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                                  <select value={val} onChange={(e) => setExamForm((p) => ({ ...p, [name]: e.target.value }))}
                                    className="border border-gray-200 dark:border-win-border-light rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 w-full">
                                    {opts.map((o) => <option key={o}>{o}</option>)}
                                  </select>
                                </div>
                              ))}
                              <div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">CRT</p>
                                <input name="crt" type="text" placeholder="<2 sec" value={examForm.crt}
                                  onChange={(e) => setExamForm((p) => ({ ...p, crt: e.target.value }))}
                                  className="border border-gray-200 dark:border-win-border-light rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 w-full" />
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">O₂</p>
                                <div className="flex items-center gap-1">
                                  <input name="o2sat" type="number" min="0" max="100" value={examForm.o2sat}
                                    onChange={(e) => setExamForm((p) => ({ ...p, o2sat: e.target.value }))}
                                    className="border border-gray-200 dark:border-win-border-light rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 w-full" />
                                  <span className="text-[10px] text-gray-400 flex-shrink-0">%</span>
                                </div>
                              </div>
                            </div>
                            {/* Row 3 */}
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
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                              {BODY_SYSTEMS.map((sys) => {
                                const val = examForm.bodySystemStatus[sys] ?? "Φυσιολογικό";
                                const color = val === "Φυσιολογικό" ? "text-green-600 dark:text-green-400" : val === "Παθολογικό" ? "text-red-600 dark:text-red-400" : "text-gray-400";
                                return (
                                  <div key={sys} className="flex items-center justify-between gap-2">
                                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{sys}</span>
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

                        {/* 4. Findings */}
                        <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light overflow-hidden">
                          <div className="bg-gray-50 dark:bg-win-elevated/60 border-b border-gray-100 dark:border-win-border-light px-4 py-2.5 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0">4</span>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">Ευρήματα / Σχόλια Εξέτασης</p>
                          </div>
                          <div className="p-4">
                            <textarea rows={4} placeholder="Εισάγετε τα ευρήματα της εξέτασης..."
                              value={examForm.findings}
                              onChange={(e) => setExamForm((p) => ({ ...p, findings: e.target.value }))}
                              className={inputClass + " resize-none"} />
                          </div>
                        </div>

                        {/* Step 2 CTA */}
                        <div className="flex items-center gap-2 pb-2">
                          <button type="button" onClick={doSaveExam} disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-win-border-light text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-win-elevated/50 disabled:opacity-40 text-sm font-medium transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                            {saving ? "Αποθήκευση..." : "Αποθήκευση"}
                          </button>
                          <button type="button" onClick={handleContinueToTherapy} disabled={saving}
                            className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm">
                            Συνέχεια στη θεραπεία
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* ── Right sidebar (step 2) ── */}
                      <div className="w-48 flex-shrink-0 space-y-3 sticky top-0">

                        {/* Εκκρεμότητες */}
                        <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light overflow-hidden">
                          <div className="bg-gray-50 dark:bg-win-elevated/60 border-b border-gray-100 dark:border-win-border-light px-3 py-2">
                            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Εκκρεμότητες</p>
                          </div>
                          <div className="p-3 space-y-2">
                            {pendingTasks.length === 0 && (
                              <p className="text-[10px] text-gray-300 dark:text-gray-600 italic">Χωρίς εκκρεμότητες</p>
                            )}
                            {pendingTasks.map((task) => (
                              <label key={task.id} className="flex items-start gap-2 cursor-pointer group">
                                <input type="checkbox" checked={task.done}
                                  onChange={() => setPendingTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, done: !t.done } : t))}
                                  className="mt-0.5 accent-indigo-500 flex-shrink-0" />
                                <span className={`text-xs leading-snug ${task.done ? "line-through text-gray-300 dark:text-gray-600" : "text-gray-600 dark:text-gray-300"}`}>
                                  {task.text}
                                </span>
                              </label>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const text = window.prompt("Νέα εκκρεμότητα:");
                                if (text?.trim()) setPendingTasks((p) => [...p, { id: Date.now(), text: text.trim(), done: false }]);
                              }}
                              className="w-full mt-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border border-dashed border-indigo-200 dark:border-indigo-700/50 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-xs font-medium transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Νέα εκκρεμότητα
                            </button>
                          </div>
                        </div>

                        {/* Γρήγορες ενέργειες */}
                        <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light overflow-hidden">
                          <div className="bg-gray-50 dark:bg-win-elevated/60 border-b border-gray-100 dark:border-win-border-light px-3 py-2">
                            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Γρήγορες Ενέργειες</p>
                          </div>
                          <div className="p-3 space-y-1">
                            {[
                              { icon: Dna,       label: "Σάρωση chip" },
                              { icon: Plus,      label: "Προσθήκη φωτογραφίας" },
                              { icon: StickyNote,label: "Προσθήκη αρχείου" },
                              { icon: AlertCircle, label: "Προσθήκη alert" },
                            ].map(({ icon: Icon, label }) => (
                              <button key={label} type="button"
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-win-elevated/50 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-xs text-left">
                                <Icon className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>
                      </div>
                    )}

                    {/* ── Step 3: Θεραπεία ── */}
                    {fullPet && visitStep === 3 && (() => {
                      const charges = types.flatMap((t) => {
                        const c = SUGGESTED_CHARGES[t];
                        return c ? [c] : [];
                      });
                      if (types.includes("Chip")) charges.push({ label: "Microchip", price: 15 });
                      const subtotal = charges.reduce((s, c) => s + c.price, 0);
                      const vat = +(subtotal * 0.24).toFixed(2);
                      const total = +(subtotal + vat).toFixed(2);
                      return (
                        <div className="flex gap-3 items-start">
                        {/* Main */}
                        <div className="flex-1 min-w-0 space-y-3">

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
                              {treatmentForm.noPharma && treatmentForm.medications.length === 0 && (
                                <div className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 rounded-xl px-3 py-2.5">
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-xs font-semibold text-green-700 dark:text-green-300">Δεν απαιτήθηκε φαρμακευτική αγωγή</p>
                                    <p className="text-[10px] text-green-600/70 dark:text-green-400/70">Εάν χρειάζεται, προσθέστε φάρμακο παρακάτω.</p>
                                  </div>
                                </div>
                              )}
                              {treatmentForm.medications.length > 0 && (
                                <ul className="space-y-1.5">
                                  {treatmentForm.medications.map((m) => (
                                    <li key={m.id} className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-win-elevated/40 rounded-lg px-3 py-1.5">
                                      <Pill className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                      <span className="font-semibold text-gray-800 dark:text-gray-100">{m.drug}</span>
                                      {m.dose && <span className="text-gray-400">{m.dose}</span>}
                                      {m.frequency && <span className="text-gray-400">· {m.frequency}</span>}
                                      {m.duration && <span className="text-gray-400">· {m.duration}</span>}
                                      <button type="button" onClick={() => setTreatmentForm((p) => ({ ...p, medications: p.medications.filter((x) => x.id !== m.id), noPharma: p.medications.length <= 1 }))}
                                        className="ml-auto text-red-400 hover:text-red-600 transition-colors">✕</button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <div className="grid grid-cols-4 gap-2">
                                <input placeholder="Αναζήτηση φαρμάκου..." value={medicationInput.drug}
                                  onChange={(e) => setMedicationInput((p) => ({ ...p, drug: e.target.value }))}
                                  className={inputClass + " col-span-2"} />
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
                                    setTreatmentForm((p) => ({ ...p, medications: [...p.medications, { ...medicationInput, id: Date.now() }], noPharma: false }));
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
                            <button type="button" onClick={() => setSaved(true)} disabled={saving}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-win-border-light text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-win-elevated/50 disabled:opacity-40 text-sm font-medium transition-colors">
                              <Plus className="w-3.5 h-3.5" />
                              Αποθήκευση
                            </button>
                            <button type="button" onClick={handleGoToCompletion} disabled={saving}
                              className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm">
                              Συνέχεια στην ολοκλήρωση
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Right sidebar */}
                        <div className="w-48 flex-shrink-0 space-y-3 sticky top-0">
                          {/* Ολοκληρώθηκαν */}
                          <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light overflow-hidden">
                            <div className="bg-gray-50 dark:bg-win-elevated/60 border-b border-gray-100 dark:border-win-border-light px-3 py-2">
                              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Ολοκληρώθηκαν</p>
                            </div>
                            <div className="p-3 space-y-1.5">
                              {treatmentForm.procedures.map((proc) => (
                                <div key={proc.id} className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${proc.done ? "bg-emerald-500" : "border-2 border-gray-200 dark:border-gray-600"}`}>
                                    {proc.done && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  <span className={`text-[10px] leading-snug ${proc.done ? "text-gray-500 dark:text-gray-400 line-through" : "text-gray-600 dark:text-gray-300"}`}>{proc.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Εκκρεμότητες */}
                          <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light overflow-hidden">
                            <div className="bg-gray-50 dark:bg-win-elevated/60 border-b border-gray-100 dark:border-win-border-light px-3 py-2">
                              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Εκκρεμότητες</p>
                            </div>
                            <div className="p-3 space-y-1.5">
                              {[
                                { field: "followUpReminder", label: "Reminder επόμενου εμβολίου" },
                                { field: "sendEmailSms",     label: "Αποστολή οδηγιών με Email/SMS" },
                                { field: "scheduleFollowUp", label: "Προγραμματισμός επανελέγχου" },
                              ].map(({ field, label }) => (
                                <div key={field} className="flex items-start gap-2">
                                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${treatmentForm[field] ? "bg-indigo-500" : "border-2 border-gray-200 dark:border-gray-600"}`}>
                                    {treatmentForm[field] && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  <span className="text-[10px] text-gray-600 dark:text-gray-300 leading-snug">{label}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Γρήγορες ενέργειες */}
                          <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light overflow-hidden">
                            <div className="bg-gray-50 dark:bg-win-elevated/60 border-b border-gray-100 dark:border-win-border-light px-3 py-2">
                              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Γρήγορες Ενέργειες</p>
                            </div>
                            <div className="p-3 space-y-1">
                              {[
                                { icon: StickyNote,   label: "Εκτύπωση οδηγιών" },
                                { icon: Stethoscope,  label: "Αποστολή Email/SMS" },
                                { icon: Pill,         label: "Νέα συνταγή" },
                                { icon: Plus,         label: "Προσθήκη φωτογραφίας" },
                              ].map(({ icon: Icon, label }) => (
                                <button key={label} type="button"
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-win-elevated/50 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-xs text-left">
                                  <Icon className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        </div>
                      );
                    })()}

                    {/* ── Step 4: Ολοκλήρωση ── */}
                    {fullPet && visitStep === 4 && (
                      <div className="space-y-4">

                        {/* Περίληψη Επίσκεψης */}
                        <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <StickyNote className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Περίληψη Επίσκεψης</h3>
                          </div>
                          <textarea
                            value={completionForm.summary}
                            onChange={(e) => setCompletionForm((p) => ({ ...p, summary: e.target.value }))}
                            rows={5}
                            placeholder="Αυτόματα συμπληρωμένη περίληψη επίσκεψης..."
                            className={inputClass + " resize-none"}
                          />
                        </div>

                        {/* Χρεώσεις + Έγγραφα */}
                        <div className="grid grid-cols-2 gap-4">

                          {/* Χρεώσεις */}
                          <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-emerald-500" />
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Χρεώσεις</h3>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                                Οριστικοποιήσεις
                              </span>
                            </div>
                            {appointmentCharges.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">Δεν υπάρχουν χρεώσεις</p>
                            ) : (
                              <div className="space-y-1.5">
                                {appointmentCharges.map((c, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-200">{c.label}</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{c.price}€</span>
                                  </div>
                                ))}
                                <div className="border-t border-gray-100 dark:border-win-border-light mt-2 pt-2 space-y-1">
                                  <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>Υποσύνολο</span>
                                    <span>{chargesSubtotal}€</span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>ΦΠΑ 24%</span>
                                    <span>{chargesVat}€</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm font-bold text-gray-900 dark:text-gray-100">
                                    <span>Σύνολο</span>
                                    <span>{chargesTotal}€</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Έγγραφα / Επικοινωνία */}
                          <div className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-200 dark:border-win-border-light p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle className="w-4 h-4 text-sky-500" />
                              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Έγγραφα / Επικοινωνία</h3>
                            </div>
                            <div className="space-y-2.5">
                              {[
                                { key: "printedInstructions", label: "Εκτυπώθηκαν οδηγίες φροντίδας" },
                                { key: "sentEmailSms",        label: "Εστάλη email/SMS στον ιδιοκτήτη" },
                                { key: "registeredChip",      label: "Εγγραφή microchip στο μητρώο" },
                              ].map(({ key, label }) => (
                                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={!!completionForm[key]}
                                    onChange={(e) => setCompletionForm((p) => ({ ...p, [key]: e.target.checked }))}
                                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                                  />
                                  <span className="text-sm text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                                    {label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* CTA Bar */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-win-border-light gap-3">
                          <button
                            type="button"
                            onClick={() => setVisitStep(3)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-win-elevated/50 transition-colors"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Πίσω στη θεραπεία
                          </button>
                          <button
                            type="button"
                            onClick={handleFinalComplete}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Ολοκλήρωση επίσκεψης
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── History (visible only step 1) ── */}
                    {fullPet && visitStep === 1 && (
                      <div>
                        <SectionLabel>Ιστορικό Επισκέψεων</SectionLabel>
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
                                <li key={entry._id} className="bg-white dark:bg-win-elevated/40 rounded-xl border border-gray-100 dark:border-win-border-light overflow-hidden">
                                  <div className="p-3">
                                    {/* Top row */}
                                    <div className="flex items-start gap-3">
                                      {/* Date + dot */}
                                      <div className="flex items-start gap-2 flex-shrink-0 w-12">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />
                                        <div className="text-center">
                                          <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">{dayjs(entry.date).format("DD")}</p>
                                          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase leading-tight">{dayjs(entry.date).locale("el").format("MMM")}</p>
                                          <p className="text-[10px] text-gray-300 dark:text-gray-600 leading-tight">{dayjs(entry.date).format("YYYY")}</p>
                                        </div>
                                      </div>

                                      {/* Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-1">
                                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug">{entry.reason}</p>
                                          <button
                                            type="button"
                                            onClick={() => setSelectedEntry(entry)}
                                            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-win-border/40 text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                                          >
                                            <MoreVertical className="w-3.5 h-3.5" />
                                          </button>
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

                                    {/* Bottom: diagnosis / treatment / next visit */}
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
                  </>
                )}
              </div>
            )}

            {activeView === "purchases" && (
              <div className="p-4">
                {ownerId ? <InlinePurchases customerId={ownerId} /> : <p className="text-sm text-gray-400 text-center py-8">Δεν υπάρχει πελάτης.</p>}
              </div>
            )}

            {activeView === "prescriptions" && (
              <div className="p-4">
                <InlinePrescriptions
                  petId={matchedPet?._id}
                  pet={matchedPet}
                  customer={ownerId ? { _id: ownerId, name: appointment.clientName, phone: appointment.phone } : null}
                />
              </div>
            )}

            {activeView === "pet" && (
              matchedPet ? <PetProfile petId={matchedPet._id} /> : <p className="text-sm text-gray-400 text-center py-8 p-4">Δεν βρέθηκε κατοικίδιο.</p>
            )}
          </div>
        </div>

        {/* ── Bottom action bar ── */}
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-win-border bg-white dark:bg-win-surface px-4 py-2 flex items-center gap-1">
          {BOTTOM_ACTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveView(activeView === key ? null : key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeView === key
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-win-elevated/50 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppointmentPreviewModal;
