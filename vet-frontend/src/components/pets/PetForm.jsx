// ===============================================
// 📄 PetForm.jsx
// Περιγραφή: Φόρμα για προσθήκη / επεξεργασία κατοικιδίου (με loading state)
// ===============================================

import React from "react";
import { XCircle, Save } from "lucide-react";
import { Button } from "../ui/button.jsx";
import PetOwnerSelector from "./PetOwnerSelector.jsx";
import { usePetForm } from "./hooks/usePetForm.js";

const PetForm = ({ initialData, onSaved, onCancel, owner }) => {
  // -------------------------------------
  // 1️⃣ Χρήση custom hook
  // -------------------------------------
  const {
    formData,
    handleChange,
    handleSelectOwner,
    handleSubmit,
    loading, // ✅ νέο state από το hook
  } = usePetForm(initialData, owner, onSaved, onCancel);

  // -------------------------------------
  // 2️⃣ UI φόρμας
  // -------------------------------------
  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
    >
      {/* Ιδιοκτήτης */}
      <div className="col-span-2">
        <PetOwnerSelector
          owner={owner}
          selectedOwnerId={formData.owner}
          onSelect={handleSelectOwner}
        />
      </div>

      {/* Όνομα */}
      <input
        type="text"
        name="name"
        placeholder="Όνομα"
        value={formData.name}
        onChange={handleChange}
        className="border px-3 py-2 rounded-2xl shadow-sm w-full text-sm"
        required
      />

      {/* Είδος */}
      <select
        name="species"
        value={formData.species}
        onChange={handleChange}
        className="border px-3 py-2 rounded-2xl shadow-sm w-full text-sm"
        required
      >
        <option value="">Είδος</option>
        <option value="Σκύλος">Σκύλος</option>
        <option value="Γάτα">Γάτα</option>
        <option value="Άλλο">Άλλο</option>
      </select>

      {/* Φύλο */}
      <select
        name="gender"
        value={formData.gender}
        onChange={handleChange}
        className="border px-3 py-2 rounded-2xl shadow-sm w-full text-sm"
        required
      >
        <option value="">Φύλο</option>
        <option value="Αρσενικό">Αρσενικό</option>
        <option value="Θηλυκό">Θηλυκό</option>
      </select>

      {/* Ημ. γέννησης */}
      <input
        type="date"
        name="birthDate"
        value={formData.birthDate}
        onChange={handleChange}
        className="border px-3 py-2 rounded-2xl shadow-sm w-full text-sm"
      />

      {/* Microchip */}
      <input
        type="text"
        name="microchip"
        placeholder="Microchip"
        value={formData.microchip}
        onChange={handleChange}
        className="border px-3 py-2 rounded-2xl shadow-sm w-full text-sm"
      />

      {/* Checkboxes */}
      <div className="flex items-center gap-4 col-span-2">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            name="neutered"
            checked={formData.neutered}
            onChange={handleChange}
          />
          Στειρωμένο
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            name="vaccinated"
            checked={formData.vaccinated}
            onChange={handleChange}
          />
          Εμβολιασμένο
        </label>
      </div>

      {/* Κουμπιά */}
      <div className="flex justify-end gap-3 pt-4 col-span-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          <XCircle className="w-4 h-4" />
          Ακύρωση
        </Button>

        {/* 🔹 Κουμπί αποθήκευσης με loading state */}
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Αποθήκευση...
            </span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Αποθήκευση
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default PetForm;
