import React, { useState, useEffect } from "react";
import { PackagePlus, Save, AlertTriangle } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import { Button } from "../ui/button.jsx";
import request from "../../api/apiClient.js";

const INPUT = "mt-1 w-full border border-gray-200 dark:border-win-border-light rounded-2xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100";
const LABEL = "block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1";

export default function QuickStockModal({ product, onSave, onClose }) {
  const [form, setForm] = useState({
    quantity: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    wholesalePrice: "",
    supplier: "",
  });
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    request("/suppliers")
      .then((data) => setSuppliers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setIsDirty(true);
  };

  const tryClose = () => {
    if (isDirty) setShowConfirm(true);
    else onClose();
  };

  const handleSave = async () => {
    if (!form.quantity || Number(form.quantity) <= 0) {
      setError("Η ποσότητα πρέπει να είναι μεγαλύτερη από 0.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Αποθηκεύουμε ως batch record ώστε να φαίνεται στο ιστορικό
      const payload = {
        action: "add",
        batch: {
          batchNumber: form.wholesalePrice ? `${form.wholesalePrice}€` : "",
          quantity: Number(form.quantity),
          purchaseDate: form.purchaseDate || null,
          expirationDate: null,
          invoiceNumber: form.supplier || "",
        },
      };

      const result = await request(`/products/${product._id}/batches`, {
        method: "PUT",
        body: payload,
      });

      onSave?.({ productId: product._id, quantity: result.quantity, batches: result.batches });
      onClose();
    } catch (err) {
      setError(err.message || "Σφάλμα αποθήκευσης.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal isOpen={true} onClose={tryClose} preventBackdropClose>
        {/* Gradient Header */}
        <div className="-mx-6 -mt-6 mb-5 rounded-t-2xl bg-gradient-to-r from-orange-400 to-amber-300 px-6 py-5">
          <div className="flex items-center gap-2.5 text-white">
            <PackagePlus className="w-5 h-5" />
            <div>
              <p className="text-lg font-bold leading-tight">Προσθήκη Αποθέματος</p>
              <p className="text-sm text-white/70 mt-0.5">
                {product?.name}
                {product?.packageSize && ` · ${product.packageSize}`}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-50 dark:bg-win-elevated/50 rounded-2xl px-4 py-3 space-y-3">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Στοιχεία Αγοράς</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Ποσότητα *</label>
              <input
                type="number"
                min="1"
                placeholder="0"
                value={form.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Ημερομηνία Αγοράς</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => handleChange("purchaseDate", e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Τιμή Χονδρικής</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00 €"
                value={form.wholesalePrice}
                onChange={(e) => handleChange("wholesalePrice", e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Προμηθευτής</label>
              <select
                value={form.supplier}
                onChange={(e) => handleChange("supplier", e.target.value)}
                className={INPUT}
              >
                <option value="">— Επιλογή —</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 px-1 mt-2">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t border-gray-100 mt-4">
          <Button variant="danger" onClick={tryClose}>Ακύρωση</Button>
          <Button variant="success" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? "Αποθήκευση…" : "Αποθήκευση"}
          </Button>
        </div>
      </Modal>

      {/* Confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-win-surface rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">Μη αποθηκευμένες αλλαγές</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Αν κλείσεις τώρα, οι αλλαγές θα χαθούν.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowConfirm(false)}>
                Συνέχεια
              </Button>
              <Button variant="danger" onClick={() => { setShowConfirm(false); onClose(); }}>
                Κλείσιμο
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
