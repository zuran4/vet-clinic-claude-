import React from "react";

const INPUT = "mt-1 w-full border border-gray-200 dark:border-win-border-light rounded-2xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100";
const LABEL = "block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1";

const ProductInfoSection = ({ productInfo, suppliers, onChange }) => {
  if (!productInfo) return null;

  const updateField = (field, value) => {
    onChange({ ...productInfo, [field]: value });
  };

  return (
    <div className="space-y-3">
      {/* Βασικά στοιχεία */}
      <div className="bg-gray-50 dark:bg-win-elevated/50 rounded-2xl px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Βασικά Στοιχεία</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Όνομα</label>
            <input
              type="text"
              value={productInfo.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="π.χ. Amoxicillin"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Κατηγορία</label>
            <select
              value={productInfo.category || "Άλλο"}
              onChange={(e) => updateField("category", e.target.value)}
              className={INPUT}
            >
              <option value="Φάρμακο">Φάρμακο</option>
              <option value="Τροφή">Τροφή</option>
              <option value="Παιχνίδι">Παιχνίδι</option>
              <option value="Αξεσουάρ">Αξεσουάρ</option>
              <option value="Άλλο">Άλλο</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Barcode</label>
            <input
              type="text"
              value={productInfo.barcode || ""}
              onChange={(e) => updateField("barcode", e.target.value)}
              placeholder="π.χ. 1234567890"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Μονάδα</label>
            <select
              value={productInfo.unit || ""}
              onChange={(e) => updateField("unit", e.target.value)}
              className={INPUT}
            >
              <option value="">— Επιλογή —</option>
              <option value="τεμ.">τεμ. (τεμάχια)</option>
              <option value="κιλά">κιλά</option>
              <option value="λίτρα">λίτρα</option>
              <option value="ml">ml (χιλιοστόλιτρα)</option>
              <option value="gr">gr (γραμμάρια)</option>
              <option value="κουτί">κουτί</option>
              <option value="σακί">σακί</option>
              <option value="φιαλίδιο">φιαλίδιο</option>
            </select>
          </div>
        </div>
      </div>

      {/* Απόθεμα & Προμηθευτής */}
      <div className="bg-gray-50 dark:bg-win-elevated/50 rounded-2xl px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Απόθεμα & Προμηθευτής</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Προμηθευτής</label>
            <select
              value={productInfo.supplier || ""}
              onChange={(e) => updateField("supplier", e.target.value)}
              className={INPUT}
            >
              <option value="">— Επιλογή —</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Όριο Αποθέματος</label>
            <input
              type="number"
              value={productInfo.threshold || 0}
              onChange={(e) => updateField("threshold", Number(e.target.value))}
              className={INPUT}
            />
          </div>
          {productInfo.category !== "Τροφή" && (
            <div>
              <label className={LABEL}>Απόθεμα</label>
              <input
                type="number"
                value={productInfo.quantity || 0}
                onChange={(e) => updateField("quantity", Number(e.target.value))}
                className={INPUT}
              />
            </div>
          )}
        </div>
      </div>

      {/* Τιμολόγηση */}
      <div className="bg-gray-50 dark:bg-win-elevated/50 rounded-2xl px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Τιμολόγηση</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Τιμή Λιανικής (€)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">€</span>
              <input
                type="number"
                value={productInfo.retailPrice ?? ""}
                onChange={(e) => updateField("retailPrice", e.target.value === "" ? null : Number(e.target.value))}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="mt-1 w-full border border-gray-200 dark:border-win-border-light rounded-2xl pl-8 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Σημειώσεις */}
      <div className="bg-gray-50 dark:bg-win-elevated/50 rounded-2xl px-4 py-3">
        <label className={LABEL}>Σημειώσεις</label>
        <textarea
          value={productInfo.notes || ""}
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="Προαιρετικές σημειώσεις..."
          className={INPUT}
          rows={3}
        />
      </div>
    </div>
  );
};

export default ProductInfoSection;
