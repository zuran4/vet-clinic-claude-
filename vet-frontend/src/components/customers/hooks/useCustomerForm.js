// ===============================================
// 📄 useCustomerForm.js
// Περιγραφή: Custom hook για τη φόρμα πελάτη
// ===============================================

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { API_URL } from "../../../config/api.js";
import reportClientEvent from "../../../utils/reportClientEvent.js";

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
      email: false,
      sms: true,
      reminders: true,
      promotions: true,
    },
    isNewCustomer: false,
  });

  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("Σκύλος");
  const [petGender, setPetGender] = useState("Αρσενικό");

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
    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      // Η ειδοποίηση Email εξαρτάται από την ύπαρξη email: απενεργοποιείται
      // αυτόματα όταν αδειάζει το πεδίο, ενεργοποιείται αυτόματα τη στιγμή
      // που συμπληρώνεται (χωρίς να ξαναπειράζεται σε κάθε keystroke μετά).
      if (name === "email") {
        const hadEmail = prev.email.trim().length > 0;
        const hasEmail = value.trim().length > 0;
        if (!hasEmail) {
          next.notifications = { ...prev.notifications, email: false };
        } else if (!hadEmail) {
          next.notifications = { ...prev.notifications, email: true };
        }
      }

      return next;
    });
  }, []);

  const handleNotificationChange = useCallback((e) => {
    const { name, checked } = e.target;
    setFormData((prev) => {
      if (name === "email" && !prev.email.trim()) return prev; // δεν ενεργοποιείται χωρίς email
      return { ...prev, notifications: { ...prev.notifications, [name]: checked } };
    });
  }, []);

  const handleIsNewCustomerChange = useCallback((e) => {
    const { checked } = e.target;
    setFormData((prev) => ({ ...prev, isNewCustomer: checked }));
  }, []);

  // -------------------------------------
  // 4️⃣ Υποβολή φόρμας
  // -------------------------------------
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const isEdit = !!(initialData?._id);

      if (!formData.name.trim()) {
        toast.error("⚠️ Το όνομα είναι υποχρεωτικό.");
        return;
      }
      if (!isEdit && !petName.trim()) {
        toast.error("⚠️ Το όνομα κατοικιδίου είναι υποχρεωτικό.");
        return;
      }

      try {
        setLoading(true);

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

        // Ο πελάτης έχει ήδη δημιουργηθεί σε αυτό το σημείο· αν αποτύχει μόνο
        // το κατοικίδιο (π.χ. δικτυακό σφάλμα), δεν τον ξαναχάνουμε — απλά
        // ειδοποιούμε να προστεθεί χειροκίνητα.
        if (!isEdit && petName.trim()) {
          try {
            await fetch(`${API_URL}/pets`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                owner: customerData._id,
                name: petName.trim(),
                species: petSpecies,
                gender: petGender,
              }),
            });
          } catch (err) {
            toast.error("Ο πελάτης δημιουργήθηκε, αλλά το κατοικίδιο απέτυχε. Πρόσθεσέ το χειροκίνητα.");
            reportClientEvent({ message: err?.message || "Αποτυχία δημιουργίας κατοικιδίου μετά από νέο πελάτη", type: "pet_create_failed", level: "warning" });
          }
        }

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
        toast.error(err?.message ? `❌ ${err.message}` : "❌ Αποτυχία αποθήκευσης πελάτη.");
        reportClientEvent({ message: err?.message || "Αποτυχία αποθήκευσης πελάτη", type: "customer_save_failed", level: "warning" });
      } finally {
        setLoading(false);
      }
    },
    [formData, initialData, onSaved, petName, petSpecies, petGender]
  );

  // -------------------------------------
  // 5️⃣ Επιστρέφουμε state & handlers
  // -------------------------------------
  return {
    formData,
    loading,
    handleChange,
    handleNotificationChange,
    handleIsNewCustomerChange,
    handleSubmit,
    petName,
    setPetName,
    petSpecies,
    setPetSpecies,
    petGender,
    setPetGender,
  };
}
