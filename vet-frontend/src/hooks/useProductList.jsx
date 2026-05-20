// src/hooks/useProductList.jsx
import { useState, useEffect } from "react";
import productsApi from "../api/productsApi";

export function useProductList() {
  const [products, setProducts] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔹 Normalizer για απάντηση API
  function normalizeListResponse(resp) {
    // Δέχεται:
    // - [{...}, {...}]
    // - { items: [...] }
    // - Axios-like: { data: { items: [...] } }
    const items =
      Array.isArray(resp)
        ? resp
        : Array.isArray(resp?.items)
        ? resp.items
        : Array.isArray(resp?.data?.items)
        ? resp.data.items
        : [];

    // Σιγουρεύουμε ότι περνάνε ΟΛΑ τα πεδία και γίνονται number όπου χρειάζεται
    return items.map((row) => ({
      ...row,
      batchesCount: Number(row?.batchesCount ?? 0),
      stockTotal: Number(
        row?.stockTotal ?? row?.quantity ?? 0 // υποστήριξη και για παλιό contract
      ),
      quantity: Number(
        row?.quantity ?? row?.stockTotal ?? 0 // συμβατότητα με παλιό UI
      ),
    }));
  }

  // 🔹 Ανάκτηση προϊόντων από API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await productsApi.getAllProducts();
      const list = normalizeListResponse(resp);
      setProducts(list);
    } catch (err) {
      console.error("❌ Σφάλμα φόρτωσης προϊόντων:", err);
      setError(err?.message ?? "Load error");
      setProducts([]); // καθάρισμα για να δούμε καθαρά το state
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Διαγραφή προϊόντος
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Θέλεις σίγουρα να διαγράψεις το προϊόν;")) return;
    if (!window.confirm("⚠️ Αυτή η ενέργεια είναι μη αναστρέψιμη. Συνέχεια;")) return;

    try {
      setLoading(true);
      await productsApi.deleteProduct(id);
      await fetchProducts(); // ανανέωση λίστας
    } catch (err) {
      console.error("❌ Σφάλμα διαγραφής:", err);
      alert("Αποτυχία διαγραφής: " + (err?.message ?? "Delete error"));
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Ταξινόμηση (client-side)
  const handleSortClick = (field) => {
    if (sortField === field) {
      const next = sortDirection === "asc" ? "desc" : "asc";
      setSortDirection(next);
      if (next === "desc") setSortField(field);
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return {
    products,
    setProducts,
    fetchProducts,
    handleDeleteProduct,
    handleSortClick,
    sortField,
    sortDirection,
    loading,
    error,
  };
}
