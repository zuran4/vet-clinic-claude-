import React, { useState, useEffect } from "react";
import { Edit, Trash2, Eye, PawPrint, User } from "lucide-react";
import PetModal from "./PetModal.jsx";
import PetProfileModal from "./PetProfileModal.jsx";
import { usePetList } from "../../hooks/usePetList.jsx";

const SPECIES_STYLE = {
  "Σκύλος": "bg-sky-50 text-sky-700",
  "Γάτα":   "bg-violet-50 text-violet-700",
  "Πτηνό":  "bg-amber-50 text-amber-700",
  "Κουνέλι":"bg-pink-50 text-pink-700",
};

const GENDER_STYLE = {
  "Αρσενικό": "bg-sky-50 text-sky-700",
  "Θηλυκό":   "bg-rose-50 text-rose-600",
};

const PetList = () => {
  const { pets, loading, error, deletePet, savePet } = usePetList();
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [viewingPet, setViewingPet] = useState(null);

  useEffect(() => {
    const open = () => { setEditingPet(null); setShowModal(true); };
    document.addEventListener("openPetModal", open);
    return () => document.removeEventListener("openPetModal", open);
  }, []);

  if (loading) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
      Φόρτωση...
    </div>
  );
  if (error) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-sm text-red-500">
      {error}
    </div>
  );

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100">
        {pets.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <PawPrint className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Δεν υπάρχουν καταχωρημένα κατοικίδια.</p>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-sky-50 to-cyan-50 border-b border-sky-100 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-sky-700 uppercase tracking-wide">Όνομα</th>
                <th className="px-4 py-3 text-xs font-semibold text-sky-700 uppercase tracking-wide">Είδος</th>
                <th className="px-4 py-3 text-xs font-semibold text-sky-700 uppercase tracking-wide">Φύλο</th>
                <th className="px-4 py-3 text-xs font-semibold text-sky-700 uppercase tracking-wide">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />Ιδιοκτήτης</span>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-sky-700 uppercase tracking-wide">Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {pets.map((pet) => (
                <tr key={pet._id} className="border-b border-gray-50 hover:bg-sky-50/20 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-800">{pet.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${SPECIES_STYLE[pet.species] ?? "bg-gray-100 text-gray-600"}`}>
                      {pet.species}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${GENDER_STYLE[pet.gender] ?? "bg-gray-100 text-gray-600"}`}>
                      {pet.gender}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {pet.owner
                      ? <span>{pet.owner.name} <span className="text-gray-400">({pet.owner.phone || "—"})</span></span>
                      : <span className="text-gray-400">Άγνωστος</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1.5 justify-end">
                      <button
                        title="Προβολή"
                        onClick={() => setViewingPet(pet._id)}
                        className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        title="Επεξεργασία"
                        onClick={() => { setEditingPet(pet); setShowModal(true); }}
                        className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        title="Διαγραφή"
                        onClick={() => deletePet(pet._id)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <PetModal
          initialData={editingPet}
          onSaved={(saved) => { savePet(saved, editingPet); setShowModal(false); }}
          onCancel={() => setShowModal(false)}
        />
      )}

      {viewingPet && (
        <PetProfileModal
          petId={viewingPet}
          onClose={() => setViewingPet(null)}
        />
      )}
    </>
  );
};

export default PetList;
