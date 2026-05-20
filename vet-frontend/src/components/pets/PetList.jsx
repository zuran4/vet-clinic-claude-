import React, { useState } from "react";
import { Edit, Trash2, Plus, User, Eye } from "lucide-react";
import Button from "../ui/button.jsx";
import PetModal from "./PetModal.jsx";
import PetProfileModal from "./PetProfileModal.jsx"; // 🆕 modal για προβολή
import { usePetList } from "../../hooks/usePetList.jsx";

const PetList = () => {
  const { pets, loading, error, deletePet, savePet } = usePetList();

  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [viewingPet, setViewingPet] = useState(null); // 🆕 state για προβολή

  // 🔹 Add
  const handleAdd = () => {
    setEditingPet(null);
    setShowModal(true);
  };

  // 🔹 Edit
  const handleEdit = (pet) => {
    setEditingPet(pet);
    setShowModal(true);
  };

  if (loading) return <p className="text-gray-500">Φόρτωση...</p>;
  if (error) return <p className="text-red-500">❌ {error}</p>;

  return (
    <div className="p-6">
      {/* Actions */}
      <div className="mb-4">
        <Button variant="primary" onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Νέο
        </Button>
      </div>

      {/* Λίστα */}
      {pets.length === 0 ? (
        <p className="text-gray-600">Δεν υπάρχουν καταχωρημένα κατοικίδια.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Όνομα</th>
                <th className="p-2">Είδος</th>
                <th className="p-2">Φύλο</th>
                <th className="p-2 flex items-center gap-1">
                  <User className="w-4 h-4" /> Ιδιοκτήτης
                </th>
                <th className="p-2 text-right">Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {pets.map((pet) => (
                <tr key={pet._id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-semibold">{pet.name}</td>
                  <td className="p-2">{pet.species}</td>
                  <td className="p-2">{pet.gender}</td>
                  <td className="p-2">
                    {pet.owner ? (
                      <span className="text-gray-700">
                        {pet.owner.name} ({pet.owner.phone || "χωρίς τηλ."})
                      </span>
                    ) : (
                      <span className="text-gray-400">Άγνωστος</span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex gap-2 justify-end">
                      {/* 🆕 Προβολή → ανοίγει PetProfileModal */}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setViewingPet(pet._id)}
                        className="gap-1"
                      >
                        <Eye className="w-4 h-4" /> Προβολή
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEdit(pet)}
                        className="gap-1"
                      >
                        <Edit className="w-4 h-4" /> Επεξεργασία
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deletePet(pet._id)}
                        className="gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> Διαγραφή
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add/Edit */}
      {showModal && (
        <PetModal
          initialData={editingPet}
          onSaved={(saved) => {
            savePet(saved, editingPet);
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
        />
      )}

      {/* 🆕 Modal Προβολής */}
      {viewingPet && (
        <PetProfileModal
          petId={viewingPet}
          onClose={() => setViewingPet(null)}
        />
      )}
    </div>
  );
};

export default PetList;
