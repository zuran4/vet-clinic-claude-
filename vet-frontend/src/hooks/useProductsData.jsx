import { useState, useCallback } from "react";
import { API_URL } from "@/api/api"; // ✅ κεντρικό base URL από το alias "@"

export function useProductsData() {
  const [products, setProducts] = useState([]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/products`);

      if (!res.ok) {
        throw new Error(`Σφάλμα φόρτωσης προϊόντων (${res.status})`);
      }

      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("❌ Σφάλμα φόρτωσης προϊόντων:", err);
    }
  }, []);

  return { products, fetchProducts };
}
