import React, { useState } from "react";
import {
  PawPrint,
  FileText,
  Printer,
  ClipboardList,
  PlusCircle,
  Pill,
} from "lucide-react";
import { Button } from "../ui/button";
import PrescriptionViewModal from "./PrescriptionViewModal";
import PrescriptionFormModal from "./PrescriptionFormModal";
import dayjs from "dayjs";
import { usePrescriptions } from "../../hooks/usePrescriptions";

const PrescriptionList = () => {
  const { prescriptions, error, addPrescription } = usePrescriptions();
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // 🖨️ Εκτύπωση
  const handlePrint = (prescription) => {
    const printWindow = window.open("", "_blank");
    const html = `
      <html>
        <head>
          <title>Συνταγή - ${prescription.animalName}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h2 { margin-bottom: 10px; }
            ul { margin-top: 0; padding-left: 20px; }
            p, li { font-size: 14px; }
          </style>
        </head>
        <body>
          <h2>Συνταγή</h2>
          <p><strong>Ημερομηνία:</strong> ${dayjs(prescription.date).format(
            "DD/MM/YYYY"
          )}</p>
          <p><strong>Πελάτης:</strong> ${prescription.clientName}</p>
          <p><strong>Ζώο:</strong> ${
            prescription.animalId?.name || prescription.animalName
          }</p>
          <p><strong>Γιατρός:</strong> ${prescription.doctor}</p>
          <p><strong>Φάρμακα:</strong></p>
          <ul>
            ${
              Array.isArray(prescription.medicines)
                ? prescription.medicines.map((m) => `<li>${m}</li>`).join("")
                : ""
            }
          </ul>
          ${
            prescription.instructions
              ? `<p><strong>Οδηγίες:</strong> ${prescription.instructions}</p>`
              : ""
          }
          ${
            prescription.notes
              ? `<p><strong>Σημειώσεις:</strong> ${prescription.notes}</p>`
              : ""
          }
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-4 space-y-5">
      {/* Τίτλος */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
          <ClipboardList className="w-5 h-5 text-primary" />
          Συνταγές
        </h2>
        <Button
          variant="primary"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" /> Νέα Συνταγή
        </Button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {prescriptions.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Δεν υπάρχουν καταχωρημένες συνταγές.
        </p>
      ) : (
        <ul className="space-y-3">
          {prescriptions.map((p) => (
            <li
              key={p._id}
              className="flex items-center justify-between p-4 bg-white rounded-xl border-l-4 border-primary shadow-sm hover:shadow-md transition"
            >
              {/* Πληροφορίες Συνταγής */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <PawPrint className="w-4 h-4 text-primary" />
                  {p.animalId?.name || p.animalName} — {p.clientName}
                </div>
                <div className="text-sm text-gray-500">
                  {dayjs(p.date).format("DD/MM/YYYY")} • {p.doctor}
                </div>
                <div className="text-xs text-gray-700 flex items-center gap-1">
                  <Pill className="w-4 h-4 text-primary" />
                  {Array.isArray(p.medicines)
                    ? p.medicines.join(", ")
                    : "—"}
                </div>
              </div>

              {/* Κουμπιά (μόνο icons) */}
              <div className="flex items-center gap-3">
                <button
                  title="Προβολή Συνταγής"
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                  onClick={() => setSelected(p)}
                >
                  <FileText className="w-5 h-5 text-gray-700" />
                </button>

                <button
                  title="Εκτύπωση"
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                  onClick={() => handlePrint(p)}
                >
                  <Printer className="w-5 h-5 text-emerald-600" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modals */}
      <PrescriptionViewModal
        prescription={selected}
        onClose={() => setSelected(null)}
      />
      <PrescriptionFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={addPrescription}
        pets={[]} // ✅ μελλοντικά περνάμε κατοικίδια από parent
      />
    </div>
  );
};

export default PrescriptionList;
