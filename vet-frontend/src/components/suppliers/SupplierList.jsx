import React, { useState } from "react";
import { Trash2, Edit, Truck, Phone, Mail, Globe, StickyNote, Upload, Loader2, Plus } from "lucide-react";
import SupplierModal from "./SupplierModal.jsx";
import SupplierImportModal from "./SupplierImportModal.jsx";
import SearchBar from "../ui/SearchBar.jsx";
import { useSuppliers } from "../../hooks/useSuppliers.jsx";
import { Button } from "../ui/button.jsx";

const SupplierList = ({ showForm, setShowForm, editingSupplier, setEditingSupplier }) => {
  const { suppliers, loading, error, saveSupplier, deleteSupplier, importSuppliers } = useSuppliers();
  const [searchTerm, setSearchTerm]   = useState("");
  const [showImport, setShowImport]   = useState(false);

  const filteredSuppliers = suppliers.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.name?.toLowerCase().includes(term)    ||
      s.contact?.toLowerCase().includes(term) ||
      s.phone?.toLowerCase().includes(term)   ||
      s.email?.toLowerCase().includes(term)   ||
      s.website?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Αναζήτηση (όνομα, υπεύθυνος, email…)"
          className="w-full sm:w-80"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setEditingSupplier(null); setShowForm(true); }}
            className="sm:hidden flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-white text-sm font-semibold shadow-sm active:scale-95 transition"
          >
            <Plus className="w-4 h-4" /> Νέος Προμηθευτής
          </button>
          <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Εισαγωγή CSV</span>
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Φόρτωση προμηθευτών…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredSuppliers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 border border-dashed border-gray-200 dark:border-win-border rounded-2xl">
          <Truck className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {searchTerm ? "Δεν βρέθηκαν αποτελέσματα." : "Δεν υπάρχουν προμηθευτές ακόμα."}
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && filteredSuppliers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSuppliers.map((s) => (
            <div
              key={s._id}
              className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 border-b border-orange-100 dark:border-orange-800/30 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800 dark:text-gray-100 truncate block">{s.name}</span>
                    {s.contact && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 truncate block">{s.contact}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    title="Επεξεργασία"
                    onClick={() => { setEditingSupplier(s); setShowForm(true); }}
                    className="p-1.5 rounded-xl bg-white dark:bg-win-elevated hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-indigo-500 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-700/50 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    title="Διαγραφή"
                    onClick={() => deleteSupplier(s._id)}
                    className="p-1.5 rounded-xl bg-white dark:bg-win-elevated hover:bg-red-50 dark:hover:bg-red-900/40 text-red-400 dark:text-red-400 border border-red-100 dark:border-red-700/50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-4 py-3 space-y-1.5">
                {s.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Phone className="w-3.5 h-3.5 text-gray-300 dark:text-gray-500 flex-shrink-0" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Mail className="w-3.5 h-3.5 text-gray-300 dark:text-gray-500 flex-shrink-0" />
                    <a href={`mailto:${s.email}`} className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors truncate">
                      {s.email}
                    </a>
                  </div>
                )}
                {s.website && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Globe className="w-3.5 h-3.5 text-gray-300 dark:text-gray-500 flex-shrink-0" />
                    <a
                      href={/^https?:\/\//i.test(s.website) ? s.website : `https://${s.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors truncate"
                    >
                      {s.website}
                    </a>
                  </div>
                )}
                {s.notes && (
                  <div className="flex items-start gap-2 text-sm text-gray-400 dark:text-gray-500 pt-1.5 border-t border-gray-50 dark:border-win-border">
                    <StickyNote className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span className="italic">{s.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      {showForm && (
        <SupplierModal
          initialData={editingSupplier}
          onSave={(saved) => {
            saveSupplier(saved);
            setShowForm(false);
            setEditingSupplier(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingSupplier(null);
          }}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <SupplierImportModal
          onClose={() => setShowImport(false)}
          onImport={importSuppliers}
        />
      )}
    </div>
  );
};

export default SupplierList;
