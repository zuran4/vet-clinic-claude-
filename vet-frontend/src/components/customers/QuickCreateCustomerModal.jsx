import React, { useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { User, Phone, Mail, MapPin, StickyNote, Bell, X, Save, UserPlus, ChevronDown, ChevronUp, PawPrint } from "lucide-react";
import request from "@/api/apiClient.js";
import { useModalScrollLock } from "../../hooks/useModalScrollLock.js";
import reportClientEvent from "../../utils/reportClientEvent.js";

const INPUT = "w-full border border-gray-200 dark:border-win-border-light rounded-2xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 dark:placeholder-gray-500 dark:bg-win-elevated dark:text-gray-100";
const LABEL = "block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1";

const NOTIF_OPTIONS = [
  { key: "email",      label: "Email" },
  { key: "sms",        label: "SMS" },
  { key: "reminders",  label: "Υπενθυμίσεις" },
  { key: "promotions", label: "Προσφορές" },
];

const QuickCreateCustomerModal = ({ initialName = "", onCreated, onCancel }) => {
  const [form, setForm] = useState({
    name: initialName,
    phone: "",
    email: "",
    address: "",
    notes: "",
    notifications: { email: false, sms: true, reminders: true, promotions: true },
  });
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("Σκύλος");
  const [petGender, setPetGender] = useState("Αρσενικό");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMore, setShowMore] = useState(false);
  const scrollRef = useModalScrollLock(true);

  const update = (field, value) =>
    setForm((p) => {
      const next = { ...p, [field]: value };
      // Η ειδοποίηση Email εξαρτάται από την ύπαρξη email: απενεργοποιείται
      // αυτόματα όταν αδειάζει το πεδίο, ενεργοποιείται αυτόματα τη στιγμή
      // που συμπληρώνεται (χωρίς να ξαναπειράζεται σε κάθε keystroke μετά).
      if (field === "email") {
        const hadEmail = p.email.trim().length > 0;
        const hasEmail = value.trim().length > 0;
        if (!hasEmail) {
          next.notifications = { ...p.notifications, email: false };
        } else if (!hadEmail) {
          next.notifications = { ...p.notifications, email: true };
        }
      }
      return next;
    });
  const updateNotif = (key, checked) =>
    setForm((p) => {
      if (key === "email" && !p.email.trim()) return p; // δεν ενεργοποιείται χωρίς email
      return { ...p, notifications: { ...p.notifications, [key]: checked } };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!form.name.trim() || !form.phone.trim() || !petName.trim()) return;
    try {
      setLoading(true);
      setError("");
      const data = await request("/customers", { method: "POST", body: form });
      const customer = data.customer || data;

      // Ο πελάτης έχει ήδη δημιουργηθεί σε αυτό το σημείο· αν αποτύχει μόνο
      // το κατοικίδιο (π.χ. δικτυακό σφάλμα), δεν τον ξαναχάνουμε — απλά
      // ειδοποιούμε να προστεθεί χειροκίνητα.
      try {
        await request("/pets", {
          method: "POST",
          body: { owner: customer._id, name: petName.trim(), species: petSpecies, gender: petGender },
        });
      } catch (err) {
        toast.error("Ο πελάτης δημιουργήθηκε, αλλά το κατοικίδιο απέτυχε. Πρόσθεσέ το χειροκίνητα.");
        reportClientEvent({ message: err?.message || "Αποτυχία δημιουργίας κατοικιδίου μετά από νέο πελάτη", type: "pet_create_failed", level: "warning" });
      }

      onCreated(customer);
    } catch (err) {
      setError(err?.message || "Αποτυχία δημιουργίας. Έλεγξε τα στοιχεία.");
      reportClientEvent({ message: err?.message || "Αποτυχία δημιουργίας πελάτη", type: "customer_create_failed", level: "warning" });
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" style={{ touchAction: "none" }}>
      <div className="absolute inset-0" onClick={onCancel} />

      <div className="relative w-full max-w-[560px] rounded-2xl overflow-hidden shadow-2xl z-10">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Νέος Πελάτης</p>
              <p className="text-white/70 text-xs mt-0.5">Συμπλήρωσε τα στοιχεία του πελάτη</p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form
          ref={scrollRef}
          onSubmit={handleSubmit}
          className="bg-gray-50 dark:bg-win-elevated/50 p-5 space-y-3 max-h-[80vh] overflow-y-auto"
          style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
        >

          {/* Στοιχεία Επικοινωνίας */}
          <div className="bg-white dark:bg-win-surface rounded-2xl border border-gray-200 dark:border-win-border-light px-4 py-3">
            <p className={LABEL + " mb-3"}>Στοιχεία Επικοινωνίας</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              <div>
                <label className={LABEL}>Ονοματεπώνυμο *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600" />
                  <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)}
                    required autoFocus placeholder="π.χ. Γιώργος Παπαδόπουλος" className={INPUT} />
                </div>
              </div>

              <div>
                <label className={LABEL}>Τηλέφωνο *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600" />
                  <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)}
                    required placeholder="π.χ. 6912345678" className={INPUT} />
                </div>
              </div>

              {showMore && (
                <>
                  <div>
                    <label className={LABEL}>Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600" />
                      <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
                        placeholder="π.χ. info@email.com" className={INPUT} />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Διεύθυνση</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600" />
                      <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)}
                        placeholder="π.χ. Εγνατία 10, Θεσσαλονίκη" className={INPUT} />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className={LABEL}>Σημειώσεις</label>
                    <div className="relative">
                      <StickyNote className="absolute left-3 top-3 w-4 h-4 text-gray-300 dark:text-gray-600" />
                      <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)}
                        rows={2} placeholder="Ιδιαιτερότητες, προτιμήσεις..."
                        className="w-full border border-gray-200 dark:border-win-border-light rounded-2xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 dark:placeholder-gray-500 dark:bg-win-elevated dark:text-gray-100 resize-none" />
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="flex items-center gap-1 text-xs text-indigo-500 dark:text-indigo-400 font-medium hover:underline mt-3"
            >
              {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showMore ? "Λιγότερα" : "Περισσότερα"}
            </button>
          </div>

          {/* Κατοικίδιο (προαιρετικό) */}
          <div className="bg-white dark:bg-win-surface rounded-2xl border border-gray-200 dark:border-win-border-light px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <PawPrint className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              <p className={LABEL + " mb-0"}>Κατοικίδιο</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <label className={LABEL}>Όνομα *</label>
                <div className="relative">
                  <PawPrint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600" />
                  <input type="text" value={petName} onChange={(e) => setPetName(e.target.value)}
                    required placeholder="π.χ. Πέρλα" className={INPUT} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Είδος</label>
                <select value={petSpecies} onChange={(e) => setPetSpecies(e.target.value)} className={INPUT.replace("pl-9", "pl-3")}>
                  <option value="Σκύλος">Σκύλος</option>
                  <option value="Γάτα">Γάτα</option>
                  <option value="Κουνέλι">Κουνέλι</option>
                  <option value="Πτηνό">Πτηνό</option>
                  <option value="Άλλο">Άλλο</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Φύλο</label>
                <select value={petGender} onChange={(e) => setPetGender(e.target.value)} className={INPUT.replace("pl-9", "pl-3")}>
                  <option value="Αρσενικό">Αρσενικό</option>
                  <option value="Θηλυκό">Θηλυκό</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ειδοποιήσεις */}
          {showMore && (
            <div className="bg-white dark:bg-win-surface rounded-2xl border border-gray-200 dark:border-win-border-light px-4 py-3">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                <p className={LABEL}>Ειδοποιήσεις</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {NOTIF_OPTIONS.map(({ key, label }) => {
                  const disabled = key === "email" && !form.email.trim();
                  return (
                    <label
                      key={key}
                      title={disabled ? "Συμπλήρωσε email για να ενεργοποιηθεί" : undefined}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                        disabled
                          ? "bg-gray-50 dark:bg-win-elevated/50 border-gray-100 dark:border-win-border-light/50 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                          : form.notifications[key]
                          ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-300 cursor-pointer"
                          : "bg-white dark:bg-win-surface border-gray-200 dark:border-win-border-light text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-win-elevated/50 cursor-pointer"
                      }`}
                    >
                      <input type="checkbox" checked={form.notifications[key]} disabled={disabled} onChange={(e) => updateNotif(key, e.target.checked)} className="hidden" />
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        disabled
                          ? "border-gray-200 dark:border-win-border-light/50"
                          : form.notifications[key] ? "bg-indigo-500 border-indigo-500" : "border-gray-300 dark:border-win-border-light"
                      }`}>
                        {form.notifications[key] && !disabled && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 12 12"><path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </span>
                      {label}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{error}</p>}

          {/* Κουμπιά */}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCancel}
              className="px-4 py-2 rounded-2xl border border-gray-200 dark:border-win-border-light text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-win-elevated transition-colors">
              <X className="w-4 h-4 inline mr-1" />Ακύρωση
            </button>
            <button type="submit" disabled={loading || !form.name.trim() || !form.phone.trim() || !petName.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60">
              {loading
                ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                : <Save className="w-4 h-4" />}
              Δημιουργία
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default QuickCreateCustomerModal;
