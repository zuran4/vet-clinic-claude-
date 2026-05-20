import { useCallback } from "react";

export function useProductListHandlers() {
  const handleAddProduct = useCallback(() => {
    window.dispatchEvent(new CustomEvent("edit-product", { detail: null }));
  }, []);

  return { handleAddProduct };
}
