import { useState, useEffect } from "react";
import { API_URL } from "../api/api.js"; // ✅ κεντρικό API base

const API = `${API_URL}/suppliers`;

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState("");

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Αποτυχία φόρτωσης προμηθευτών");
      const data = await res.json();
      setSuppliers(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const saveSupplier = async (supplier) => {
    const isEdit = !!supplier._id;
    try {
      const res = await fetch(
        `${API}${isEdit ? `/${supplier._id}` : ""}`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(supplier),
        }
      );

      if (!res.ok) throw new Error("Αποτυχία αποθήκευσης");

      const saved = await res.json();

      setSuppliers((prev) =>
        isEdit
          ? prev.map((s) => (s._id === saved._id ? saved : s))
          : [...prev, saved]
      );

      return saved;
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteSupplier = async (id) => {
    if (!window.confirm("Θες σίγουρα να διαγράψεις τον προμηθευτή;")) return;

    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Αποτυχία διαγραφής");
      setSuppliers((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return { suppliers, error, fetchSuppliers, saveSupplier, deleteSupplier };
}
