import React, { useEffect, useState } from "react";
import {
  X,
  ShoppingBag,
  CalendarDays,
  Package,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "../ui/button";
import request from "../../api/apiClient.js";

// Αν το αρχείο είναι πιο “ψηλά” (π.χ. src/components/CustomerPurchasesModal.jsx)
// τότε κάνε το import έτσι:
// import request from "../api/apiClient.js";

const CustomerPurchasesModal = ({ isOpen, onClose, customerId }) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const [confirmId, setConfirmId] = useState(null);

  // 🧩 Undo state
  const [undoItem, setUndoItem] = useState(null);
  const [undoTimeout, setUndoTimeout] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!isOpen || !customerId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const data = await request(`/customers/${customerId}/purchases`);

        setPurchases(data.purchases || []);
        setCustomerName(data.customer?.name || "");
      } catch (err) {
        console.error("❌ Σφάλμα φόρτωσης αγορών:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, customerId]);

  // ❌ Διαγραφή backend
  const deletePurchaseFromDB = async (purchaseId) => {
    try {
      await request(`/customers/${customerId}/purchases/${purchaseId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("❌ Σφάλμα οριστικής διαγραφής:", err);
    }
  };

  // 🔄 Επαναφορά backend (Undo)
  const restorePurchaseToDB = async (purchase) => {
    try {
      await request(`/customers/${customerId}/purchases`, {
        method: "POST",
        body: {
          products: [
            {
              product: purchase.product._id,
              quantity: purchase.quantity,
            },
          ],
        },
      });
    } catch (err) {
      console.error("❌ Σφάλμα επαναφοράς αγοράς:", err);
    }
  };

  // 🗑️ Διαγραφή
  const handleDelete = async (p) => {
    setPurchases((prev) => prev.filter((x) => x._id !== p._id));
    setUndoItem(p);
    setFadeOut(false);

    await deletePurchaseFromDB(p._id);

    const timeout = setTimeout(() => {
      // ξεκινά fade-out 0.5s πριν φύγει
      setFadeOut(true);
      setTimeout(() => {
        setUndoItem(null);
        setUndoTimeout(null);
      }, 500);
    }, 4500); // fade-out στα 4.5 s

    setUndoTimeout(timeout);
  };

  // 🔄 Αναίρεση
  const handleUndo = async () => {
    if (!undoItem) return;
    clearTimeout(undoTimeout);
    await restorePurchaseToDB(undoItem);
    setPurchases((prev) => [undoItem, ...prev]);
    setUndoItem(null);
    setUndoTimeout(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-40 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-[95vw] md:max-w-[800px] my-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Ιστορικό Αγορών
          </h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Πελάτης */}
        <p className="text-gray-600 mb-4">
          Πελάτης:{" "}
          <span className="font-medium text-gray-800">{customerName}</span>
        </p>

        {/* Περιεχόμενο */}
        {loading ? (
          <p className="text-gray-500 text-center py-8">Φόρτωση...</p>
        ) : purchases.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Δεν βρέθηκαν αγορές για αυτόν τον πελάτη.
          </p>
        ) : (
          <div className="divide-y rounded-xl border bg-gray-50">
            {purchases.map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between p-3 hover:bg-white transition"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-800">
                    {p.product?.name || "Άγνωστο προϊόν"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    {p.date
                      ? new Date(p.date).toLocaleDateString("el-GR")
                      : "-"}
                  </span>
                  <span>Ποσότητα: {p.quantity}</span>
                  {confirmId === p._id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-red-600 font-medium">Διαγραφή;</span>
                      <button
                        onClick={() => { setConfirmId(null); handleDelete(p); }}
                        className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        Ναι
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        Όχι
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmId(p._id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔹 Snackbar Undo με Fade-Out */}
      {undoItem && (
        <div
          className={`fixed bottom-5 right-5 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 transition-all duration-500 ${
            fadeOut ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
          }`}
        >
          <span>
            Η αγορά "{undoItem.product?.name || "προϊόν"}" διαγράφηκε.
          </span>
          <Button
            variant="secondary"
            size="sm"
            className="bg-primary text-white hover:bg-primary/80"
            onClick={handleUndo}
          >
            <Undo2 className="w-4 h-4 mr-1" />
            Αναίρεση
          </Button>
        </div>
      )}
    </div>
  );
};

export default CustomerPurchasesModal;
