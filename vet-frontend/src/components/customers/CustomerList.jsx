// ===============================================
// 📄 CustomerList.jsx
// Περιγραφή: Προβολή πελατών με backend αναζήτηση, pagination και modals
// ===============================================

import React, { useState } from "react";
import { Plus, Upload } from "lucide-react";
import { Button } from "../ui/button";
import CustomerCard from "./CustomerCard.jsx";
import CustomerProfileModal from "./CustomerProfileModal.jsx";
import CustomerModal from "./CustomerModal.jsx";
import CustomerImportModal from "./CustomerImportModal.jsx";
import CustomerPurchasesModal from "./CustomerPurchasesModal.jsx";
import { useCustomers } from "../../hooks/useCustomers.jsx";
import SearchBar from "../ui/SearchBar.jsx";
import PetModal from "../pets/PetModal.jsx";

const CustomerList = () => {
  // -------------------------------------
  // 1️⃣ Custom hook (φόρτωση / ενέργειες πελατών)
  // -------------------------------------
  const {
  customers,
  error,
  loading,
  saveCustomer,
  deleteCustomer,
  importCustomers,
  page,
  setPage,
  total,
  searchTerm,
  setSearchTerm,
} = useCustomers();


  // -------------------------------------
  // 2️⃣ Τοπικά states για modals & UI
  // -------------------------------------
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer]     = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [showPurchasesModal, setShowPurchasesModal] = useState(false);
  const [showPetModal, setShowPetModal]           = useState(false);
  const [selectedCustomer, setSelectedCustomer]   = useState(null);
  const [showImportModal, setShowImportModal]     = useState(false);
  const [viewingCustomer, setViewingCustomer]     = useState(null);

  // -------------------------------------
  // 3️⃣ Οι πελάτες έρχονται ήδη φιλτραρισμένοι από το backend
  // -------------------------------------
  const filteredCustomers = customers;

  // -------------------------------------
  // 4️⃣ JSX
  // -------------------------------------
  return (
    <div className="space-y-6">
      {/* Εμφάνιση σφάλματος */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Αναζήτηση + Κουμπιά */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-2">
        <SearchBar
          value={searchTerm}
          onChange={(val) => { setSearchTerm(val); setPage(1); }}
          placeholder="Αναζήτηση (όνομα, τηλέφωνο, email)"
          className="flex-1"
        />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => { setEditingCustomer(null); setShowCustomerModal(true); }}
            className="sm:hidden flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold shadow-sm active:scale-95 transition"
          >
            <Plus className="w-4 h-4" /> Νέος Πελάτης
          </button>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            title="Εισαγωγή πελατών από CSV"
            aria-label="Εισαγωγή CSV"
            className="inline-flex items-center justify-center gap-2 w-10 h-10 sm:w-auto sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl text-sm font-medium shadow-sm border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700 dark:hover:bg-indigo-900/60 active:scale-95 transition"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Εισαγωγή CSV</span>
          </button>
          <button
            type="button"
            onClick={() => { setEditingCustomer(null); setShowCustomerModal(true); }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold shadow-sm active:scale-95 transition"
          >
            <Plus className="w-4 h-4" /> Νέος Πελάτης
          </button>
        </div>
      </div>

      {/* Λίστα Πελατών */}
      {/* Λίστα Πελατών */}
<ul className="space-y-3">
  {loading ? (
    // ✨ Skeletons loading placeholders
    Array.from({ length: 4 }).map((_, i) => (
      <li
  key={i}
  className="p-4 bg-gray-100 dark:bg-win-elevated rounded-2xl animate-pulse h-[110px]"
>
  <div className="flex items-center justify-between gap-3 h-full">
    <div className="flex flex-col gap-2 w-full">
      <div className="h-4 bg-gray-300 dark:bg-win-elevated2 rounded w-1/3"></div>
      <div className="h-3 bg-gray-200 dark:bg-win-elevated2/70 rounded w-2/3"></div>
      <div className="h-3 bg-gray-200 dark:bg-win-elevated2/70 rounded w-1/4"></div>
    </div>
    <div className="h-6 w-6 bg-gray-300 dark:bg-win-elevated2 rounded-full"></div>
  </div>
</li>
    ))
  ) : filteredCustomers.length === 0 ? (
    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
      Δεν βρέθηκαν πελάτες.
    </p>
  ) : (
    filteredCustomers.map((c) => (
      <CustomerCard
        key={c._id}
        customer={c}
        onEdit={(cust) => {
          setEditingCustomer(cust);
          setShowCustomerModal(true);
        }}
        onDelete={(id) => deleteCustomer(id)}
        onPurchases={(id) => {
          setSelectedCustomerId(id);
          setShowPurchasesModal(true);
        }}
        onAddPet={(cust) => {
          setSelectedCustomer(cust);
          setShowPetModal(true);
        }}
        onView={(cust) => setViewingCustomer(cust)}
      />
    ))
  )}
</ul>


      {/* Pagination */}
      {total > 9 && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-win-border">
          <Button
            variant="ghost"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            ← Προηγούμενη
          </Button>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Σελίδα <span className="font-semibold text-gray-600 dark:text-gray-300">{page}</span> από {Math.ceil(total / 9)}
          </span>
          <Button
            variant="ghost"
            onClick={() => setPage((p) => p < Math.ceil(total / 9) ? p + 1 : p)}
            disabled={page >= Math.ceil(total / 9)}
          >
            Επόμενη →
          </Button>
        </div>
      )}

      {/* ----------------------------
           Modals
      ---------------------------- */}

      {/* Προφίλ Πελάτη */}
      {viewingCustomer && (
        <CustomerProfileModal
          customer={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
          onEdit={(cust) => {
            setViewingCustomer(null);
            setEditingCustomer(cust);
            setShowCustomerModal(true);
          }}
          onPurchases={(id) => {
            setSelectedCustomerId(id);
            setShowPurchasesModal(true);
          }}
        />
      )}

      {/* Modal Πελάτη */}
      {showCustomerModal && (
        <CustomerModal
          initialData={editingCustomer}
          onSaved={(saved) => {
            saveCustomer(saved, editingCustomer);
            setShowCustomerModal(false);
            setEditingCustomer(null);
          }}
          onCancel={() => {
            setShowCustomerModal(false);
            setEditingCustomer(null);
          }}
        />
      )}

      {/* Modal Αγορών */}
      {showPurchasesModal && (
        <CustomerPurchasesModal
          isOpen={showPurchasesModal}
          onClose={() => {
            setShowPurchasesModal(false);
            setSelectedCustomerId(null);
          }}
          customerId={selectedCustomerId}
          lockScroll={!viewingCustomer}
        />
      )}

      {/* Modal Κατοικιδίου */}
      {showPetModal && (
        <PetModal
          owner={selectedCustomer}
          onCancel={() => { setShowPetModal(false); setSelectedCustomer(null); }}
          onSaved={() => { setShowPetModal(false); setSelectedCustomer(null); }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <CustomerImportModal
          onClose={() => setShowImportModal(false)}
          onImport={importCustomers}
        />
      )}
    </div>
  );
};

export default CustomerList;
