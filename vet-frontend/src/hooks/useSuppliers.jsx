import { useState, useEffect, useCallback } from "react";
import request from "../api/apiClient.js";

export function useSuppliers() {
  const [suppliers, setSuppliers]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request("/suppliers");
      setSuppliers(data);
    } catch (err) {
      setError(err.message || "Σφάλμα φόρτωσης προμηθευτών");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSupplier = async (supplier) => {
    const isEdit = !!supplier._id;
    try {
      const saved = await request(`/suppliers${isEdit ? `/${supplier._id}` : ""}`, {
        method: isEdit ? "PUT" : "POST",
        body: supplier,
      });
      setSuppliers((prev) =>
        isEdit
          ? prev.map((s) => (s._id === saved._id ? saved : s))
          : [...prev, saved]
      );
      return saved;
    } catch (err) {
      setError(err.message || "Σφάλμα αποθήκευσης");
      throw err;
    }
  };

  const deleteSupplier = async (id) => {
    if (!window.confirm("Θες σίγουρα να διαγράψεις τον προμηθευτή;")) return;
    try {
      await request(`/suppliers/${id}`, { method: "DELETE" });
      setSuppliers((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.message || "��φάλμα διαγραφής");
    }
  };

  const importSuppliers = async (rows) => {
    const result = await request("/suppliers/import", {
      method: "POST",
      body: { suppliers: rows },
    });
    await fetchSuppliers(); // refresh λίστα μετά το import
    return result;
  };

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  return { suppliers, loading, error, fetchSuppliers, saveSupplier, deleteSupplier, importSuppliers };
}
