// ===============================================
// 📄 CustomerPetsExpanded.jsx
// Περιγραφή: Εμφανίζει όλα τα κατοικίδια ενός συγκεκριμένου πελάτη
// ===============================================

import React, { useState } from "react";
import { PawPrint } from "lucide-react";
import { useCustomerPets } from "../../hooks/useCustomerPets"; // ✅ custom hook
import PetProfileModal from "../pets/PetProfileModal.jsx";

const CustomerPetsExpanded = ({ ownerId }) => {
  const { pets, loading, error } = useCustomerPets(ownerId);
  const [viewingPetId, setViewingPetId] = useState(null);

  // ----------------------------
  // Καταστάσεις φόρτωσης ή σφάλματος
  // ----------------------------
  if (loading)
    return <p className="text-sm text-gray-400 mt-2 ml-4">Φόρτωση...</p>;

  if (error)
    return <p className="text-sm text-red-500 mt-2 ml-4">{error}</p>;

  if (!pets || pets.length === 0)
    return (
      <p className="text-sm text-gray-400 mt-2 ml-4">
        (Δεν υπάρχουν κατοικίδια)
      </p>
    );

  return (
    <>
      <ul className="mt-2 ml-4 pl-2 border-l-2 border-gray-100 text-sm text-gray-700 space-y-1">
        {pets.map((p) => (
          <li
            key={p._id}
            onClick={() => setViewingPetId(p._id)}
            className="flex items-center gap-2 px-2 py-1 rounded-xl cursor-pointer hover:bg-sky-50 hover:text-sky-700 transition-colors group"
          >
            <PawPrint className="w-4 h-4 text-gray-400 group-hover:text-sky-500 transition-colors" />
            <span className="font-medium">{p.name}</span>
            <span className="text-gray-400">— {p.species} ({p.gender})</span>
            {p.microchip && (
              <span className="ml-auto font-mono text-[11px] text-gray-400 group-hover:text-sky-400">
                {p.microchip}
              </span>
            )}
          </li>
        ))}
      </ul>

      {viewingPetId && (
        <PetProfileModal
          petId={viewingPetId}
          onClose={() => setViewingPetId(null)}
        />
      )}
    </>
  );
};

export default CustomerPetsExpanded;
