import React, { useState, useEffect } from "react";
import { FilePlus, X, Save } from "lucide-react";
import { Button } from "../ui/button";

const PrescriptionFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState({
    animalName: "",
    medicines: [],
    dosage: "",
    notes: "",
    doctor: "",
  });

  // Φόρτωση αρχικών δεδομένων αν υπάρχει επεξεργασία
  useEffect(() => {
    if (initialData) {
      setForm({
        animalName: initialData.animalName || "",
        medicines: initialData.medicines || [],
        dosage: initialData.dosage || "",
        notes: initialData.notes || "",
        doctor: initialData.doctor || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMedicineChange = (e) => {
    setForm((prev) => ({
      ...prev,
      medicines: e.target.value.split(",").map((m) => m.trim()),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FilePlus className="w-5 h-5" /> Νέα Συνταγή
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <input
            type="text"
            name="animalName"
            placeholder="Όνομα ζώου"
            value={form.animalName}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />

          <input
            type="text"
            name="medicines"
            placeholder="Φάρμακα (χωρισμένα με κόμμα)"
            value={form.medicines.join(", ")}
            onChange={handleMedicineChange}
            className="w-full border p-2 rounded"
            required
          />

          <input
            type="text"
            name="dosage"
            placeholder="Δοσολογία"
            value={form.dosage}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <textarea
            name="notes"
            placeholder="Σημειώσεις"
            value={form.notes}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            type="text"
            name="doctor"
            placeholder="Γιατρός"
            value={form.doctor}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" type="button" onClick={onClose}>
              <X className="w-4 h-4" /> Ακύρωση
            </Button>
            <Button variant="primary" type="submit">
              <Save className="w-4 h-4" /> Αποθήκευση
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionFormModal;
