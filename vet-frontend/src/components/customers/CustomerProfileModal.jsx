import React from "react";
import { X, User, Phone, Mail, MapPin, Home, FileText, StickyNote, Bell, ShoppingBag, Pencil } from "lucide-react";
import { Button } from "../ui/button";
import CustomerPetsExpanded from "./CustomerPetsExpanded.jsx";

const NOTIFICATION_LABELS = [
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
  { key: "reminders", label: "Υπενθυμίσεις" },
  { key: "promotions", label: "Προσφορές" },
];

const display = (v) => {
  const str = v === null || v === undefined ? "" : String(v).trim();
  return str.length ? str : "—";
};

const IconField = ({ icon: Icon, label, value }) => {
  const isEmpty = value === "—";
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
        <p className={`text-sm font-semibold leading-snug ${isEmpty ? "text-gray-300 dark:text-gray-600" : "text-gray-800 dark:text-gray-100"}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

const CustomerProfileModal = ({ customer, onClose, onEdit, onPurchases }) => {
  if (!customer) return null;

  const { _id, name, phone, email, address, city, afm, notes, notifications } = customer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-[600px] rounded-2xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col bg-white dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-400 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-base font-bold text-white">
                {name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">{name}</p>
              <p className="text-white/70 text-xs mt-0.5">Προφίλ Πελάτη</p>
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
        <div className="bg-gray-50 dark:bg-gray-800/50 overflow-y-auto flex-1 p-5 space-y-4">
          {/* Κάρτα Ιδιοκτήτη — ίδιο στιλ με την κάρτα ιδιοκτήτη στο προφίλ κατοικιδίου */}
          <div className="rounded-2xl bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-700/50">
              <User className="w-4 h-4 text-indigo-400 dark:text-indigo-300" />
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Ιδιοκτήτης</span>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-sm flex-shrink-0">
                {display(name) !== "—" ? display(name).charAt(0).toUpperCase() : "?"}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">{display(name)}</p>
                {city && <p className="text-xs text-gray-400 dark:text-gray-500">{display(city)}</p>}
              </div>
            </div>

            <div className="px-4 py-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
              <IconField icon={Phone} label="Τηλέφωνο" value={display(phone)} />
              <IconField icon={Mail} label="Email" value={display(email)} />
              <IconField icon={MapPin} label="Διεύθυνση" value={display(address)} />
              <IconField icon={Home} label="Πόλη" value={display(city)} />
              <IconField icon={FileText} label="ΑΦΜ" value={display(afm)} />
            </div>
          </div>

          {/* Σημειώσεις */}
          {notes && (
            <div className="bg-white dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600 p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-500 dark:text-amber-400" />Σημειώσεις
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">{notes}</p>
            </div>
          )}

          {/* Ειδοποιήσεις */}
          {notifications && (
            <div className="bg-white dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600 p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400 dark:text-indigo-300" />Ειδοποιήσεις
              </h3>
              <div className="flex flex-wrap gap-2">
                {NOTIFICATION_LABELS.map(({ key, label }) => (
                  <span
                    key={key}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      notifications[key] ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {label}: {notifications[key] ? "Ναι" : "Όχι"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Κατοικίδια */}
          <div className="bg-white dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Κατοικίδια</h3>
            <CustomerPetsExpanded ownerId={_id} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={() => onPurchases(_id)}>
            <ShoppingBag className="w-4 h-4" /> Ιστορικό Αγορών
          </Button>
          <Button variant="primary" size="sm" onClick={() => onEdit(customer)}>
            <Pencil className="w-4 h-4" /> Επεξεργασία
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfileModal;
