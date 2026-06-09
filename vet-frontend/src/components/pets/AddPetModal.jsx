// ===============================================
// 📄 AddPetModal.jsx
// Περιγραφή: Modal για προσθήκη νέου κατοικιδίου σε πελάτη
// ===============================================

import React, { useState } from "react";
import { X, PawPrint } from "lucide-react"; // ✅ lucide icons
import Button from "../ui/button"; // ✅ κοινό UI component

const AddPetModal = ({ ownerId, onSave, onClose }) => {
  // ----------------------------
  // Τοπικό state για τα δεδομένα του κατοικιδίου
  // ----------------------------
  const [petData, setPetData] = useState({
    name: "",
    species: "",
    gender: "",
  });

  // ----------------------------
  // Χειριστής αποθήκευσης
  // ----------------------------
  const handleSubmit = (e) => {
    e.preventDefault();

    // Έλεγχος ότι έχει δοθεί όνομα
    if (!petData.name.trim()) return;

    // Κλήση της συνάρτησης onSave (έρχεται από CustomerList)
    onSave(petData);

    // Κλείσιμο modal
    onClose();

    // Καθάρισμα state
    setPetData({ name: "", species: "", gender: "" });
  };

  // ----------------------------
  // JSX εμφάνιση modal
  // ----------------------------
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
            <PawPrint className="w-5 h-5 text-primary" />
            Προσθήκη Κατοικιδίου
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Κλείσιμο"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Φόρμα */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Όνομα
            </label>
            <input
              type="text"
              value={petData.name}
              onChange={(e) =>
                setPetData({ ...petData, name: e.target.value })
              }
              className="w-full border dark:border-gray-600 rounded-2xl px-3 py-2 text-sm shadow focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Είδος (π.χ. Σκύλος, Γάτα)
            </label>
            <input
              type="text"
              value={petData.species}
              onChange={(e) =>
                setPetData({ ...petData, species: e.target.value })
              }
              className="w-full border dark:border-gray-600 rounded-2xl px-3 py-2 text-sm shadow focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Φύλο
            </label>
            <select
              value={petData.gender}
              onChange={(e) =>
                setPetData({ ...petData, gender: e.target.value })
              }
              className="w-full border dark:border-gray-600 rounded-2xl px-3 py-2 text-sm shadow focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">-- Επιλέξτε --</option>
              <option value="Αρσενικό">Αρσενικό</option>
              <option value="Θηλυκό">Θηλυκό</option>
            </select>
          </div>

          {/* Κουμπιά */}
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" type="button" onClick={onClose}>
              Ακύρωση
            </Button>
            <Button variant="primary" type="submit">
              Αποθήκευση
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPetModal;
