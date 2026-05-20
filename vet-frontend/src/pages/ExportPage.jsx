import React from "react";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import ProductExport from "../components/products/ProductExport";

const ExportPage = ({ onClose }) => {
  return (
    <div>
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-400 rounded-2xl px-5 pt-4 pb-4 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white">
            <ShoppingCart className="w-5 h-5" />
            <div>
              <p className="text-lg font-bold leading-tight">Πωλήσεις</p>
              <p className="text-xs text-white/70 mt-0.5">Καταχώρηση αγορών πελατών</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Επιστροφή
          </button>
        </div>
      </div>

      <ProductExport />
    </div>
  );
};

export default ExportPage;
