import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  FileText,
  PawPrint,
  Pill,
  Syringe,
  User,
  StickyNote,
  Plus,
} from "lucide-react";

const PrescriptionModal = ({ isOpen, onClose, onSubmit, initialData, pets = [] }) => {
  const [form, setForm] = useState({
    animalId: "",
    animalName: "",
    medicines: [""],
    dosage: "",
    notes: "",
    doctor: "",
  });

  // Αν φορτωθούν αρχικά δεδομένα (π.χ. επεξεργασία)
  useEffect(() => {
    if (initialData) {
      setForm({
        animalId: initialData.animalId || "",
        animalName: initialData.animalName || "",
        medicines: initialData.medicines?.length ? initialData.medicines : [""],
        dosage: initialData.dosage || "",
        notes: initialData.notes || "",
        doctor: initialData.doctor || "",
      });
    }
  }, [initialData]);

  // Υποβολή
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      medicines: form.medicines.filter((m) => m.trim() !== ""), // καθαρισμός
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg">
        {/* Τίτλος */}
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-700">
          <FileText className="w-5 h-5 text-primary" />
          Νέα Συνταγή
        </h3>

        {/* Φόρμα */}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Ζώο (dropdown) */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 font-medium text-gray-600">
              <PawPrint className="w-4 h-4 text-gray-500" />
              Ζώο
            </label>
            <select
              name="animalId"
              value={form.animalId}
              onChange={(e) => {
                const selected = pets.find((p) => p._id === e.target.value);
                setForm((prev) => ({
                  ...prev,
                  animalId: selected?._id || "",
                  animalName: selected?.name || "",
                }));
              }}
              className="w-full border p-2 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">-- Επιλογή ζώου --</option>
              {pets.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Φάρμακα (δυναμική λίστα) */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 font-medium text-gray-600">
              <Pill className="w-4 h-4 text-gray-500" />
              Φάρμακα
            </label>
            {form.medicines.map((m, idx) => (
              <input
                key={idx}
                type="text"
                value={m}
                onChange={(e) => {
                  const newMeds = [...form.medicines];
                  newMeds[idx] = e.target.value;
                  setForm((prev) => ({ ...prev, medicines: newMeds }));
                }}
                className="w-full border p-2 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary mb-2"
                placeholder={`Φάρμακο #${idx + 1}`}
                required
              />
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  medicines: [...prev.medicines, ""],
                }))
              }
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Προσθήκη Φαρμάκου
            </Button>
          </div>

          {/* Δοσολογία */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 font-medium text-gray-600">
              <Syringe className="w-4 h-4 text-gray-500" />
              Δοσολογία
            </label>
            <input
              type="text"
              name="dosage"
              value={form.dosage}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, dosage: e.target.value }))
              }
              className="w-full border p-2 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary"
              placeholder="Π.χ. 2x την ημέρα"
              required
            />
          </div>

          {/* Σημειώσεις */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 font-medium text-gray-600">
              <StickyNote className="w-4 h-4 text-gray-500" />
              Σημειώσεις
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full border p-2 rounded-2xl shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-primary"
              placeholder="Προαιρετικές οδηγίες"
              rows={3}
            />
          </div>

          {/* Γιατρός */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 font-medium text-gray-600">
              <User className="w-4 h-4 text-gray-500" />
              Γιατρός
            </label>
            <input
              type="text"
              name="doctor"
              value={form.doctor}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, doctor: e.target.value }))
              }
              className="w-full border p-2 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary"
              placeholder="Όνομα γιατρού"
              required
            />
          </div>

          {/* Κουμπιά */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Ακύρωση
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex items-center gap-2"
            >
              Αποθήκευση
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionModal;
