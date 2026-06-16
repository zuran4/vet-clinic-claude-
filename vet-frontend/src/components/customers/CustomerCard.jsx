import React, { useState, useEffect } from "react";
import { Trash2, Pencil, PawPrint, ShoppingBag, ChevronRight, Phone, Mail, MapPin, StickyNote, AlertTriangle } from "lucide-react";
import CustomerPetsExpanded from "./CustomerPetsExpanded.jsx";

const DeleteConfirmModal = ({ name, onConfirm, onCancel }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-win-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-red-500 to-rose-500 px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Επιβεβαίωση</p>
            <p className="text-white font-bold text-sm leading-tight mt-0.5">Διαγραφή Πελάτη</p>
          </div>
        </div>
        <div className="px-5 py-5">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Είσαι σίγουρος ότι θέλεις να διαγράψεις τον πελάτη{" "}
            <span className="font-bold text-gray-900 dark:text-gray-100">{name}</span>;
          </p>
          <p className="text-xs text-red-500 mt-1.5">Η ενέργεια δεν μπορεί να αναιρεθεί.</p>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-win-border text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-win-elevated transition-colors"
          >
            Ακύρωση
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-semibold hover:from-red-600 hover:to-rose-600 transition-colors shadow-sm"
          >
            Διαγραφή
          </button>
        </div>
      </div>
    </div>
  );
};

const CustomerCard = ({ customer, onEdit, onDelete, onAddPet, onPurchases, onView }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <li className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">

        {/* Chevron expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 transition-transform duration-200"
          style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          title="Κατοικίδια"
        >
          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 hover:text-indigo-400 transition-colors" />
        </button>

        {/* Avatar + Info — πατώντας ανοίγει το πλήρες προφίλ */}
        <div
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => onView(customer)}
          title="Προβολή προφίλ"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-indigo-500 dark:text-indigo-400">
              {customer.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>

          <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{customer.name}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
            {customer.phone && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <Phone className="w-3 h-3" />{customer.phone}
              </span>
            )}
            {customer.email && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <Mail className="w-3 h-3" />{customer.email}
              </span>
            )}
            {customer.address && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <MapPin className="w-3 h-3" />{customer.address}
              </span>
            )}
          </div>
          {customer.notes && (
            <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
              <StickyNote className="w-3 h-3" />{customer.notes}
            </p>
          )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            title="Ιστορικό Αγορών"
            onClick={() => onPurchases(customer._id)}
            className="p-1.5 rounded-xl hover:bg-emerald-50 text-emerald-500 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
          <button
            title="Κατοικίδια"
            onClick={() => onAddPet(customer)}
            className="p-1.5 rounded-xl hover:bg-blue-50 text-blue-400 transition-colors"
          >
            <PawPrint className="w-4 h-4" />
          </button>
          <button
            title="Επεξεργασία"
            onClick={() => onEdit(customer)}
            className="p-1.5 rounded-xl hover:bg-indigo-50 text-indigo-400 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            title="Διαγραφή"
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-xl hover:bg-red-50 text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded pets */}
      {expanded && (
        <div className="border-t border-gray-50 dark:border-win-border px-4 py-3 bg-indigo-50/30 dark:bg-indigo-900/10">
          <CustomerPetsExpanded ownerId={customer._id} />
        </div>
      )}

      {confirmDelete && (
        <DeleteConfirmModal
          name={customer.name}
          onConfirm={() => { setConfirmDelete(false); onDelete(customer._id); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </li>
  );
};

export default CustomerCard;
