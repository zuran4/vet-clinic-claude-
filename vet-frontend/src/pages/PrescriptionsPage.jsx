import React from "react";
import { Pill, ArrowLeft, Plus } from "lucide-react";
import PrescriptionList from "../components/prescriptions/PrescriptionList";

function PrescriptionsPage({ onClose }) {
  return (
    <div>
      <div className="bg-gradient-to-r from-violet-500 to-purple-400 rounded-2xl px-5 py-4 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white">
            <Pill className="w-5 h-5" />
            <div>
              <p className="text-lg font-bold leading-tight">Συνταγές</p>
              <p className="text-xs text-white/70 mt-0.5">Έκδοση και διαχείριση συνταγών</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => document.dispatchEvent(new CustomEvent("openPrescriptionForm"))}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-violet-600 hover:bg-violet-50 text-sm font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Νέα Συνταγή
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

      <PrescriptionList />
    </div>
  );
}

export default PrescriptionsPage;
