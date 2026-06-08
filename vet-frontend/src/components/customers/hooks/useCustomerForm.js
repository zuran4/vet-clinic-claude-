// ===============================================
// 📄 useCustomerForm.js
// Περιγραφή: Custom hook για τη φόρμα πελάτη
// ===============================================

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { API_URL } from "../../../config/api.js";

export function useCustomerForm(initialData, onSaved, onCancel) {
  // -------------------------------------
  // 1️⃣ State
  // -------------------------------------
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    afm: "",
    notes: "",
    notifications: {
      email: true,
      sms: false,
      reminders: true,
      promotions: false,
    },
  });

  const [loading, setLoading] = useState(false);

  // -------------------------------------
  // 2️⃣ Prefill κατά την επεξεργασία
  // -------------------------------------
  useEffect(() => {
    if (initialData) {
      setFormData({
        _id: initialData._id || null,
        name: initialData.name || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        address: initialData.address || "",
        city: initialData.city || "",
        afm: initialData.afm || "",
        notes: initialData.notes || "",
        notifications: initialData.notifications || {
          email: true,
          sms: false,
          reminders: true,
          promotions: false,
        },
      });
    }
  }, [initialData]);

  // -------------------------------------
  // 3️⃣ Handlers αλλαγών
  // -------------------------------------
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleNotificationChange = useCallback((e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [name]: checked },
    }));
  }, []);

  // -------------------------------------
  // 4️⃣ Υποβολή φόρμας
  // -------------------------------------
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!formData.name.trim()) {
        toast.error("⚠️ Το όνομα είναι υποχρεωτικό.");
        return;
      }

      try {
        setLoading(true);

        const isEdit = !!(initialData?._id);
        const url = isEdit
          ? `${API_URL}/customers/${initialData._id}`
          : `${API_URL}/customers`;

        const payload = { ...formData };
        delete payload._id; // _id in URL for edits, auto-generated for creates

        const res = await fetch(url, {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Αποτυχία αποθήκευσης");
        const saved = await res.json();

        const customerData = saved.customer || saved;

        toast.success(
          isEdit
            ? "✅ Οι αλλαγές αποθηκεύτηκαν!"
            : "✅ Ο πελάτης δημιουργήθηκε!"
        );

        // ✅ Ενημερώνουμε τον γονέα (π.χ. CustomerList)
        onSaved?.(customerData);

        console.log("✅ saved customer:", customerData);
      } catch (err) {
        console.error("❌ Σφάλμα αποθήκευσης πελάτη:", err);
        toast.error("❌ Αποτυχία αποθήκευσης πελάτη.");
      } finally {
        setLoading(false);
      }
    },
    [formData, initialData, onSaved]
  );

  // -------------------------------------
  // 5️⃣ Επιστρέφουμε state & handlers
  // -------------------------------------
  return {
    formData,
    loading,
    handleChange,
    handleNotificationChange,
    handleSubmit,
  };
}
