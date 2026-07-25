import React from "react";
import { PawPrint } from "lucide-react";
import { useCustomerPets } from "../../hooks/useCustomerPets";

const SELECT = "border border-gray-200 dark:border-win-border-light p-2 rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100";

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
      {pets.length > 0 && (
        <div className="relative">
          <select
            value={selectedPetId}
            onChange={(e) => onChangePet(e.target.value)}
            className={`${SELECT} w-full pr-8 appearance-none`}
          >
            {pets.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} — {p.species}
              </option>
            ))}
            <option value="new">➕ Νέο Κατοικίδιο</option>
          </select>
          <PawPrint className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        </div>
      )}

      {isNew && (
        <div className="space-y-2 border border-dashed border-indigo-200 dark:border-indigo-700/50 rounded-2xl p-3 bg-indigo-50/40 dark:bg-indigo-900/10">
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Νέο κατοικίδιο</p>

          <input
            type="text"
            placeholder="Όνομα ζώου"
            value={animalName}
            onChange={(e) => onChangeAnimalName(e.target.value)}
            className={`${SELECT} w-full placeholder-gray-400 dark:placeholder-gray-500`}
            required
          />

          <select
            value={newPetSpecies}
            onChange={(e) => onChangeSpecies(e.target.value)}
            className={`${SELECT} w-full`}
          >
            <option value="Σκύλος">Σκύλος</option>
            <option value="Γάτα">Γάτα</option>
            <option value="Άλλο">Άλλο</option>
          </select>

          <select
            value={newPetGender}
            onChange={(e) => onChangeGender(e.target.value)}
            className={`${SELECT} w-full`}
          >
            <option value="Αρσενικό">Αρσενικό</option>
            <option value="Θηλυκό">Θηλυκό</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default PetSelector;
