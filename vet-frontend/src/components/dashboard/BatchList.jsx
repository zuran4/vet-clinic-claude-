import StockBadge from "@/components/ui/StockBadge.jsx";
import { useStockThresholds } from "@/hooks";
import React, { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import dayjs from "dayjs";
import request from "@/api/apiClient.js";

const BatchList = ({ productId, isOpen, onQuantity, summaryQty, category }) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const { getThresholdForCategory } = useStockThresholds();
  const cfg = getThresholdForCategory(category);

  const totalQuantity = batches.reduce((sum, b) => sum + (Number(b?.quantity) || 0), 0);
  const headerTotal = typeof summaryQty === "number" ? summaryQty : totalQuantity;

  useEffect(() => {
    if (isOpen && productId) fetchBatches();
  }, [isOpen, productId]);

  useEffect(() => {
    if (typeof onQuantity === "function" && isOpen && productId) {
      onQuantity(productId, totalQuantity);
    }
  }, [onQuantity, isOpen, productId, totalQuantity]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const data = await request(`/products/${productId}/batches`);
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Σφάλμα φόρτωσης παρτίδων:", err);
    } finally {
      setLoading(false);
    }
  };

  const getBatchStatus = (expirationDate) => {
    if (!expirationDate) return { label: "—", className: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400" };
    const diff = dayjs(expirationDate).diff(dayjs(), "day");
    if (diff < 0)   return { label: "Έληξε",              className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" };
    if (diff <= 30) return { label: `Λήγει σε ${diff}μ`,  className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" };
    if (diff <= 60) return { label: `Λήγει σε ${diff}μ`,  className: "bg-yellow-100 text-yellow-700 dark:bg-amber-900/40 dark:text-amber-300" };
    return           { label: "Εντάξει",                  className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" };
  };

  const getRowBg = (expirationDate) => {
    if (!expirationDate) return "";
    const diff = dayjs(expirationDate).diff(dayjs(), "day");
    if (diff < 0)   return "bg-red-50/60 dark:bg-red-900/20";
    if (diff <= 60) return "bg-amber-50/40 dark:bg-amber-900/20";
    return "";
  };

  if (!isOpen) return null;

  return (
    <div className="rounded-2xl overflow-hidden border border-orange-100 dark:border-orange-800/30 shadow-sm mt-1">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 border-b border-orange-100 dark:border-orange-800/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">Παρτίδες Προϊόντος</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">Σύνολο</span>
          <StockBadge qty={headerTotal} config={cfg} />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">Φόρτωση...</div>
      ) : batches.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">Δεν υπάρχουν παρτίδες.</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Παρτίδα</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Κατάσταση</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Ποσότητα</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Τιμολόγιο</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Ημ. Αγοράς</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Ημ. Λήξης</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {batches.map((batch, idx) => {
                const status = getBatchStatus(batch.expirationDate);
                const rowBg = getRowBg(batch.expirationDate);

                return (
                  <tr key={batch._id || idx} className={`${rowBg} hover:bg-orange-50/30 dark:hover:bg-orange-900/20 transition-colors`}>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-gray-700 dark:text-gray-200">
                      {batch.batchNumber || "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">{batch.quantity}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-400 dark:text-gray-500 font-mono">{batch.invoiceNumber || "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                      {batch.purchaseDate ? dayjs(batch.purchaseDate).format("DD/MM/YYYY") : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                      {batch.expirationDate ? dayjs(batch.expirationDate).format("DD/MM/YYYY") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot className="sticky bottom-0 bg-orange-50 dark:bg-orange-900/20 border-t border-orange-100 dark:border-orange-800/30">
              <tr>
                <td colSpan={2} className="px-4 py-2.5 text-right text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                  Σύνολο
                </td>
                <td className="px-4 py-2.5 font-bold text-orange-700 dark:text-orange-300">{totalQuantity}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default BatchList;
