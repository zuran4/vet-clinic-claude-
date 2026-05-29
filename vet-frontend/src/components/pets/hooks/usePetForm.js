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
    owner: initialData?.owner?._id || owner?._id || "",
    name: initialData?.name || "",
    species: initialData?.species || "",
    gender: initialData?.gender || "",
    birthDate: initialData?.birthDate ? initialData.birthDate.split("T")[0] : "",
    microchip: initialData?.microchip || "",
    neutered: initialData?.neutered || false,
    vaccinated: initialData?.vaccinated || false,
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

      // Fallback: αν formData.owner δεν set (π.χ. pre-fill από chip), χρησιμοποίησε owner prop
      const resolvedOwner = formData.owner || owner?._id || owner?.id || "";

      // ✏️ Validation
      if (!resolvedOwner) {
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
        setLoading(true);
        const isEdit = !!(initialData?._id);
        const url = isEdit
          ? `${API_URL}/pets/${initialData._id}`
          : `${API_URL}/pets`;

        const payload = { ...formData, owner: resolvedOwner };
        // sparse unique index αγνοεί null/undefined αλλά ΟΧΙ ""
        if (!payload.microchip) delete payload.microchip;

        const res = await fetch(url, {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          // API επιστρέφει { error: { code, message } }
          const apiCode = errData.error?.code;
          const apiMsg  = errData.error?.message || errData.message;

          if (res.status === 409 && apiCode === "DUPLICATE_KEY") {
            const dupField = Object.keys(errData.details || {})[0];
            const dupMsg = dupField === "microchip"
              ? `Το microchip ήδη υπάρχει στη βάση. Πιθανώς το κατοικίδιο έχει ήδη καταχωρηθεί. Βρες το στη λίστα κατοικιδίων και ενημέρωσε τον ιδιοκτήτη αν χρειαστεί.`
              : (apiMsg || "Υπάρχει ήδη εγγραφή με τα ίδια στοιχεία.");
            throw new Error(dupMsg);
          }

          throw new Error(apiMsg || `Σφάλμα ${res.status}`);
        }
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
        toast.error(`❌ ${err.message || "Αποτυχία αποθήκευσης κατοικιδίου."}`);
      } finally {
        setLoading(false); // ✅ απενεργοποίηση loading
      }
    },
    [formData, initialData, owner, onSaved, onCancel]
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
