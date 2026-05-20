// ===============================================
// 📄 CustomerPetsExpanded.jsx
// Περιγραφή: Εμφανίζει όλα τα κατοικίδια ενός συγκεκριμένου πελάτη
// ===============================================

import React from "react";
import { PawPrint } from "lucide-react";
import { useCustomerPets } from "../../hooks/useCustomerPets"; // ✅ custom hook

const CustomerPetsExpanded = ({ ownerId }) => {
  // ----------------------------
  // Φόρτωση κατοικιδίων μέσω hook
  // ----------------------------
  const { pets, loading, error } = useCustomerPets(ownerId);

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

  // ----------------------------
  // Κανονική εμφάνιση κατοικιδίων
  // ----------------------------
  return (
    <ul className="mt-2 ml-4 pl-2 border-l-2 border-gray-100 text-sm text-gray-700 space-y-1">
      {pets.map((p) => (
        <li key={p._id} className="flex items-center gap-2">
          <PawPrint className="w-4 h-4 text-primary" />
          {p.name} — {p.species} ({p.gender})
        </li>
      ))}
    </ul>
  );
};

export default CustomerPetsExpanded;
