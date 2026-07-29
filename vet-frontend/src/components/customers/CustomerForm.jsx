import React, { useState } from "react";
import { User, Phone, Mail, MapPin, Home, FileText, StickyNote, Bell, Save, X, ChevronDown, ChevronUp, PawPrint } from "lucide-react";
import { useCustomerForm } from "./hooks/useCustomerForm.js";

const INPUT = "w-full border border-gray-200 dark:border-win-border-light rounded-2xl pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100";
const LABEL = "block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1";

const NOTIF_OPTIONS = [
  { key: "email",     label: "Email" },
  { key: "sms",       label: "SMS" },
  { key: "reminders", label: "Υπενθυμίσεις" },
  { key: "promotions",label: "Προσφορές" },
];

const CustomerForm = ({ initialData, onSaved, onCancel, onDirty }) => {
  const {
    formData, loading, handleChange, handleNotificationChange, handleSubmit,
    petName, setPetName, petSpecies, setPetSpecies, petGender, setPetGender,
  } = useCustomerForm(initialData, onSaved, onCancel);

  const isEdit = !!(initialData?._id);

  // Ξεκινάει ήδη ανοιχτό στην επεξεργασία αν ο πελάτης έχει ήδη στοιχεία εκεί μέσα.
  const [showMore, setShowMore] = useState(() =>
    !!(initialData && (initialData.email || initialData.address || initialData.city || initialData.afm || initialData.notes))
  );

  const wrapChange = (fn) => (e) => { onDirty?.(); fn(e); };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* Στοιχεία Επικοινωνίας */}
      <div className="bg-gray-50 dark:bg-win-elevated/30 rounded-2xl px-4 py-3">
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
                required
                className={INPUT}
              />
            </div>
          </div>

          {showMore && (
            <>
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
                    className="w-full border border-gray-200 dark:border-win-border-light rounded-2xl pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 dark:placeholder-gray-500 resize-none bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100"
                  />
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

      {/* Κατοικίδιο (μόνο σε δημιουργία) */}
      {!isEdit && (
        <div className="bg-gray-50 dark:bg-win-elevated/30 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <PawPrint className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Κατοικίδιο</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Όνομα *</label>
              <div className="relative">
                <PawPrint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => { onDirty?.(); setPetName(e.target.value); }}
                  required
                  placeholder="π.χ. Πέρλα"
                  className={INPUT}
                />
              </div>
            </div>
            <div>
              <label className={LABEL}>Είδος</label>
              <select
                value={petSpecies}
                onChange={(e) => { onDirty?.(); setPetSpecies(e.target.value); }}
                className={INPUT.replace("pl-9", "pl-3")}
              >
                <option value="Σκύλος">Σκύλος</option>
                <option value="Γάτα">Γάτα</option>
                <option value="Κουνέλι">Κουνέλι</option>
                <option value="Πτηνό">Πτηνό</option>
                <option value="Άλλο">Άλλο</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Φύλο</label>
              <select
                value={petGender}
                onChange={(e) => { onDirty?.(); setPetGender(e.target.value); }}
                className={INPUT.replace("pl-9", "pl-3")}
              >
                <option value="Αρσενικό">Αρσενικό</option>
                <option value="Θηλυκό">Θηλυκό</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Ειδοποιήσεις */}
      {showMore && (
        <div className="bg-gray-50 dark:bg-win-elevated/30 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Ειδοποιήσεις</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {NOTIF_OPTIONS.map(({ key, label }) => {
              const disabled = key === "email" && !formData.email.trim();
              return (
                <label
                  key={key}
                  title={disabled ? "Συμπλήρωσε email για να ενεργοποιηθεί" : undefined}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    disabled
                      ? "bg-gray-50 dark:bg-win-elevated/50 border-gray-100 dark:border-win-border-light/50 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                      : formData.notifications[key]
                      ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 cursor-pointer"
                      : "bg-white dark:bg-win-elevated border-gray-200 dark:border-win-border-light text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-win-elevated2 cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    name={key}
                    checked={formData.notifications[key]}
                    onChange={wrapChange(handleNotificationChange)}
                    disabled={disabled}
                    className="hidden"
                  />
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    disabled
                      ? "border-gray-200 dark:border-win-border-light/50"
                      : formData.notifications[key] ? "bg-indigo-500 border-indigo-500" : "border-gray-300"
                  }`}>
                    {formData.notifications[key] && !disabled && (
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    )}
                  </span>
                  {label}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Κουμπιά */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-gray-200 dark:border-win-border-light text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-win-elevated transition-colors"
        >
          <X className="w-4 h-4" /> Ακύρωση
        </button>
        <button
          type="submit"
          disabled={loading || (!isEdit && !petName.trim())}
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
