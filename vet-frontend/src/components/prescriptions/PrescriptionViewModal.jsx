import React from "react";
import { FileText, X } from "lucide-react";
import { Button } from "../ui/button";

const PrescriptionViewModal = ({ prescription, onClose }) => {
  if (!prescription) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" /> Αναλυτική Συνταγή
        </h3>

        <div className="space-y-2 text-sm">
          <p>
            <strong>Ημερομηνία:</strong> {prescription.date}
          </p>
          <p>
            <strong>Πελάτης:</strong> {prescription.clientName}
          </p>
          <p>
            <strong>Ζώο:</strong> {prescription.animalName}
          </p>
          <p>
            <strong>Γιατρός:</strong> {prescription.doctor}
          </p>

          <div>
            <strong>Φάρμακα:</strong>
            <ul className="list-disc ml-5">
              {Array.isArray(prescription.medicines) &&
                prescription.medicines.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>

          {prescription.instructions && (
            <p>
              <strong>Οδηγίες:</strong> {prescription.instructions}
            </p>
          )}
          {prescription.notes && (
            <p>
              <strong>Σημειώσεις:</strong> {prescription.notes}
            </p>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="secondary" onClick={onClose}>
            <X className="w-4 h-4" /> Κλείσιμο
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionViewModal;
