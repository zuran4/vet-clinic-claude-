import React from "react";
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react";

export default function ExportCart({ items = [], onChange }) {
  const incQty = (id) =>
    onChange(items.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));

  const decQty = (id) =>
    onChange(items.map((item) => item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item));

  const updateQty = (id, value) => {
    const qty = Math.max(1, parseInt(value) || 1);
    onChange(items.map((item) => item.id === id ? { ...item, quantity: qty } : item));
  };

  const removeItem = (id) => onChange(items.filter((item) => item.id !== id));

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40">
        <ShoppingCart className="w-7 h-7 text-emerald-300 mb-2" />
        <p className="text-sm text-gray-400">Δεν έχεις προσθέσει προϊόντα ακόμα.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-100 overflow-hidden">
      <ul className="divide-y divide-emerald-50">
        {items.map((p) => (
          <li key={p.id} className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-emerald-50/30 transition-colors">
            <span className="font-medium text-sm text-gray-800 flex-1 min-w-0 truncate pr-3">{p.name}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => decQty(p.id)}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="1"
                value={p.quantity}
                onChange={(e) => updateQty(p.id, e.target.value)}
                className="w-12 text-center text-sm font-semibold text-gray-800 border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <button
                onClick={() => incQty(p.id)}
                className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => removeItem(p.id)}
                className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400 hover:text-red-500 transition-colors ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="bg-emerald-50 border-t border-emerald-100 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">
          {items.length} {items.length === 1 ? "προϊόν" : "προϊόντα"}
        </span>
        <span className="text-xs font-bold text-emerald-700">
          Σύνολο τεμαχίων: {items.reduce((s, p) => s + p.quantity, 0)}
        </span>
      </div>
    </div>
  );
}
