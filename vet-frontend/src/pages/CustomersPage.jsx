import React from "react";
import CustomerList from "../components/customers/CustomerList";
import { Users, ArrowLeft, Plus } from "lucide-react";

function CustomersPage({ onClose }) {
  return (
    <div>
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-violet-400 rounded-2xl px-5 pt-4 pb-0 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 text-white">
            <Users className="w-5 h-5" />
            <span className="text-lg font-bold">Πελάτες</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Επιστροφή
          </button>
        </div>
      </div>

      <CustomerList />
    </div>
  );
}

export default CustomersPage;
