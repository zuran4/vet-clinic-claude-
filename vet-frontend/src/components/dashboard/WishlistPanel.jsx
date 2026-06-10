import React, { useEffect, useState } from "react";
import { ShoppingCart, AlertTriangle, Clock, Printer, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import request from "@/api/apiClient.js";
import { useStockThresholds } from "@/hooks";
import { getStockStatus } from "@/utils/stock.js";
import StockBadge from "@/components/ui/StockBadge.jsx";
import dayjs from "dayjs";

const WishlistPanel = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const { getThresholdForCategory } = useStockThresholds();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await request("/products");
      setProducts(Array.isArray(data) ? data : (data.data ?? []));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const today = dayjs();

  const needsReorder = products.filter((p) => {
    const cfg = getThresholdForCategory(p.category);
    const qty = p.stockTotal ?? p.quantity ?? 0;
    const { key } = getStockStatus(qty, cfg);
    if (key === "out" || key === "low") return true;

    const warnDays = p.expirationWarningDays ?? 30;
    return p.batches?.some((b) => {
      if (!b.expirationDate || b.quantity <= 0) return false;
      const diff = dayjs(b.expirationDate).diff(today, "day");
      return diff <= warnDays;
    });
  });

  const bySupplier = {};
  for (const p of needsReorder) {
    const key = p.supplier?.trim() || "— Χωρίς Προμηθευτή";
    if (!bySupplier[key]) bySupplier[key] = [];
    bySupplier[key].push(p);
  }
  const supplierKeys = Object.keys(bySupplier).sort((a, b) => {
    if (a.startsWith("—")) return 1;
    if (b.startsWith("—")) return -1;
    return a.localeCompare(b, "el");
  });

  const handlePrint = () => window.print();

  const toggleSupplier = (key) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Λίστα Παραγγελίας
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {needsReorder.length === 0
              ? "Όλα τα προϊόντα είναι εντάξει"
              : `${needsReorder.length} προϊόντα χρειάζονται παραγγελία`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-win-elevated text-gray-500 dark:text-gray-400 transition-colors"
            title="Ανανέωση"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Εκτύπωση
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border shadow-sm px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
          Φόρτωση...
        </div>
      ) : needsReorder.length === 0 ? (
        <div className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border shadow-sm px-4 py-10 text-center">
          <ShoppingCart className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">Δεν υπάρχουν προϊόντα για παραγγελία.</p>
        </div>
      ) : (
        supplierKeys.map((supplierName) => {
          const items = bySupplier[supplierName];
          const isCollapsed = collapsed[supplierName];

          return (
            <div key={supplierName} className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border shadow-sm overflow-hidden">
              {/* Supplier header */}
              <button
                type="button"
                onClick={() => toggleSupplier(supplierName)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 border-b border-orange-100 dark:border-orange-800/30 hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-900/40 dark:hover:to-amber-900/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                  <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">{supplierName}</span>
                  <span className="text-xs text-orange-600 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/50 px-2 py-0.5 rounded-full">
                    {items.length} προϊόντα
                  </span>
                </div>
                {isCollapsed
                  ? <ChevronDown className="w-4 h-4 text-orange-400 dark:text-orange-500" />
                  : <ChevronUp className="w-4 h-4 text-orange-400 dark:text-orange-500" />
                }
              </button>

              {!isCollapsed && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-win-elevated/50 border-b border-gray-100 dark:border-win-border">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Προϊόν</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Κατηγορία</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Απόθεμα</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Λόγος</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-win-border/50">
                    {items.map((p) => {
                      const cfg = getThresholdForCategory(p.category);
                      const qty = p.stockTotal ?? p.quantity ?? 0;
                      const { key } = getStockStatus(qty, cfg);
                      const warnDays = p.expirationWarningDays ?? 30;

                      const expiringBatches = (p.batches ?? []).filter((b) => {
                        if (!b.expirationDate || b.quantity <= 0) return false;
                        return dayjs(b.expirationDate).diff(today, "day") <= warnDays;
                      });

                      const reasons = [];
                      if (key === "out") reasons.push({ text: "Εξαντλημένο", color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30" });
                      else if (key === "low") reasons.push({ text: "Χαμηλό απόθεμα", color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30" });
                      expiringBatches.forEach((b) => {
                        const diff = dayjs(b.expirationDate).diff(today, "day");
                        const batchLabel = b.batchNumber ? ` #${b.batchNumber}` : "";
                        const text = diff < 0
                          ? `Παρτίδα${batchLabel} έληξε (${dayjs(b.expirationDate).format("DD/MM/YY")})`
                          : `Παρτίδα${batchLabel} λήγει σε ${diff} μέρες (${dayjs(b.expirationDate).format("DD/MM/YY")})`;
                        reasons.push({ text, color: diff < 0 ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30" : "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30" });
                      });

                      return (
                        <tr key={p._id} className="hover:bg-orange-50/20 dark:hover:bg-orange-900/10 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-100">{p.name}</td>
                          <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-xs">{p.category}</td>
                          <td className="px-4 py-2.5">
                            <StockBadge qty={qty} config={cfg} />
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-col gap-1">
                              {reasons.map((r, i) => (
                                <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${r.color}`}>
                                  {r.text.includes("λήγ") || r.text.includes("έληξ")
                                    ? <Clock className="w-3 h-3" />
                                    : <AlertTriangle className="w-3 h-3" />}
                                  {r.text}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default WishlistPanel;
