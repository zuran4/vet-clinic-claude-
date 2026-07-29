import React, { useState } from "react";
import { PawPrint, PlusCircle, XCircle } from "lucide-react";
import { useCustomerPets } from "../../hooks/useCustomerPets";
import request from "@/api/apiClient.js";

const SELECT = "border border-gray-200 dark:border-win-border-light p-2 rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100";

// Εμφανίζει τα ήδη καταχωρημένα κατοικίδια του πελάτη, με προαιρετική
// επιλογή προσθήκης νέου κατοικιδίου κάτω από τη λίστα (π.χ. ο πελάτης
// υιοθέτησε δεύτερο ζώο μετά τη δημιουργία του προφίλ του).
// multi=false (edit ραντεβού): dropdown, ένα κατοικίδιο.
// multi=true (νέο ραντεβού): checkboxes, 1 ή περισσότερα κατοικίδια.
const PetSelector = ({
  ownerId = null,
  multi = false,
  selectedPetId = null,
  selectedPetIds = [],
  onChangePet,
  onTogglePet,
}) => {
  const { pets, loading, refetch } = useCustomerPets(ownerId);

  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [newName, setNewName] = useState("");
  const [newSpecies, setNewSpecies] = useState("Σκύλος");
  const [newGender, setNewGender] = useState("Αρσενικό");

  if (!ownerId) {
    return <p className="text-xs text-gray-400 dark:text-gray-500 py-1">Επίλεξε πρώτα πελάτη.</p>;
  }

  if (loading) {
    return <p className="text-xs text-gray-400 dark:text-gray-500 py-1">Φόρτωση κατοικιδίων...</p>;
  }

  const closeAdd = () => {
    setAdding(false);
    setSaveError("");
    setNewName("");
    setNewSpecies("Σκύλος");
    setNewGender("Αρσενικό");
  };

  const handleAddPet = async () => {
    if (!newName.trim()) return;
    try {
      setSaving(true);
      setSaveError("");
      const pet = await request("/pets", {
        method: "POST",
        body: { owner: ownerId, name: newName.trim(), species: newSpecies, gender: newGender },
      });
      await refetch();
      if (multi) onTogglePet(pet._id);
      else onChangePet(pet._id);
      closeAdd();
    } catch {
      setSaveError("Αποτυχία προσθήκης κατοικιδίου.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {pets.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">Ο πελάτης δεν έχει καταχωρημένο κατοικίδιο.</p>
      ) : multi ? (
        <div className="space-y-1.5">
          {pets.map((p) => {
            const checked = selectedPetIds.includes(p._id);
            return (
              <label
                key={p._id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                  checked
                    ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                    : "bg-white dark:bg-win-elevated border-gray-200 dark:border-win-border-light text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-win-elevated2"
                }`}
              >
                <input type="checkbox" checked={checked} onChange={() => onTogglePet(p._id)} className="hidden" />
                <span className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 ${
                  checked ? "bg-indigo-500 border-indigo-500" : "border-gray-300"
                }`}>
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <PawPrint className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span className="truncate">{p.name} <span className="text-xs text-gray-400 dark:text-gray-500">— {p.species}</span></span>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="relative">
          <select
            value={selectedPetId || ""}
            onChange={(e) => onChangePet(e.target.value)}
            className={`${SELECT} w-full pr-8 appearance-none`}
          >
            {pets.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} — {p.species}
              </option>
            ))}
          </select>
          <PawPrint className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        </div>
      )}

      {adding ? (
        <div className="space-y-2 border border-dashed border-indigo-200 dark:border-indigo-700/50 rounded-2xl p-3 bg-indigo-50/40 dark:bg-indigo-900/10">
          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          <input
            type="text"
            placeholder="Όνομα ζώου"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            className={`${SELECT} w-full placeholder-gray-400 dark:placeholder-gray-500`}
          />
          <select value={newSpecies} onChange={(e) => setNewSpecies(e.target.value)} className={`${SELECT} w-full`}>
            <option value="Σκύλος">Σκύλος</option>
            <option value="Γάτα">Γάτα</option>
            <option value="Κουνέλι">Κουνέλι</option>
            <option value="Πτηνό">Πτηνό</option>
            <option value="Άλλο">Άλλο</option>
          </select>
          <select value={newGender} onChange={(e) => setNewGender(e.target.value)} className={`${SELECT} w-full`}>
            <option value="Αρσενικό">Αρσενικό</option>
            <option value="Θηλυκό">Θηλυκό</option>
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddPet}
              disabled={saving || !newName.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" /> {saving ? "Προσθήκη..." : "Προσθήκη"}
            </button>
            <button
              type="button"
              onClick={closeAdd}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-win-border-light text-gray-500 dark:text-gray-400 text-xs font-medium hover:bg-gray-50 dark:hover:bg-win-elevated transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Άκυρο
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" /> Προσθήκη κατοικιδίου
        </button>
      )}
    </div>
  );
};

export default PetSelector;
