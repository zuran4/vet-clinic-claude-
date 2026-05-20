import { useState, useEffect } from "react";
import request from "../api/apiClient.js"; // ✅ κεντρικός API client

export function useCustomerPets(ownerId) {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPets = async () => {
      if (!ownerId) {
        setPets([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        // 🔁 Αντί για fetch("http://localhost:5000/api/customers/...")
        const data = await request(`/customers/${ownerId}`);

        setPets(data.pets || []);
      } catch (err) {
        console.error("❌ Σφάλμα φόρτωσης κατοικιδίων:", err);
        setPets([]);
        setError("Αποτυχία φόρτωσης κατοικιδίων");
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [ownerId]);

  return { pets, loading, error };
}
