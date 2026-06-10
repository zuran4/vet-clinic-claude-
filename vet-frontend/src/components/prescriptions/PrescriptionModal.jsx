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

const INPUT = "w-full border border-gray-200 dark:border-win-border-light p-2 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";
const LABEL = "flex items-center gap-2 font-medium text-gray-600 dark:text-gray-300";
const ICON = "w-4 h-4 text-gray-500 dark:text-gray-400";

const PrescriptionModal = ({ isOpen, onClose, onSubmit, initialData, pets = [] }) => {
  const [form, setForm] = useState({
    animalId: "",
    animalName: "",
    medicines: [""],
    dosage: "",
    notes: "",
    doctor: "",
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      medicines: form.medicines.filter((m) => m.trim() !== ""),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-win-surface p-6 rounded-2xl shadow-xl w-full max-w-lg">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-700 dark:text-gray-100">
          <FileText className="w-5 h-5 text-primary" />
          Νέα Συνταγή
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Ζώο */}
          <div className="flex flex-col gap-1">
            <label className={LABEL}>
              <PawPrint className={ICON} />
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
              className={INPUT}
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

          {/* Φάρμακα */}
          <div className="flex flex-col gap-1">
            <label className={LABEL}>
              <Pill className={ICON} />
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
                className={`${INPUT} mb-2`}
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
            <label className={LABEL}>
              <Syringe className={ICON} />
              Δοσολογία
            </label>
            <input
              type="text"
              name="dosage"
              value={form.dosage}
              onChange={(e) => setForm((prev) => ({ ...prev, dosage: e.target.value }))}
              className={INPUT}
              placeholder="Π.χ. 2x την ημέρα"
              required
            />
          </div>

          {/* Σημειώσεις */}
          <div className="flex flex-col gap-1">
            <label className={LABEL}>
              <StickyNote className={ICON} />
              Σημειώσεις
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              className={INPUT}
              placeholder="Προαιρετικές οδηγίες"
              rows={3}
            />
          </div>

          {/* Γιατρός */}
          <div className="flex flex-col gap-1">
            <label className={LABEL}>
              <User className={ICON} />
              Γιατρός
            </label>
            <input
              type="text"
              name="doctor"
              value={form.doctor}
              onChange={(e) => setForm((prev) => ({ ...prev, doctor: e.target.value }))}
              className={INPUT}
              placeholder="Όνομα γιατρού"
              required
            />
          </div>

          {/* Κουμπιά */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Ακύρωση
            </Button>
            <Button type="submit" variant="primary" className="flex items-center gap-2">
              Αποθήκευση
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionModal;
