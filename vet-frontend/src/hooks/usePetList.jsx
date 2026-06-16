import { useState, useEffect } from "react";
import request from "../api/apiClient.js"; // ✅ κεντρικός API client

export function usePetList() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Φόρτωση κατοικιδίων
  const fetchPets = async () => {
    try {
      setLoading(true);
      setError(null);

      // 👉 αντί για fetch("http://localhost:5000/api/pets")
      const data = await request("/pets");
      setPets(data);
    } catch (err) {
      console.error("❌ Σφάλμα φόρτωσης κατοικιδίων:", err);
      setError(err.message || "Αποτυχία φόρτωσης κατοικιδίων");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Διαγραφή
  const deletePet = async (id) => {
    try {
      // 👉 DELETE μέσω apiClient
      await request(`/pets/${id}`, { method: "DELETE" });
      setPets((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("❌ Σφάλμα διαγραφής κατοικιδίου:", err);
      setError(err.message || "Αποτυχία διαγραφής κατοικιδίου");
    }
  };

  // 🔹 Αποθήκευση (edit ή νέο)
  const savePet = (pet, editingPet) => {
    if (editingPet) {
      setPets((prev) => prev.map((p) => (p._id === pet._id ? pet : p)));
    } else {
      setPets((prev) => [pet, ...prev]);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  return { pets, loading, error, fetchPets, deletePet, savePet };
}
