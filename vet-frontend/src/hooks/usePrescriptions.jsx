import { useState, useEffect } from "react";
import request from "../api/apiClient.js"; // ✅ κεντρικός API client
import { useRealtimeSync } from "./useRealtimeSync.jsx";

export function usePrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [error, setError] = useState("");

  // 🔹 Φόρτωση συνταγών
  const fetchPrescriptions = async () => {
    try {
      setError("");
      // αντί για fetch("http://localhost:5000/api/prescriptions")
      const data = await request("/prescriptions");
      setPrescriptions(data);
    } catch (err) {
      console.error("❌ Σφάλμα φόρτωσης συνταγών:", err);
      setError(err.message || "Αποτυχία φόρτωσης συνταγών");
    }
  };

  // 🔹 Προσθήκη συνταγής
  const addPrescription = async (newPrescription) => {
    try {
      setError("");
      await request("/prescriptions", {
        method: "POST",
        body: newPrescription,
      });
      // ✅ Ξαναφορτώνουμε για να πάρουμε populate version
      await fetchPrescriptions();
    } catch (err) {
      console.error("❌ Σφάλμα αποθήκευσης συνταγής:", err);
      setError(err.message || "Αποτυχία αποθήκευσης συνταγής");
      throw err; // ο caller (η φόρμα) πρέπει να ξέρει ότι απέτυχε, ώστε να ΜΗΝ κλείσει σαν να πέτυχε
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  // 🔹 Real-time ενημέρωση όταν προστίθεται συνταγή από άλλη συσκευή
  useRealtimeSync({ prescriptions: fetchPrescriptions });

  return { prescriptions, error, addPrescription, fetchPrescriptions };
}
