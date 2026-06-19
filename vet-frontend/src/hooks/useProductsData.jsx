import { useState, useCallback } from "react";
import request from "@/api/apiClient";

export function useProductsData() {
  const [products, setProducts] = useState([]);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await request("/products");
      setProducts(data);
    } catch (err) {
      console.error("❌ Σφάλμα φόρτωσης προϊόντων:", err);
    }
  }, []);

  return { products, fetchProducts };
}
