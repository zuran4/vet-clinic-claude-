import React from "react";
import { PawPrint, Cpu, Calendar, Save, X, Syringe, Scissors } from "lucide-react";
import PetOwnerSelector from "./PetOwnerSelector.jsx";
import { usePetForm } from "./hooks/usePetForm.js";

const INPUT = "w-full border border-gray-200 rounded-2xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 placeholder-gray-400 bg-white";
const LABEL = "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1";

const HEALTH_OPTIONS = [
  { key: "neutered",   label: "Στειρωμένο",   icon: Scissors },
  { key: "vaccinated", label: "Εμβολιασμένο",  icon: Syringe },
];

const PetForm = ({ initialData, onSaved, onCancel, owner, onDirty }) => {
  const { formData, handleChange, handleSelectOwner, handleSubmit, loading } =
    usePetForm(initialData, owner, onSaved, onCancel);

  const wrapChange = (fn) => (e) => { onDirty?.(); fn(e); };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* Ιδιοκτήτης */}
      <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3">
        <p className={LABEL}>Ιδιοκτήτης</p>
        <PetOwnerSelector
          owner={owner}
          selectedOwnerId={formData.owner}
          onSelect={(o) => { onDirty?.(); handleSelectOwner(o); }}
        />
      </div>

      {/* Βασικά Στοιχεία */}
      <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3">
        <p className={LABEL + " mb-3"}>Βασικά Στοιχεία</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          <div>
            <label className={LABEL}>Όνομα *</label>
            <div className="relative">
              <PawPrint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                name="name"
                placeholder="π.χ. Ρέξ"
                value={formData.name}
                onChange={wrapChange(handleChange)}
                required
                className="w-full border border-gray-200 rounded-2xl pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Είδος *</label>
            <select
              name="species"
              value={formData.species}
              onChange={wrapChange(handleChange)}
              required
              className={INPUT}
            >
              <option value="">— Επιλογή —</option>
              <option value="Σκύλος">Σκύλος</option>
              <option value="Γάτα">Γάτα</option>
              <option value="Πτηνό">Πτηνό</option>
              <option value="Κουνέλι">Κουνέλι</option>
              <option value="Άλλο">Άλλο</option>
            </select>
          </div>

          <div>
            <label className={LABEL}>Φύλο *</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={wrapChange(handleChange)}
              required
              className={INPUT}
            >
              <option value="">— Επιλογή —</option>
              <option value="Αρσενικό">Αρσενικό</option>
              <option value="Θηλυκό">Θηλυκό</option>
            </select>
          </div>

          <div>
            <label className={LABEL}>Ημ. Γέννησης</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={wrapChange(handleChange)}
                className="w-full border border-gray-200 rounded-2xl pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={LABEL}>Microchip</label>
            <div className="relative">
              <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                name="microchip"
                placeholder="π.χ. 941000012345678"
                value={formData.microchip}
                onChange={wrapChange(handleChange)}
                className="w-full border border-gray-200 rounded-2xl pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Υγεία */}
      <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3">
        <p className={LABEL + " mb-3"}>Υγεία</p>
        <div className="flex gap-2 flex-wrap">
          {HEALTH_OPTIONS.map(({ key, label, icon: Icon }) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                formData[key]
                  ? "bg-sky-50 border-sky-200 text-sky-700"
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                name={key}
                checked={formData[key] || false}
                onChange={wrapChange(handleChange)}
                className="hidden"
              />
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                formData[key] ? "bg-sky-500 border-sky-500" : "border-gray-300"
              }`}>
                {formData[key] && (
                  <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <Icon className="w-3.5 h-3.5" />
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
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" /> Ακύρωση
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition-colors disabled:opacity-60"
        >
          {loading
            ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
            : <Save className="w-4 h-4" />
          }
          {loading ? "Αποθήκευση..." : "Αποθήκευση"}
        </button>
      </div>
    </form>
  );
};

export default PetForm;
