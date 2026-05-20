import React, { useState } from "react";
import { Package, Save, Layers, AlertTriangle } from "lucide-react";
import ProductInfoSection from "./ProductInfoSection.jsx";
import StockSection from "./StockSection.jsx";
import { Button } from "../ui/button.jsx";
import Modal from "../ui/Modal.jsx";
import { useProductModal } from "../../hooks/useProductModal.jsx";

const ProductModal = ({ productId, onSave, onClose, initialTab = "info" }) => {
  const [activeTab, setActiveTab]       = useState(initialTab);
  const [isDirty, setIsDirty]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  const {
    productInfo,
    setProductInfo,
    batches,
    setBatches,
    suppliers,
    loading,
    savingBatches,
    error,
    saveProductInfo,
    saveBatches,
    isBatched,
  } = useProductModal(productId);

  // Κάθε αλλαγή σε πεδίο → dirty
  const handleChange = (updated) => {
    setProductInfo(updated);
    setIsDirty(true);
  };

  const handleBatchChange = (updated) => {
    setBatches(updated);
    setIsDirty(true);
  };

  // Προσπάθεια κλεισίματος
  const tryClose = () => {
    if (isDirty) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  };

  if (loading) return (
    <Modal isOpen={true} onClose={tryClose} preventBackdropClose>
      <div className="text-center py-10 text-gray-400 text-sm">Φόρτωση...</div>
    </Modal>
  );

  if (error) return (
    <Modal isOpen={true} onClose={tryClose} preventBackdropClose>
      <div className="text-center py-10 text-red-500 text-sm">{error}</div>
    </Modal>
  );

  const totalQuantity = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);

  const TABS = [
    { key: "info",  label: "Στοιχεία Προϊόντος", icon: Package },
    ...(isBatched ? [{ key: "stock", label: "Απόθεμα & Λήξη", icon: Layers }] : []),
  ];

  return (
    <>
      <Modal isOpen={true} onClose={tryClose} preventBackdropClose>
        {/* Gradient Header */}
        <div className="-mx-6 -mt-6 mb-5 rounded-t-2xl bg-gradient-to-r from-orange-400 to-amber-300 px-6 pt-5 pb-0">
          <div className="flex items-center gap-2.5 text-white mb-4">
            <Package className="w-5 h-5" />
            <span className="text-lg font-bold">
              {productId ? "Επεξεργασία Προϊόντος" : "Νέο Προϊόν"}
            </span>
            {isDirty && (
              <span className="ml-2 text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full">
                Μη αποθηκευμένες αλλαγές
              </span>
            )}
          </div>

          <div className="flex gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-xl transition-all ${
                  activeTab === key
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === "info" && (
          <ProductInfoSection
            productInfo={productInfo}
            suppliers={suppliers}
            onChange={handleChange}
          />
        )}

        {activeTab === "stock" && (
          <div className="space-y-3">
            <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-orange-600 font-medium">Σύνολο παρτίδων</span>
              <span className="text-lg font-bold text-orange-700">{totalQuantity}</span>
            </div>
            <StockSection
              productId={productId}
              batches={batches}
              onChange={handleBatchChange}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t border-gray-100 mt-4">
          <Button variant="danger" onClick={tryClose}>
            Ακύρωση
          </Button>
          {activeTab === "info" && (
            <Button
              variant="success"
              onClick={() => {
                saveProductInfo(productInfo, onSave);
                setIsDirty(false);
              }}
            >
              <Save className="w-4 h-4" />
              Αποθήκευση
            </Button>
          )}
          {activeTab === "stock" && (
            <Button
              variant="success"
              onClick={() => {
                saveBatches(batches, productId, onSave);
                setIsDirty(false);
              }}
              disabled={savingBatches}
            >
              <Save className="w-4 h-4" />
              {savingBatches ? "Αποθήκευση…" : "Αποθήκευση Αποθέματος"}
            </Button>
          )}
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Μη αποθηκευμένες αλλαγές</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Αν κλείσεις τώρα, οι αλλαγές σου θα χαθούν.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowConfirm(false)}>
                Συνέχεια επεξεργασίας
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setShowConfirm(false);
                  onClose();
                }}
              >
                Κλείσιμο χωρίς αποθήκευση
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductModal;
