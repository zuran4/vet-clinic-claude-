// ===============================================
// 📄 usePetForm.js
// Περιγραφή: Custom hook για λογική φόρμας κατοικιδίου (βελτιωμένο)
// ===============================================

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { API_URL } from "../../../config/api.js";

export function usePetForm(initialData, owner, onSaved, onCancel) {
  // -------------------------------------
  // 1️⃣ State
  // -------------------------------------
  const [formData, setFormData] = useState({
    owner: owner?._id || "",
    name: "",
    species: "",
    gender: "",
    birthDate: "",
    microchip: "",
    neutered: false,
    vaccinated: false,
  });

  const [loading, setLoading] = useState(false); // ✅ νέο loading state

  // -------------------------------------
  // 2️⃣ Prefill κατά την επεξεργασία
  // -------------------------------------
  useEffect(() => {
    if (initialData) {
      setFormData({
        owner: initialData.owner?._id || owner?._id || "",
        name: initialData.name || "",
        species: initialData.species || "",
        gender: initialData.gender || "",
        birthDate: initialData.birthDate
          ? initialData.birthDate.split("T")[0]
          : "",
        microchip: initialData.microchip || "",
        neutered: initialData.neutered || false,
        vaccinated: initialData.vaccinated || false,
      });
    }
  }, [initialData, owner]);

  // -------------------------------------
  // 3️⃣ Handlers
  // -------------------------------------
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleSelectOwner = useCallback((ownerId) => {
    setFormData((prev) => ({ ...prev, owner: ownerId }));
  }, []);

  // -------------------------------------
  // 4️⃣ Υποβολή φόρμας
  // -------------------------------------
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // ✏️ Validation
      if (!formData.owner) {
        toast.error("⚠️ Ο ιδιοκτήτης είναι υποχρεωτικός.");
        return;
      }
      if (!formData.name.trim()) {
        toast.error("⚠️ Το όνομα του κατοικιδίου είναι υποχρεωτικό.");
        return;
      }
      if (!formData.species) {
        toast.error("⚠️ Το είδος είναι υποχρεωτικό.");
        return;
      }
      if (!formData.gender) {
        toast.error("⚠️ Το φύλο είναι υποχρεωτικό.");
        return;
      }

      try {
        setLoading(true); // ✅ ενεργοποίηση loading
        const isEdit = !!initialData;
        const url = isEdit
          ? `${API_URL}/pets/${initialData._id}`
          : `${API_URL}/pets`;

        const res = await fetch(url, {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!res.ok) throw new Error("Αποτυχία αποθήκευσης");
        const saved = await res.json();

        toast.success(
          isEdit
            ? "✅ Οι αλλαγές αποθηκεύτηκαν!"
            : "✅ Το κατοικίδιο δημιουργήθηκε!"
        );

        onSaved?.(saved);
        onCancel();
      } catch (err) {
        console.error("❌ Σφάλμα αποθήκευσης κατοικιδίου:", err);
        toast.error("❌ Αποτυχία αποθήκευσης κατοικιδίου.");
      } finally {
        setLoading(false); // ✅ απενεργοποίηση loading
      }
    },
    [formData, initialData, onSaved, onCancel]
  );

  // -------------------------------------
  // 5️⃣ Επιστρέφουμε handlers & state
  // -------------------------------------
  return {
    formData,
    handleChange,
    handleSelectOwner,
    handleSubmit,
    loading, // ✅ προστέθηκε στο return
  };
}
