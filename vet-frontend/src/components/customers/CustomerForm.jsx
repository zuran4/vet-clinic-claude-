import React from "react";
import { User, Phone, Mail, MapPin, Home, FileText, StickyNote, Bell, Save, X } from "lucide-react";
import { useCustomerForm } from "./hooks/useCustomerForm.js";

const INPUT = "w-full border border-gray-200 dark:border-gray-600 rounded-2xl pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";
const LABEL = "block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1";

const NOTIF_OPTIONS = [
  { key: "email",     label: "Email" },
  { key: "sms",       label: "SMS" },
  { key: "reminders", label: "Υπενθυμίσεις" },
  { key: "promotions",label: "Προσφορές" },
];

const CustomerForm = ({ initialData, onSaved, onCancel, onDirty }) => {
  const { formData, loading, handleChange, handleNotificationChange, handleSubmit } =
    useCustomerForm(initialData, onSaved, onCancel);

  const wrapChange = (fn) => (e) => { onDirty?.(); fn(e); };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* Στοιχεία Επικοινωνίας */}
      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Στοιχεία Επικοινωνίας</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          <div>
            <label className={LABEL}>Ονοματεπώνυμο *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                name="name"
                placeholder="π.χ. Γιώργος Παπαδόπουλος"
                value={formData.name}
                onChange={wrapChange(handleChange)}
                required
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Τηλέφωνο *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="tel"
                name="phone"
                placeholder="π.χ. 6912345678"
                value={formData.phone}
                onChange={wrapChange(handleChange)}
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="email"
                name="email"
                placeholder="π.χ. info@email.com"
                value={formData.email}
                onChange={wrapChange(handleChange)}
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Διεύθυνση</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                name="address"
                placeholder="π.χ. Εγνατία 10, Θεσσαλονίκη"
                value={formData.address}
                onChange={wrapChange(handleChange)}
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Πόλη</label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                name="city"
                placeholder="π.χ. Θεσσαλονίκη"
                value={formData.city}
                onChange={wrapChange(handleChange)}
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>ΑΦΜ</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                name="afm"
                placeholder="π.χ. 123456789"
                value={formData.afm}
                onChange={wrapChange(handleChange)}
                className={INPUT}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={LABEL}>Σημειώσεις</label>
            <div className="relative">
              <StickyNote className="absolute left-3 top-3 w-4 h-4 text-gray-300" />
              <textarea
                name="notes"
                placeholder="Ιδιαιτερότητες, προτιμήσεις..."
                value={formData.notes}
                onChange={wrapChange(handleChange)}
                rows={2}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-2xl pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 dark:placeholder-gray-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ειδοποιήσεις */}
      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Ειδοποιήσεις</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {NOTIF_OPTIONS.map(({ key, label }) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                formData.notifications[key]
                  ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                  : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              <input
                type="checkbox"
                name={key}
                checked={formData.notifications[key]}
                onChange={wrapChange(handleNotificationChange)}
                className="hidden"
              />
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                formData.notifications[key] ? "bg-indigo-500 border-indigo-500" : "border-gray-300"
              }`}>
                {formData.notifications[key] && (
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                )}
              </span>
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Κουμπιά */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4" /> Ακύρωση
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {loading ? "Αποθήκευση..." : "Αποθήκευση"}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;
