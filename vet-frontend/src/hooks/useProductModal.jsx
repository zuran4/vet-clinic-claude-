import { useState, useEffect } from "react";
import { readResponse } from "../utils/apiHelpers.js";
import { API_URL } from "../api/api.js"; // ✅ κεντρικό base URL

export function useProductModal(productId, initialBarcode = "") {
  const [productInfo, setProductInfo] = useState(null);
  const [batches, setBatches] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isBatched =
    productInfo?.category === "Τροφή" || productInfo?.category === "Φάρμακο";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");

        if (!productId) {
          setProductInfo({
            name: "",
            category: "Άλλο",
            barcode: initialBarcode || "",
            unit: "",
            threshold: 5,
            supplier: "",
            expirationDate: "",
            expirationWarningDays: 30,
            notes: "",
            retailPrice: null,
          });
          setBatches([]);
        } else {
          // προϊόν
          const productRes = await fetch(`${API_URL}/products/${productId}`);
          const pr = await readResponse(productRes);
          if (!productRes.ok)
            throw new Error(pr.text || "Σφάλμα φόρτωσης προϊόντος");
          setProductInfo(pr.data);

          // παρτίδες (array)
          const stockRes = await fetch(
            `${API_URL}/products/${productId}/batches`
          );
          const sr = await readResponse(stockRes);
          const arr = sr.ok && Array.isArray(sr.data) ? sr.data : [];
          setBatches(arr);
        }

        // suppliers
        const suppliersRes = await fetch(`${API_URL}/suppliers`);
        const sr2 = await readResponse(suppliersRes);
        if (sr2.ok) setSuppliers(sr2.data || []);
      } catch (err) {
        console.error("❌ Σφάλμα useProductModal:", err);
        setError(err.message || "Αποτυχία φόρτωσης δεδομένων προϊόντος.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId]);

  const saveProductInfo = async (productInfo, onSave) => {
    if (!productInfo.name || !productInfo.category || !productInfo.unit) {
      setError("Συμπλήρωσε όλα τα υποχρεωτικά πεδία.");
      return;
    }

    try {
      setError("");

      const method = productId ? "PUT" : "POST";
      const url = productId
        ? `${API_URL}/products/${productId}`
        : `${API_URL}/products`;

      const payload = { ...productInfo };
      delete payload.batches;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const out = await readResponse(res);
      if (!out.ok)
        throw new Error(out.text || "Σφάλμα αποθήκευσης προϊόντος.");

      onSave?.(out.data);
    } catch (err) {
      console.error("❌ Σφάλμα saveProductInfo:", err);
      setError(err.message || "Σφάλμα αποθήκευσης προϊόντος.");
    }
  };

  return {
    productInfo,
    setProductInfo,
    batches,
    setBatches,
    suppliers,
    loading,
    error,
    saveProductInfo,
    isBatched,
  };
}
