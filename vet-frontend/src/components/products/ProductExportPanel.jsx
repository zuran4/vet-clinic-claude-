import React, { useEffect, useState } from "react";
import axios from "axios";
import { Package, Barcode, Upload } from "lucide-react";
import Button from "../ui/button";

const ProductExportPanel = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // 📦 Φόρτωση προϊόντων
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/products")
      .then((res) => setAllProducts(res.data))
      .catch((err) => console.error("❌ Σφάλμα προϊόντων:", err));
  }, []);

  // 🔍 Αναζήτηση προϊόντος
  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    const match = allProducts.find(
      (p) =>
        p.name.toLowerCase().includes(val.toLowerCase()) ||
        (p.barcode && p.barcode.includes(val))
    );
    setSelectedProduct(match || null);
  };

  // 🚚 Εξαγωγή προϊόντος
  const handleExport = async () => {
    if (!selectedProduct || quantity < 1) return;

    try {
      await axios.post(`http://localhost:5000/api/products/export`, {
        productId: selectedProduct._id,
        quantity,
      });

      // ✅ Runtime alert
      window.dispatchEvent(
        new CustomEvent("alert", {
          detail: {
            id: Date.now(),
            type: "success",
            message: `Εξαγωγή ολοκληρώθηκε: ${selectedProduct.name} (${quantity})`,
          },
        })
      );

      setQuantity(1);
      setQuery("");
      setSelectedProduct(null);

      // 🔄 Ενημέρωση αποθεμάτων
      const updated = await axios.get("http://localhost:5000/api/products");
      setAllProducts(updated.data);
    } catch (err) {
      console.error("❌ Σφάλμα εξαγωγής:", err);

      window.dispatchEvent(
        new CustomEvent("alert", {
          detail: {
            id: Date.now(),
            type: "error",
            message: "Αποτυχία εξαγωγής",
          },
        })
      );
    }
  };

  return (
    <div className="bg-yellow-50 p-6 rounded-2xl shadow-xl space-y-4">
      <h3 className="text-xl font-bold text-yellow-800 text-center flex items-center justify-center gap-2">
        <Upload className="w-6 h-6 text-yellow-700" />
        Εξαγωγή Προϊόντος από Αποθήκη
      </h3>

      {/* 🔹 Αναζήτηση */}
      <div className="flex justify-center">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Αναζήτηση με όνομα ή barcode"
          className="w-full md:w-2/3 px-4 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>

      {/* 🔹 Επιλεγμένο προϊόν */}
      {selectedProduct && (
        <div className="text-center mt-4">
          <p className="flex flex-col items-center justify-center gap-1">
            <span className="text-lg font-semibold text-gray-800">
              {selectedProduct.name}
            </span>
            <span className="text-sm text-gray-500">
              Απόθεμα: {selectedProduct.quantity}
            </span>
          </p>

          {selectedProduct.barcode && (
            <p className="flex items-center justify-center gap-1 text-sm text-gray-500 mt-1">
              <Barcode className="w-4 h-4" />
              {selectedProduct.barcode}
            </p>
          )}

          <div className="flex items-center justify-center gap-3 mt-3">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="border p-2 rounded-2xl w-24 text-center"
            />
            <Button variant="danger" onClick={handleExport}>
              Εξαγωγή
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductExportPanel;
