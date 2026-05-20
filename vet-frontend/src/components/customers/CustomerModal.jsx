// ===============================================
// 📄 CustomerModal.jsx
// Περιγραφή: Modal wrapper για φόρμα πελάτη (refactor)
// ===============================================

import React from "react";
import { User } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import CustomerForm from "./CustomerForm.jsx";

const CustomerModal = ({ initialData, onSaved, onCancel }) => {
  return (
    <Modal isOpen={true} onClose={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-[90vw] md:max-w-[800px] mx-auto">
        {/* Επικεφαλίδα */}
        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-purple-500" />
          {initialData ? "Επεξεργασία Πελάτη" : "Νέος Πελάτης"}
        </h2>

        {/* Φόρμα πελάτη */}
        <CustomerForm
          initialData={initialData}
          onSaved={onSaved}
          onCancel={onCancel}
        />
      </div>
    </Modal>
  );
};

export default CustomerModal;
