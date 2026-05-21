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

  // Φιλτράρουμε προϊόντα που χρειάζονται παραγγελία
  const needsReorder = products.filter((p) => {
    const cfg = getThresholdForCategory(p.category);
    const qty = p.stockTotal ?? p.quantity ?? 0;
    const { key } = getStockStatus(qty, cfg);
    if (key === "out" || key === "low") return true;

    // Έλεγχος παρτίδων για επικείμενη λήξη
    const warnDays = p.expirationWarningDays ?? 30;
    return p.batches?.some((b) => {
      if (!b.expirationDate || b.quantity <= 0) return false;
      const diff = dayjs(b.expirationDate).diff(today, "day");
      return diff <= warnDays;
    });
  });

  // Ομαδοποίηση ανά προμηθευτή
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            Λίστα Παραγγελίας
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {needsReorder.length === 0
              ? "Όλα τα προϊόντα είναι εντάξει"
              : `${needsReorder.length} προϊόντα χρειάζονται παραγγελία`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
            title="Ανανέωση"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Εκτύπωση
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-10 text-center text-sm text-gray-400">
          Φόρτωση...
        </div>
      ) : needsReorder.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-10 text-center">
          <ShoppingCart className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Δεν υπάρχουν προϊόντα για παραγγελία.</p>
        </div>
      ) : (
        supplierKeys.map((supplierName) => {
          const items = bySupplier[supplierName];
          const isCollapsed = collapsed[supplierName];

          return (
            <div key={supplierName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Supplier header */}
              <button
                type="button"
                onClick={() => toggleSupplier(supplierName)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 hover:from-orange-100 hover:to-amber-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold text-orange-800">{supplierName}</span>
                  <span className="text-xs text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
                    {items.length} προϊόντα
                  </span>
                </div>
                {isCollapsed
                  ? <ChevronDown className="w-4 h-4 text-orange-400" />
                  : <ChevronUp className="w-4 h-4 text-orange-400" />
                }
              </button>

              {!isCollapsed && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Προϊόν</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Κατηγορία</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Απόθεμα</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Λόγος</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
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
                      if (key === "out") reasons.push({ text: "Εξαντλημένο", color: "text-red-600 bg-red-50" });
                      else if (key === "low") reasons.push({ text: "Χαμηλό απόθεμα", color: "text-amber-700 bg-amber-50" });
                      expiringBatches.forEach((b) => {
                        const diff = dayjs(b.expirationDate).diff(today, "day");
                        const batchLabel = b.batchNumber ? ` #${b.batchNumber}` : "";
                        const text = diff < 0
                          ? `Παρτίδα${batchLabel} έληξε (${dayjs(b.expirationDate).format("DD/MM/YY")})`
                          : `Παρτίδα${batchLabel} λήγει σε ${diff} μέρες (${dayjs(b.expirationDate).format("DD/MM/YY")})`;
                        reasons.push({ text, color: diff < 0 ? "text-red-600 bg-red-50" : "text-amber-700 bg-amber-50" });
                      });

                      return (
                        <tr key={p._id} className="hover:bg-orange-50/20 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs">{p.category}</td>
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
