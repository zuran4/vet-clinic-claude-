// ===============================================
// 📄 PetModal.jsx
// Περιγραφή: Wrapper Modal για PetForm (UI shell)
// ===============================================

import React from "react";
import Modal from "../ui/Modal.jsx";
import { PawPrint } from "lucide-react";
import PetForm from "./PetForm.jsx";

const PetModal = ({ initialData, onSaved, onCancel, owner }) => {
  return (
    <Modal isOpen={true} onClose={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full">
        {/* Επικεφαλίδα */}
        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
          <PawPrint className="w-5 h-5 text-purple-500" />
          {initialData ? "Επεξεργασία Κατοικιδίου" : "Νέο Κατοικίδιο"}
        </h2>

        {/* Περιεχόμενο φόρμας */}
        <PetForm
          initialData={initialData}
          owner={owner}
          onSaved={onSaved}
          onCancel={onCancel}
        />
      </div>
    </Modal>
  );
};

export default PetModal;
