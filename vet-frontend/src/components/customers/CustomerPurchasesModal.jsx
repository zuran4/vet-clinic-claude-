import React, { useEffect, useState } from "react";
import {
  X,
  ShoppingBag,
  CalendarDays,
  Package,
  Trash2,
  Undo2,
  TrendingUp,
  Hash,
  Clock,
} from "lucide-react";
import request from "../../api/apiClient.js";
import { useModalScrollLock } from "../../hooks/useModalScrollLock.js";

const CustomerPurchasesModal = ({ isOpen, onClose, customerId, lockScroll = true }) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [undoItem, setUndoItem] = useState(null);
  const [undoTimeout, setUndoTimeout] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);

  // Όταν ανοίγει πάνω από την κάρτα πελάτη (CustomerList), εκείνη ήδη κλειδώνει
  // το scroll — δεν πρέπει να το ξεκλειδώσουμε εμείς όταν κλείνουμε από πάνω της.
  const scrollRef = useModalScrollLock(isOpen, lockScroll);

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

  const deletePurchaseFromDB = async (purchaseId) => {
    try {
      await request(`/customers/${customerId}/purchases/${purchaseId}`, { method: "DELETE" });
    } catch (err) {
      console.error("❌ Σφάλμα οριστικής διαγραφής:", err);
    }
  };

  const restorePurchaseToDB = async (purchase) => {
    try {
      await request(`/customers/${customerId}/purchases`, {
        method: "POST",
        body: { products: [{ product: purchase.product._id, quantity: purchase.quantity }] },
      });
    } catch (err) {
      console.error("❌ Σφάλμα επαναφοράς αγοράς:", err);
    }
  };

  const handleDelete = async (p) => {
    setPurchases((prev) => prev.filter((x) => x._id !== p._id));
    setUndoItem(p);
    setFadeOut(false);
    await deletePurchaseFromDB(p._id);
    const timeout = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => { setUndoItem(null); setUndoTimeout(null); }, 500);
    }, 4500);
    setUndoTimeout(timeout);
  };

  const handleUndo = async () => {
    if (!undoItem) return;
    clearTimeout(undoTimeout);
    await restorePurchaseToDB(undoItem);
    setPurchases((prev) => [undoItem, ...prev]);
    setUndoItem(null);
    setUndoTimeout(null);
  };

  if (!isOpen) return null;

  const totalQty = purchases.reduce((s, p) => s + (p.quantity || 0), 0);
  const lastDate = purchases.length
    ? new Date(Math.max(...purchases.map((p) => new Date(p.date || 0)))).toLocaleDateString("el-GR")
    : "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
      style={{ touchAction: "none" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[680px] max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-win-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Ιστορικό Αγορών</p>
                <p className="text-white font-bold text-base leading-tight mt-0.5">{customerName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats bar */}
          {!loading && (
            <div className="flex gap-3 mt-4">
              <div className="flex-1 bg-white/10 rounded-xl px-3 py-2">
                <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-semibold uppercase tracking-wide mb-0.5">
                  <Hash className="w-3 h-3" /> Αγορές
                </div>
                <div className="text-white font-bold text-xl">{purchases.length}</div>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl px-3 py-2">
                <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-semibold uppercase tracking-wide mb-0.5">
                  <TrendingUp className="w-3 h-3" /> Σύνολο τεμ.
                </div>
                <div className="text-white font-bold text-xl">{totalQty}</div>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl px-3 py-2">
                <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-semibold uppercase tracking-wide mb-0.5">
                  <Clock className="w-3 h-3" /> Τελευταία
                </div>
                <div className="text-white font-bold text-sm leading-tight mt-0.5">{lastDate}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-gray-50 dark:bg-win-surface/50"
          style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Φόρτωση αγορών…</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-indigo-300 dark:text-indigo-500" />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Δεν βρέθηκαν αγορές</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {purchases.map((p, idx) => (
                <div
                  key={p._id}
                  className="bg-white dark:bg-win-elevated rounded-xl border border-gray-100 dark:border-win-border shadow-sm overflow-hidden"
                >
                  {/* Row header */}
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-indigo-400 dark:text-indigo-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                          {p.product?.name || "Άγνωστο προϊόν"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                            <CalendarDays className="w-3 h-3" />
                            {p.date ? new Date(p.date).toLocaleDateString("el-GR") : "—"}
                          </span>
                          <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-semibold">
                            x{p.quantity}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete / Confirm */}
                    {confirmId === p._id ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-red-500 font-semibold whitespace-nowrap">Διαγραφή;</span>
                        <button
                          onClick={() => { setConfirmId(null); handleDelete(p); }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-semibold"
                        >
                          Ναι
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-win-elevated2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-win-elevated transition-colors font-semibold"
                        >
                          Όχι
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(p._id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 dark:text-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {!loading && purchases.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-win-border bg-white dark:bg-win-surface flex-shrink-0">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {purchases.length} εγγραφ{purchases.length === 1 ? "ή" : "ές"}
            </span>
            <button
              onClick={onClose}
              className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
            >
              Κλείσιμο
            </button>
          </div>
        )}
      </div>

      {/* ── Undo Snackbar ── */}
      {undoItem && (
        <div
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-800 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-500 z-[60] ${
            fadeOut ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
          }`}
        >
          <span className="text-sm">
            Διαγράφηκε: <strong>{undoItem.product?.name || "προϊόν"}</strong>
          </span>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" /> Αναίρεση
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerPurchasesModal;
