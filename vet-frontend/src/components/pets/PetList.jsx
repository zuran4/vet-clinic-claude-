import React, { useState, useEffect, useMemo } from "react";
import { Edit, Trash2, Eye, PawPrint, User, Search, X, Cpu } from "lucide-react";
import PetModal from "./PetModal.jsx";
import PetProfileModal from "./PetProfileModal.jsx";
import PetDetailsModal from "../registry/PetDetailsModal.jsx";
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
  const [viewingSnapshot, setViewingSnapshot] = useState(null); // για PetDetailsModal
  const [viewingPet, setViewingPet] = useState(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pets;
    return pets.filter((p) =>
      p.name?.toLowerCase().includes(q) ||
      p.microchip?.toLowerCase().includes(q) ||
      p.owner?.name?.toLowerCase().includes(q) ||
      p.owner?.phone?.includes(q)
    );
  }, [pets, query]);

  useEffect(() => {
    const open = () => { setEditingPet(null); setShowModal(true); };
    document.addEventListener("openPetModal", open);
    return () => document.removeEventListener("openPetModal", open);
  }, []);

  if (loading) return (
    <div className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border shadow-sm p-10 text-center text-sm text-gray-400 dark:text-gray-500">
      Φόρτωση...
    </div>
  );
  if (error) return (
    <div className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border shadow-sm p-10 text-center text-sm text-red-500 dark:text-red-400">
      {error}
    </div>
  );

  return (
    <>
      {/* Search bar */}
      <div className="mb-3 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Αναζήτηση με όνομα, microchip ή ιδιοκτήτη..."
          className="w-full pl-9 pr-9 py-2.5 rounded-2xl border border-gray-200 dark:border-win-border-light bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 placeholder-gray-400 dark:placeholder-gray-500"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="overflow-x-auto bg-white dark:bg-win-surface rounded-2xl shadow-sm border border-gray-100 dark:border-win-border">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <PawPrint className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {query ? `Δεν βρέθηκαν αποτελέσματα για "${query}".` : "Δεν υπάρχουν καταχωρημένα κατοικίδια."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 border-b border-sky-100 dark:border-sky-800/30 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wide">Όνομα</th>
                <th className="px-4 py-3 text-xs font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wide">Είδος</th>
                <th className="px-4 py-3 text-xs font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wide">Φύλο</th>
                <th className="px-4 py-3 text-xs font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wide">
                  <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5" />Chip</span>
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wide">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />Ιδιοκτήτης</span>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wide">Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pet) => (
                <tr key={pet._id} className="border-b border-gray-50 dark:border-win-border/50 hover:bg-sky-50/20 dark:hover:bg-sky-900/10 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{pet.name}</td>
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
                  <td className="px-4 py-3">
                    {pet.microchip
                      ? <span className="font-mono text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-win-elevated border border-gray-100 dark:border-win-border-light px-2 py-0.5 rounded-lg">{pet.microchip}</span>
                      : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                    {pet.owner
                      ? <span>{pet.owner.name} <span className="text-gray-400 dark:text-gray-500">({pet.owner.phone || "—"})</span></span>
                      : <span className="text-gray-400 dark:text-gray-500">Άγνωστος</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1.5 justify-end">
                      <button
                        title="Προβολή"
                        onClick={() => pet.registrySnapshot
                          ? setViewingSnapshot(pet.registrySnapshot)
                          : setViewingPet(pet._id)
                        }
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

      <PetDetailsModal
        open={Boolean(viewingSnapshot)}
        onClose={() => setViewingSnapshot(null)}
        data={viewingSnapshot}
      />
    </>
  );
};

export default PetList;
