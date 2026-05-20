import React from "react";
import { PawPrint } from "lucide-react";
import { useCustomerPets } from "../../hooks/useCustomerPets";

const PetSelector = ({
  ownerId = null,
  selectedPetId = "new",
  animalName = "",
  newPetSpecies = "Σκύλος",
  newPetGender = "Αρσενικό",
  onChangePet,
  onChangeAnimalName,
  onChangeSpecies,
  onChangeGender,
}) => {
  const { pets } = useCustomerPets(ownerId);
  const isNew = selectedPetId === "new" || pets.length === 0;

  return (
    <div className="space-y-2">
      {/* Dropdown επιλογής κατοικιδίου */}
      {pets.length > 0 && (
        <div className="relative">
          <select
            value={selectedPetId}
            onChange={(e) => onChangePet(e.target.value)}
            className="w-full border border-gray-200 p-2 rounded-2xl shadow-sm text-sm pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {pets.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} — {p.species}
              </option>
            ))}
            <option value="new">➕ Νέο Κατοικίδιο</option>
          </select>
          <PawPrint className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      )}

      {/* Πεδία νέου κατοικιδίου */}
      {isNew && (
        <div className="space-y-2 border border-dashed border-indigo-200 rounded-2xl p-3 bg-indigo-50/40">
          <p className="text-xs font-medium text-indigo-600">Νέο κατοικίδιο</p>

          {/* Όνομα */}
          <input
            type="text"
            placeholder="Όνομα ζώου"
            value={animalName}
            onChange={(e) => onChangeAnimalName(e.target.value)}
            className="w-full border border-gray-200 p-2 rounded-2xl shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            required
          />

          {/* Είδος + Φύλο δίπλα-δίπλα */}
          <div className="flex gap-2">
            <select
              value={newPetSpecies}
              onChange={(e) => onChangeSpecies(e.target.value)}
              className="flex-1 border border-gray-200 p-2 rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="Σκύλος">Σκύλος</option>
              <option value="Γάτα">Γάτα</option>
              <option value="Άλλο">Άλλο</option>
            </select>

            <select
              value={newPetGender}
              onChange={(e) => onChangeGender(e.target.value)}
              className="flex-1 border border-gray-200 p-2 rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="Αρσενικό">Αρσενικό</option>
              <option value="Θηλυκό">Θηλυκό</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetSelector;
