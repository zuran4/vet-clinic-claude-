import React, { useEffect, useState } from "react";
import { PawPrint, Loader2 } from "lucide-react";
import request from "../api/apiClient.js"; // 👈 Δες σημείωση πιο κάτω για το path

const CustomerPetsList = ({ ownerId }) => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);

        // Χρησιμοποιούμε το apiClient:
        // - Production: VITE_API_BASE_URL (Render)
        // - Local: http://localhost:5000/api
        const data = await request(`/pets/by-owner/${ownerId}`);

        setPets(data || []);
      } catch (err) {
        console.error("❌ Σφάλμα φόρτωσης κατοικιδίων:", err);
      } finally {
        setLoading(false);
      }
    };

    if (ownerId) {
      fetchPets();
    }
  }, [ownerId]);

  if (loading)
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 ml-6">
        <Loader2 className="animate-spin w-4 h-4" /> Φόρτωση...
      </div>
    );

  if (!pets || pets.length === 0)
    return (
      <div className="ml-6 text-gray-400 dark:text-gray-500 text-sm">
        (Δεν υπάρχουν κατοικίδια)
      </div>
    );

  return (
    <ul className="ml-6 mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-200">
      {pets.map((p) => (
        <li key={p._id} className="flex items-center gap-2">
          <PawPrint className="w-4 h-4 text-primary" />
          {p.name} — {p.species} ({p.gender})
        </li>
      ))}
    </ul>
  );
};

export default CustomerPetsList;
