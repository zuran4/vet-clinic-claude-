import React, { useState } from "react";
import { createPortal } from "react-dom";
import { User, Phone, Mail, MapPin, StickyNote, Bell, X, Save, UserPlus } from "lucide-react";
import request from "@/api/apiClient.js";

const INPUT = "w-full border border-gray-200 rounded-2xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400";
const LABEL = "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1";

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
    notifications: { email: true, sms: false, reminders: true, promotions: false },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const updateNotif = (key, checked) =>
    setForm((p) => ({ ...p, notifications: { ...p.notifications, [key]: checked } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!form.name.trim() || !form.phone.trim()) return;
    try {
      setLoading(true);
      setError("");
      const data = await request("/customers", { method: "POST", body: form });
      onCreated(data.customer || data);
    } catch {
      setError("Αποτυχία δημιουργίας. Έλεγξε τα στοιχεία.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
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
        <form onSubmit={handleSubmit} className="bg-gray-50 p-5 space-y-3 max-h-[80vh] overflow-y-auto">

          {/* Στοιχεία Επικοινωνίας */}
          <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3">
            <p className={LABEL + " mb-3"}>Στοιχεία Επικοινωνίας</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              <div>
                <label className={LABEL}>Ονοματεπώνυμο *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)}
                    required autoFocus placeholder="π.χ. Γιώργος Παπαδόπουλος" className={INPUT} />
                </div>
              </div>

              <div>
                <label className={LABEL}>Τηλέφωνο *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)}
                    required placeholder="π.χ. 6912345678" className={INPUT} />
                </div>
              </div>

              <div>
                <label className={LABEL}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
                    placeholder="π.χ. info@email.com" className={INPUT} />
                </div>
              </div>

              <div>
                <label className={LABEL}>Διεύθυνση</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)}
                    placeholder="π.χ. Εγνατία 10, Θεσσαλονίκη" className={INPUT} />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={LABEL}>Σημειώσεις</label>
                <div className="relative">
                  <StickyNote className="absolute left-3 top-3 w-4 h-4 text-gray-300" />
                  <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)}
                    rows={2} placeholder="Ιδιαιτερότητες, προτιμήσεις..."
                    className="w-full border border-gray-200 rounded-2xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 resize-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Ειδοποιήσεις */}
          <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-3.5 h-3.5 text-gray-400" />
              <p className={LABEL}>Ειδοποιήσεις</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {NOTIF_OPTIONS.map(({ key, label }) => (
                <label key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                  form.notifications[key] ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}>
                  <input type="checkbox" checked={form.notifications[key]} onChange={(e) => updateNotif(key, e.target.checked)} className="hidden" />
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${form.notifications[key] ? "bg-indigo-500 border-indigo-500" : "border-gray-300"}`}>
                    {form.notifications[key] && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 12 12"><path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                  {label}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

          {/* Κουμπιά */}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCancel}
              className="px-4 py-2 rounded-2xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 inline mr-1" />Ακύρωση
            </button>
            <button type="submit" disabled={loading || !form.name.trim() || !form.phone.trim()}
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
