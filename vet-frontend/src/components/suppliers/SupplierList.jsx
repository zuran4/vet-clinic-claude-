import React, { useState } from "react";
import { Trash2, Edit, Truck, Phone, Mail, Globe, StickyNote, Search } from "lucide-react";
import SupplierModal from "./SupplierModal.jsx";
import SearchBar from "../ui/SearchBar.jsx";
import { useSuppliers } from "../../hooks/useSuppliers.jsx";

const SupplierList = ({ showForm, setShowForm, editingSupplier, setEditingSupplier }) => {
  const { suppliers, error, saveSupplier, deleteSupplier } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSuppliers = suppliers.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.name?.toLowerCase().includes(term) ||
      s.phone?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.website?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Αναζήτηση (όνομα, τηλέφωνο, email)"
        className="w-full md:w-96"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Empty state */}
      {filteredSuppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 border border-dashed border-gray-200 rounded-2xl">
          <Truck className="w-8 h-8 text-gray-300" />
          <p className="text-sm text-gray-400">Δεν βρέθηκαν προμηθευτές.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSuppliers.map((s) => (
            <div
              key={s._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="font-semibold text-gray-800 truncate">{s.name}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    title="Επεξεργασία"
                    onClick={() => { setEditingSupplier(s); setShowForm(true); }}
                    className="p-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-500 border border-indigo-100 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    title="Διαγραφή"
                    onClick={() => deleteSupplier(s._id)}
                    className="p-1.5 rounded-xl bg-white hover:bg-red-50 text-red-400 border border-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-4 py-3 space-y-1.5">
                {s.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    <a href={`mailto:${s.email}`} className="hover:text-orange-500 transition-colors truncate">
                      {s.email}
                    </a>
                  </div>
                )}
                {s.website && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    <a
                      href={/^https?:\/\//i.test(s.website) ? s.website : `https://${s.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-orange-500 transition-colors truncate"
                    >
                      {s.website}
                    </a>
                  </div>
                )}
                {s.notes && (
                  <div className="flex items-start gap-2 text-sm text-gray-400 pt-1 border-t border-gray-50">
                    <StickyNote className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span className="italic">{s.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
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
    </div>
  );
};

export default SupplierList;
