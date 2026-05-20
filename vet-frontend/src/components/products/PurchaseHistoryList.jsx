import React, { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import dayjs from "dayjs";
import request from "../../api/apiClient.js";
import { useStockThresholds } from "@/hooks";
import StockBadge from "@/components/ui/StockBadge.jsx";

const PurchaseHistoryList = ({ productId, isOpen, onQuantity, summaryQty, category }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const { getThresholdForCategory } = useStockThresholds();
  const cfg = getThresholdForCategory(category);

  const totalQuantity = entries.reduce((sum, e) => sum + (Number(e?.quantity) || 0), 0);
  const headerTotal = typeof summaryQty === "number" ? summaryQty : totalQuantity;

  useEffect(() => {
    if (isOpen && productId) fetchEntries();
  }, [isOpen, productId]);

  useEffect(() => {
    if (typeof onQuantity === "function" && isOpen && productId) {
      onQuantity(productId, totalQuantity);
    }
  }, [onQuantity, isOpen, productId, totalQuantity]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const data = await request(`/products/${productId}/batches`);
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="rounded-2xl overflow-hidden border border-orange-100 shadow-sm mt-1">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-orange-700">Ιστορικό Αγορών</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Σύνολο</span>
          <StockBadge qty={headerTotal} config={cfg} />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white px-4 py-6 text-center text-sm text-gray-400">Φόρτωση...</div>
      ) : entries.length === 0 ? (
        <div className="bg-white px-4 py-6 text-center text-sm text-gray-400">
          Δεν υπάρχουν καταχωρήσεις αγορών.
        </div>
      ) : (
        <div className="bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Ημ. Αγοράς</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Προμηθευτής</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Ποσότητα</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Τιμή Χονδρικής</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry, idx) => (
                <tr key={entry._id || idx} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-500">
                    {entry.purchaseDate
                      ? dayjs(entry.purchaseDate).format("DD/MM/YYYY")
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-500">
                    {entry.invoiceNumber || "—"}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-gray-700">
                    {entry.quantity}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-gray-700">
                    {entry.batchNumber || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-orange-50 border-t border-orange-100">
              <tr>
                <td colSpan={2} />
                <td className="px-4 py-2.5 font-bold text-orange-700">{totalQuantity}</td>
                <td className="px-4 py-2.5 text-xs font-semibold text-orange-600 uppercase tracking-wide">
                  Σύνολο
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default PurchaseHistoryList;
