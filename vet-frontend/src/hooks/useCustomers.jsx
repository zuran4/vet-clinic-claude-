// ===============================================
// 📄 useCustomers.jsx
// Περιγραφή: Custom hook για φόρτωση πελατών με pagination, αναζήτηση & pets
// ===============================================

import { useState, useEffect } from "react";
import customersApi from "../api/customersApi";
import petsApi from "../api/petsApi";

export function useCustomers() {
  // -------------------------------------
  // 1️⃣ States
  // -------------------------------------
  const [customers, setCustomers] = useState([]);
  const [petsByCustomer, setPetsByCustomer] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✨ νέο state για skeleton loading
  const [page, setPage] = useState(1);       // τρέχουσα σελίδα
  const [total, setTotal] = useState(0);     // συνολικός αριθμός πελατών
  const [searchTerm, setSearchTerm] = useState(""); // όρος αναζήτησης
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm); // debounce delay
  const pageSize = 9;                        // 9 πελάτες ανά σελίδα

  // -------------------------------------
  // 2️⃣ Debounce μηχανισμός (περιμένει 300ms πριν ψάξει)
  // -------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // -------------------------------------
  // 3️⃣ Φόρτωση πελατών (με pagination & search)
  // -------------------------------------
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const result = await customersApi.getAllCustomers(page, pageSize, debouncedSearch);

      // Το API επιστρέφει array σε search mode, αντικείμενο {data, total} σε pagination mode
      const customerList = Array.isArray(result) ? result : (result.data ?? []);
      const totalCount = Array.isArray(result) ? result.length : (result.total ?? 0);

      setCustomers(customerList);
      setTotal(totalCount);

      customerList.forEach((customer) => {
        fetchPets(customer._id);
      });
    } catch (err) {
      console.error("❌ Σφάλμα φόρτωσης πελατών:", err);
      setError("Αποτυχία φόρτωσης πελατών.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------
  // 4️⃣ Φόρτωση κατοικιδίων ανά πελάτη
  // -------------------------------------
  const fetchPets = async (customerId) => {
    try {
      const pets = await petsApi.getPetsByOwner(customerId);
      setPetsByCustomer((prev) => ({ ...prev, [customerId]: pets }));
    } catch (err) {
      console.error("❌ Σφάλμα φόρτωσης κατοικιδίων:", err);
    }
  };

  // -------------------------------------
  // 5️⃣ Αποθήκευση / Ενημέρωση πελάτη (τοπικά)
  // -------------------------------------
  const saveCustomer = (saved, editingCustomer) => {
    if (editingCustomer) {
      setCustomers((prev) =>
        prev.map((c) => (c._id === saved._id ? saved : c))
      );
    } else {
      setCustomers((prev) => [saved, ...prev]);
      fetchPets(saved._id);
    }
  };

  // -------------------------------------
  // 6️⃣ Διαγραφή πελάτη
  // -------------------------------------
  const deleteCustomer = async (id) => {
    const confirmDelete = window.confirm(
      "❗ Είσαι σίγουρος ότι θέλεις να διαγράψεις αυτόν τον πελάτη;"
    );
    if (!confirmDelete) return;

    try {
      await customersApi.deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c._id !== id));
      setPetsByCustomer((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err) {
      console.error("❌ Σφάλμα διαγραφής πελάτη:", err);
      setError("Αποτυχία διαγραφής πελάτη.");
    }
  };

  // -------------------------------------
  // 7️⃣ CRUD για κατοικίδια
  // -------------------------------------
  const addPet = async (newPet, ownerId) => {
    try {
      const pet = await petsApi.createPet({ ...newPet, owner: ownerId });
      setPetsByCustomer((prev) => ({
        ...prev,
        [ownerId]: [...(prev[ownerId] || []), pet],
      }));
    } catch (err) {
      console.error("❌ Σφάλμα αποθήκευσης κατοικιδίου:", err);
      setError("Αποτυχία αποθήκευσης κατοικιδίου.");
    }
  };

  const updatePet = async (updatedPet, ownerId) => {
    try {
      const pet = await petsApi.updatePet(updatedPet._id, updatedPet);
      setPetsByCustomer((prev) => ({
        ...prev,
        [ownerId]: prev[ownerId].map((p) => (p._id === pet._id ? pet : p)),
      }));
    } catch (err) {
      console.error("❌ Σφάλμα ενημέρωσης κατοικιδίου:", err);
      setError("Αποτυχία ενημέρωσης κατοικιδίου.");
    }
  };

  const deletePet = async (petId, ownerId) => {
    try {
      await petsApi.deletePet(petId);
      setPetsByCustomer((prev) => ({
        ...prev,
        [ownerId]: prev[ownerId].filter((p) => p._id !== petId),
      }));
    } catch (err) {
      console.error("❌ Σφάλμα διαγραφής κατοικιδίου:", err);
      setError("Αποτυχία διαγραφής κατοικιδίου.");
    }
  };

  // -------------------------------------
  // 8️⃣ Αυτόματη φόρτωση σε κάθε αλλαγή σελίδας ή αναζήτησης
  // -------------------------------------
  useEffect(() => {
    fetchCustomers();
  }, [page, debouncedSearch]);

  // -------------------------------------
  // 9️⃣ Επιστρέφουμε όλα τα states & handlers
  // -------------------------------------
  return {
  customers,
  petsByCustomer,
  error,
  loading, // ✨ νέο state
  total,
  page,
  setPage,
  searchTerm,
  setSearchTerm,
  fetchCustomers,
  fetchPets,
  saveCustomer,
  deleteCustomer,
  addPet,
  updatePet,
  deletePet,
};

}
