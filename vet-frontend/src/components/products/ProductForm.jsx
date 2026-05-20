import React, { useState, useEffect } from "react";
import { Edit, Plus } from "lucide-react";
import { Button } from "../ui/button";

const initialProduct = {
  name: "",
  category: "Άλλο",
  barcode: "",
  quantity: 0,
  threshold: 5,
  unit: "",
  expirationDate: "",
  expirationWarningDays: 30,
  notes: "",
};

const ProductForm = ({ onSave, initialData = null }) => {
  const [product, setProduct] = useState(initialProduct);
  const [error, setError] = useState("");

  const categories = ["Φάρμακο", "Τροφή", "Παιχνίδι", "Άλλο"];
  const units = ["τεμ.", "ml", "gr", "kg"];
  const warningOptions = [60, 30, 15];

  useEffect(() => {
    if (initialData) {
      setProduct({
        ...initialProduct,
        ...initialData,
        expirationDate: initialData.expirationDate
          ? initialData.expirationDate.split("T")[0]
          : "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "threshold" || name === "expirationWarningDays"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!product.name || !product.category || !product.unit) {
      setError("⚠️ Συμπλήρωσε όλα τα υποχρεωτικά πεδία.");
      return;
    }

    setError("");

    // ✅ Καθαρίζουμε τα πεδία αν δεν είναι Τροφή
    const cleanedProduct = { ...product };
    if (product.category !== "Τροφή") {
      delete cleanedProduct.expirationDate;
      delete cleanedProduct.expirationWarningDays;
    }

    onSave(cleanedProduct);

    if (!initialData) {
      setProduct(initialProduct);
    }
  };

  const handleReset = () => {
    if (initialData) {
      setProduct(initialData);
    } else {
      setProduct(initialProduct);
    }
    setError("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-2xl shadow-xl space-y-6 max-w-3xl mx-auto mt-6"
    >
      {/* Τίτλος */}
      <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center gap-2">
        {initialData ? (
          <>
            <Edit className="w-6 h-6 text-primary" />
            Επεξεργασία Προϊόντος
          </>
        ) : (
          <>
            <Plus className="w-6 h-6 text-primary" />
            Προσθήκη Προϊόντος
          </>
        )}
      </h2>

      {error && (
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded-2xl border border-red-300 shadow">
          {error}
        </div>
      )}

      {/* Πεδία */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Όνομα Προϊόντος *
          </label>
          <input
            type="text"
            name="name"
            value={product.name}
            onChange={handleChange}
            className="mt-1 block w-full border px-3 py-2 rounded-2xl shadow focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Barcode</label>
          <input
            type="text"
            name="barcode"
            value={product.barcode}
            onChange={handleChange}
            className="mt-1 block w-full border px-3 py-2 rounded-2xl shadow focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Κατηγορία *
          </label>
          <select
            name="category"
            value={product.category}
            onChange={handleChange}
            className="mt-1 block w-full border px-3 py-2 rounded-2xl shadow focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">-- Επιλογή --</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Μονάδα Μέτρησης *
          </label>
          <select
            name="unit"
            value={product.unit}
            onChange={handleChange}
            className="mt-1 block w-full border px-3 py-2 rounded-2xl shadow focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">-- Επιλογή --</option>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Ποσότητα</label>
          <input
            type="number"
            name="quantity"
            value={product.quantity}
            onChange={handleChange}
            className="mt-1 block w-full border px-3 py-2 rounded-2xl shadow focus:ring-2 focus:ring-primary"
            min={0}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Όριο Ειδοποίησης</label>
          <input
            type="number"
            name="threshold"
            value={product.threshold}
            onChange={handleChange}
            className="mt-1 block w-full border px-3 py-2 rounded-2xl shadow focus:ring-2 focus:ring-primary"
            min={0}
          />
        </div>

        {product.category === "Τροφή" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ημερομηνία Λήξης
              </label>
              <input
                type="date"
                name="expirationDate"
                value={product.expirationDate}
                onChange={handleChange}
                className="mt-1 block w-full border px-3 py-2 rounded-2xl shadow focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ειδοποίηση πριν τη λήξη
              </label>
              <select
                name="expirationWarningDays"
                value={product.expirationWarningDays}
                onChange={handleChange}
                className="mt-1 block w-full border px-3 py-2 rounded-2xl shadow focus:ring-2 focus:ring-primary"
              >
                {warningOptions.map((d) => (
                  <option key={d} value={d}>
                    {d} ημέρες πριν
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Σημειώσεις</label>
        <textarea
          name="notes"
          value={product.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full border px-3 py-2 rounded-2xl shadow focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Κουμπιά */}
      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="secondary" onClick={handleReset}>
          Καθαρισμός
        </Button>
        <Button type="submit" variant="primary">
          Αποθήκευση
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
