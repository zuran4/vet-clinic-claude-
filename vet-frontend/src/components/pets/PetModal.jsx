import React, { useState } from "react";
import { PawPrint, X, AlertTriangle } from "lucide-react";
import PetForm from "./PetForm.jsx";

const PetModal = ({ initialData, onSaved, onCancel, owner }) => {
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClose = () => {
    if (isDirty) setShowConfirm(true);
    else onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="absolute inset-0" onClick={() => {}} />

      <div className="relative w-full max-w-[560px] rounded-2xl overflow-hidden shadow-2xl z-10">

        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">
                {initialData ? "Επεξεργασία Κατοικιδίου" : "Νέο Κατοικίδιο"}
              </p>
              <p className="text-white/70 text-xs mt-0.5">
                {initialData ? "Τροποποίηση στοιχείων" : "Συμπλήρωσε τα στοιχεία"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Area */}
        <div className="bg-gray-50 p-5 max-h-[80vh] overflow-y-auto">
          <PetForm
            initialData={initialData}
            owner={owner}
            onSaved={onSaved}
            onCancel={onCancel}
            onDirty={() => setIsDirty(true)}
          />
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Άκυρες αλλαγές;</p>
                <p className="text-xs text-gray-400 mt-0.5">Έχεις αλλαγές που δεν έχουν αποθηκευτεί.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Συνέχεια επεξεργασίας
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
              >
                Ναι, κλείσιμο
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetModal;
