import React from "react";
import { PawPrint, ArrowLeft, Plus } from "lucide-react";
import PetList from "../components/pets/PetList";

function PetsPage({ onClose }) {
  return (
    <div>
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-sky-500 to-cyan-400 rounded-2xl px-5 py-4 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white">
            <PawPrint className="w-5 h-5" />
            <div>
              <p className="text-lg font-bold leading-tight">Κατοικίδια</p>
              <p className="text-xs text-white/70 mt-0.5">Διαχείριση και ιατρικό ιστορικό</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => document.dispatchEvent(new CustomEvent("openPetModal"))}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-sky-600 hover:bg-sky-50 text-sm font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Νέο Κατοικίδιο
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Επιστροφή
            </button>
          </div>
        </div>
      </div>

      <PetList />
    </div>
  );
}

export default PetsPage;
