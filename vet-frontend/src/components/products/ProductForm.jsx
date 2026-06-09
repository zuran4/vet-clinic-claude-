import React, { useState, useEffect } from "react";
import { Edit, Plus } from "lucide-react";
import { Button } from "../ui/button";

const INPUT = "mt-1 block w-full border border-gray-200 dark:border-gray-600 px-3 py-2 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";
const LABEL = "block text-sm font-medium text-gray-700 dark:text-gray-300";

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
      className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl space-y-6 max-w-3xl mx-auto mt-6"
    >
      <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-100 mb-4 flex items-center gap-2">
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
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-4 py-2 rounded-2xl border border-red-300 dark:border-red-700 shadow">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Όνομα Προϊόντος *</label>
          <input type="text" name="name" value={product.name} onChange={handleChange} className={INPUT} required />
        </div>

        <div>
          <label className={LABEL}>Barcode</label>
          <input type="text" name="barcode" value={product.barcode} onChange={handleChange} className={INPUT} />
        </div>

        <div>
          <label className={LABEL}>Κατηγορία *</label>
          <select name="category" value={product.category} onChange={handleChange} className={INPUT} required>
            <option value="">-- Επιλογή --</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>Μονάδα Μέτρησης *</label>
          <select name="unit" value={product.unit} onChange={handleChange} className={INPUT} required>
            <option value="">-- Επιλογή --</option>
            {units.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>Ποσότητα</label>
          <input type="number" name="quantity" value={product.quantity} onChange={handleChange} className={INPUT} min={0} />
        </div>

        <div>
          <label className={LABEL}>Όριο Ειδοποίησης</label>
          <input type="number" name="threshold" value={product.threshold} onChange={handleChange} className={INPUT} min={0} />
        </div>

        {product.category === "Τροφή" && (
          <>
            <div>
              <label className={LABEL}>Ημερομηνία Λήξης</label>
              <input type="date" name="expirationDate" value={product.expirationDate} onChange={handleChange} className={INPUT} />
            </div>

            <div>
              <label className={LABEL}>Ειδοποίηση πριν τη λήξη</label>
              <select name="expirationWarningDays" value={product.expirationWarningDays} onChange={handleChange} className={INPUT}>
                {warningOptions.map((d) => (
                  <option key={d} value={d}>{d} ημέρες πριν</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div>
        <label className={LABEL}>Σημειώσεις</label>
        <textarea name="notes" value={product.notes} onChange={handleChange} rows={3} className={INPUT} />
      </div>

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
