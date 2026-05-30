import React from "react";
import { X, PawPrint } from "lucide-react";
import PetProfile from "./PetProfile";

const PetProfileModal = ({ petId, onClose, initialTab }) => {
  if (!petId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-[600px] rounded-2xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col">

        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Προφίλ Κατοικιδίου</p>
              <p className="text-white/70 text-xs mt-0.5">Στοιχεία και ιατρικό ιστορικό</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="bg-gray-50 overflow-y-auto flex-1">
          <PetProfile petId={petId} onClose={onClose} initialTab={initialTab} />
        </div>
      </div>
    </div>
  );
};

export default PetProfileModal;
