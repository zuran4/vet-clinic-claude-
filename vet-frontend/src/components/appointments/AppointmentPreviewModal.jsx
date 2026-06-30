import React, { useState, useEffect } from "react";
import {
  User, Phone, Calendar, Clock, Stethoscope, Scissors,
  StickyNote, PawPrint, ShoppingBag, Pill, X,
  Plus, ChevronDown, ChevronUp, Activity, ChevronRight, ArrowLeft,
} from "lucide-react";
import dayjs from "dayjs";
import { useCustomerPets } from "../../hooks/useCustomerPets";
import PetProfile from "../pets/PetProfile";
import InlinePurchases from "./InlinePurchases.jsx";
import InlinePrescriptions from "./InlinePrescriptions.jsx";
import { addPetHistoryEntry, getPetsByOwner } from "../../api/petsApi.js";

const TYPE_COLORS = {
  "Εξέταση":            "bg-indigo-100 text-indigo-700",
  "Εμβόλιο":            "bg-green-100 text-green-700",
  "Αποπαρασίτωση":      "bg-amber-100 text-amber-700",
  "Χειρουργείο":        "bg-red-100 text-red-700",
  "Στείρωση":           "bg-purple-100 text-purple-700",
  "Μπάνιο":             "bg-sky-100 text-sky-700",
  "Κούρεμα":            "bg-cyan-100 text-cyan-700",
  "Καλλωπισμός":        "bg-teal-100 text-teal-700",
  "Περιποίηση νυχιών":  "bg-pink-100 text-pink-700",
};

const InfoRow = ({ icon: Icon, label, value, iconColor = "text-gray-400" }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-win-border/50 last:border-0">
    <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
    <span className="text-xs text-gray-400 dark:text-gray-500 w-20 flex-shrink-0">{label}</span>
    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{value || "—"}</span>
  </div>
);

const Empty = ({ text }) => (
  <div className="py-10 text-center">
    <p className="text-sm text-gray-400">{text}</p>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex gap-2 text-sm">
    <span className="text-gray-400 dark:text-gray-500 w-24 flex-shrink-0">{label}</span>
    <span className="text-gray-800 dark:text-gray-100 font-medium">{value}</span>
  </div>
);

const emptyConsultForm = {
  reason: "", result: "", weight: "", temperature: "", heartRate: "", diagnosis: "", treatment: "",
};

const inputClass =
  "border border-gray-200 dark:border-win-border-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 w-full";

const TABS = [
  { key: "consult",       label: "Εξέταση",     icon: Stethoscope },
  { key: "overview",      label: "Επισκόπηση",  icon: Calendar },
  { key: "purchases",     label: "Αγορές",      icon: ShoppingBag },
  { key: "prescriptions", label: "Συνταγές",    icon: Pill },
  { key: "pet",           label: "Κατοικίδιο",  icon: PawPrint },
];

const AppointmentPreviewModal = ({ isOpen, onClose, appointment, initialTab = "overview" }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Consult tab state
  const [consultForm, setConsultForm] = useState(emptyConsultForm);
  const [showClinical, setShowClinical] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recentHistory, setRecentHistory] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const ownerId = typeof appointment?.owner === "object"
    ? appointment?.owner._id
    : appointment?.owner || null;

  const { pets } = useCustomerPets(ownerId);
  const matchedPet = pets.find(
    (p) => p.name?.toLowerCase() === appointment?.animalName?.toLowerCase()
  ) || pets[0] || null;

  // Sync initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setConsultForm(emptyConsultForm);
      setSaved(false);
      setShowClinical(false);
      setFullPet(null);
      setRecentHistory([]);
      setSelectedEntry(null);
    }
  }, [isOpen, initialTab]);

  // Fetch full pet (with history) separately — useCustomerPets omits history in select
  const [fullPet, setFullPet] = useState(null);

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
        setRecentHistory(sorted.slice(0, 3));
      } else {
        setRecentHistory([]);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isOpen, ownerId, appointment?.animalName]);

  if (!isOpen || !appointment) return null;

  const isGrooming = appointment.doctor === "Grooming";
  const headerBg = isGrooming
    ? "bg-gradient-to-r from-blue-500 to-cyan-400"
    : "bg-gradient-to-r from-green-500 to-emerald-400";

  const handleConsultChange = (e) => {
    const { name, value } = e.target;
    setConsultForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleConsultSave = async (e) => {
    e.preventDefault();
    if (!consultForm.reason.trim() || !fullPet) return;
    try {
      setSaving(true);
      const payload = {
        reason: consultForm.reason,
        result: consultForm.result || undefined,
        weight: consultForm.weight ? parseFloat(consultForm.weight) : undefined,
        temperature: consultForm.temperature ? parseFloat(consultForm.temperature) : undefined,
        heartRate: consultForm.heartRate ? parseInt(consultForm.heartRate) : undefined,
        diagnosis: consultForm.diagnosis || undefined,
        treatment: consultForm.treatment || undefined,
      };
      await addPetHistoryEntry(fullPet._id, payload);
      setConsultForm(emptyConsultForm);
      setShowClinical(false);
      setSaved(true);
      // Refresh history display
      if (ownerId) {
        const freshPets = await getPetsByOwner(ownerId);
        const fresh = freshPets.find((p) => p._id === fullPet._id);
        if (fresh?.history) {
          const sorted = [...fresh.history].sort((a, b) => new Date(b.date) - new Date(a.date));
          setRecentHistory(sorted.slice(0, 3));
          setFullPet(fresh);
        }
      }
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full min-w-0 max-w-2xl rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]">

        {/* Gradient Header */}
        <div className={`${headerBg} px-5 pt-5 pb-0 flex-shrink-0`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white">
              {isGrooming ? <Scissors className="w-5 h-5" /> : <Stethoscope className="w-5 h-5" />}
              <span className="font-semibold text-sm">{appointment.doctor}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white ml-1">
                {Array.isArray(appointment.type) ? appointment.type.join(", ") : appointment.type}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-white mb-4">
            <div className="text-2xl font-bold">{appointment.time}</div>
            <div className="text-sm text-white/80 mt-0.5">
              {appointment.date} &middot; {appointment.duration} λεπτά
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-xl transition-all flex-shrink-0 whitespace-nowrap ${
                  activeTab === key
                    ? "bg-white dark:bg-win-surface text-gray-700 dark:text-gray-100 shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-50 dark:bg-win-surface/50 overflow-y-auto flex-1">

          {/* ΕΞΕΤΑΣΗ */}
          {activeTab === "consult" && (
            <div className="p-4 space-y-4">

              {/* ── Detail view επίσκεψης ── */}
              {selectedEntry ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="flex items-center gap-1.5 text-sm font-medium text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Επιστροφή
                  </button>

                  <div className="bg-white dark:bg-win-elevated/50 rounded-2xl border border-gray-100 dark:border-win-border-light overflow-hidden">
                    {/* Date header */}
                    <div className="bg-gray-50 dark:bg-win-elevated/80 px-4 py-3 border-b border-gray-100 dark:border-win-border-light flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {dayjs(selectedEntry.date).format("dddd, DD MMMM YYYY")}
                      </span>
                    </div>

                    <div className="px-4 py-3 space-y-3">
                      {/* Κλινικά badges */}
                      {(selectedEntry.weight || selectedEntry.temperature || selectedEntry.heartRate) && (
                        <div className="flex flex-wrap gap-2">
                          {selectedEntry.weight && (
                            <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2.5 py-1 rounded-lg font-medium">
                              ⚖ {selectedEntry.weight} kg
                            </span>
                          )}
                          {selectedEntry.temperature && (
                            <span className="text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-2.5 py-1 rounded-lg font-medium">
                              🌡 {selectedEntry.temperature}°C
                            </span>
                          )}
                          {selectedEntry.heartRate && (
                            <span className="text-xs bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-300 px-2.5 py-1 rounded-lg font-medium">
                              ♥ {selectedEntry.heartRate} bpm
                            </span>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Row label="Λόγος" value={selectedEntry.reason} />
                        {selectedEntry.result    && <Row label="Αποτέλεσμα" value={selectedEntry.result} />}
                        {selectedEntry.diagnosis && <Row label="Διάγνωση"   value={selectedEntry.diagnosis} />}
                        {selectedEntry.treatment && <Row label="Αγωγή"      value={selectedEntry.treatment} />}
                        {selectedEntry.vet       && <Row label="Κτηνίατρος" value={selectedEntry.vet} />}
                        {selectedEntry.nextVisit && (
                          <Row label="Επόμενη" value={dayjs(selectedEntry.nextVisit).format("DD/MM/YYYY")} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              ) : (
                /* ── Κανονική λίστα ── */
                <>
                  {!fullPet && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                      Το ζώο δεν βρέθηκε στο μητρώο. Δεν είναι δυνατή η καταχώριση.
                    </div>
                  )}

                  {/* Τελευταίες επισκέψεις */}
                  {fullPet && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                        Τελευταίες Επισκέψεις
                      </p>
                      {recentHistory.length === 0 ? (
                        <div className="bg-white dark:bg-win-elevated/30 rounded-xl px-4 py-5 text-center border border-gray-100 dark:border-win-border-light">
                          <Clock className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto mb-1" />
                          <p className="text-xs text-gray-400">Δεν υπάρχουν προηγούμενες επισκέψεις</p>
                        </div>
                      ) : (
                        <ul className="space-y-1.5">
                          {recentHistory.map((entry) => (
                            <li key={entry._id}>
                              <button
                                type="button"
                                onClick={() => setSelectedEntry(entry)}
                                className="w-full text-left bg-white dark:bg-win-elevated/40 rounded-xl px-3 py-2.5 border border-gray-100 dark:border-win-border-light hover:border-indigo-200 dark:hover:border-indigo-700/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group"
                              >
                                <div className="flex items-center gap-2 mb-0.5">
                                  <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  <span className="text-xs text-gray-400 flex-1">
                                    {dayjs(entry.date).format("DD/MM/YYYY")}
                                  </span>
                                  {entry.weight && (
                                    <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded-md">
                                      {entry.weight} kg
                                    </span>
                                  )}
                                  {entry.temperature && (
                                    <span className="text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-1.5 py-0.5 rounded-md">
                                      {entry.temperature}°C
                                    </span>
                                  )}
                                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                                </div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{entry.reason}</p>
                                {entry.diagnosis && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                    {entry.diagnosis}
                                  </p>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Φόρμα καταχώρισης */}
                  {fullPet && (
                    <form
                      onSubmit={handleConsultSave}
                      className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-700/40 p-4 space-y-3"
                    >
                      <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">
                        Καταχώριση Σημερινής Επίσκεψης
                      </p>

                      <input name="reason" type="text" placeholder="Λόγος επίσκεψης *" value={consultForm.reason} onChange={handleConsultChange} required className={inputClass} />
                      <input name="result" type="text" placeholder="Αποτέλεσμα / Σχόλια" value={consultForm.result} onChange={handleConsultChange} className={inputClass} />

                      <button type="button" onClick={() => setShowClinical((v) => !v)} className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                        <Activity className="w-3.5 h-3.5" />
                        Κλινικά Στοιχεία
                        {showClinical ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {showClinical && (
                        <div className="grid grid-cols-3 gap-2">
                          <input name="weight"      type="number" step="0.1" min="0" placeholder="Βάρος kg"       value={consultForm.weight}      onChange={handleConsultChange} className={inputClass} />
                          <input name="temperature" type="number" step="0.1" min="0" placeholder="Θερμ. °C"       value={consultForm.temperature} onChange={handleConsultChange} className={inputClass} />
                          <input name="heartRate"   type="number"             min="0" placeholder="bpm"            value={consultForm.heartRate}   onChange={handleConsultChange} className={inputClass} />
                          <input name="diagnosis"   type="text"                       placeholder="Διάγνωση"       value={consultForm.diagnosis}   onChange={handleConsultChange} className={`col-span-3 ${inputClass}`} />
                          <input name="treatment"   type="text"                       placeholder="Αγωγή / Φάρμακα" value={consultForm.treatment}  onChange={handleConsultChange} className={`col-span-3 ${inputClass}`} />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        {saved && <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Αποθηκεύτηκε</span>}
                        <button type="submit" disabled={saving || !consultForm.reason.trim()} className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                          <Plus className="w-4 h-4" />
                          {saving ? "Αποθήκευση..." : "Αποθήκευση"}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          )}

          {/* ΕΠΙΣΚΟΠΗΣΗ */}
          {activeTab === "overview" && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white dark:bg-win-elevated/50 rounded-2xl border border-gray-100 dark:border-win-border-light px-4 py-2">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide pt-2 pb-1">Πελάτης</p>
                  <InfoRow icon={User}  label="Όνομα"    value={appointment.clientName} iconColor="text-indigo-400" />
                  <InfoRow icon={Phone} label="Τηλέφωνο" value={appointment.phone}      iconColor="text-indigo-400" />
                </div>
                <div className="bg-white dark:bg-win-elevated/50 rounded-2xl border border-gray-100 dark:border-win-border-light px-4 py-2">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide pt-2 pb-1">Ραντεβού</p>
                  <InfoRow icon={Calendar} label="Ημερομηνία" value={appointment.date}                 iconColor="text-emerald-400" />
                  <InfoRow icon={Clock}    label="Ώρα"         value={appointment.time}                 iconColor="text-emerald-400" />
                  <InfoRow icon={Clock}    label="Διάρκεια"    value={`${appointment.duration} λεπτά`} iconColor="text-emerald-400" />
                </div>
              </div>

              {appointment.notes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700/50 rounded-2xl px-4 py-3 flex gap-3">
                  <StickyNote className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-300">{appointment.notes}</p>
                </div>
              )}

              {pets.length > 0 && (
                <div className="bg-white dark:bg-win-elevated/50 rounded-2xl border border-gray-100 dark:border-win-border-light px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <PawPrint className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Κατοικίδια πελάτη</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pets.map((pet) => (
                      <span key={pet._id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 dark:bg-win-elevated2 border border-gray-200 dark:border-win-border-light text-sm text-gray-700 dark:text-gray-200"
                      >
                        <span className="font-medium">{pet.name}</span>
                        <span className="text-gray-400 dark:text-gray-400 text-xs">{pet.species}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ΑΓΟΡΕΣ */}
          {activeTab === "purchases" && (
            <div className="p-4">
              {ownerId ? (
                <InlinePurchases customerId={ownerId} />
              ) : (
                <Empty text="Δεν υπάρχει πελάτης για εμφάνιση αγορών." />
              )}
            </div>
          )}

          {/* ΣΥΝΤΑΓΕΣ */}
          {activeTab === "prescriptions" && (
            <div className="p-4">
              <InlinePrescriptions
                petId={matchedPet?._id}
                pet={matchedPet}
                customer={ownerId ? { _id: ownerId, name: appointment.clientName, phone: appointment.phone } : null}
              />
            </div>
          )}

          {/* ΚΑΤΟΙΚΙΔΙΟ */}
          {activeTab === "pet" && (
            <div>
              {matchedPet ? (
                <PetProfile petId={matchedPet._id} />
              ) : (
                <div className="p-4">
                  <Empty text="Δεν βρέθηκε κατοικίδιο." />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentPreviewModal;
