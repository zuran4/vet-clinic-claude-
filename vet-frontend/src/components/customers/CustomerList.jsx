// ===============================================
// 📄 CustomerList.jsx
// Περιγραφή: Προβολή πελατών με backend αναζήτηση, pagination και modals
// ===============================================

import React, { useState } from "react";
import { Plus, Upload } from "lucide-react";
import { Button } from "../ui/button";
import CustomerCard from "./CustomerCard.jsx";
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
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowImportModal(true)}
          >
            <Upload className="w-4 h-4" /> Εισαγωγή CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => { setEditingCustomer(null); setShowCustomerModal(true); }}
          >
            <Plus className="w-4 h-4" /> Νέος Πελάτης
          </Button>
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
  className="p-4 bg-gray-100 rounded-2xl animate-pulse h-[110px]"
>
  <div className="flex items-center justify-between gap-3 h-full">
    <div className="flex flex-col gap-2 w-full">
      <div className="h-4 bg-gray-300 rounded w-1/3"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
    </div>
    <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
  </div>
</li>
    ))
  ) : filteredCustomers.length === 0 ? (
    <p className="text-sm text-gray-500 text-center py-4">
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
      />
    ))
  )}
</ul>


      {/* Pagination */}
      {total > 9 && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            ← Προηγούμενη
          </Button>
          <span className="text-xs text-gray-400">
            Σελίδα <span className="font-semibold text-gray-600">{page}</span> από {Math.ceil(total / 9)}
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
