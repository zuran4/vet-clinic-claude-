// src/components/products/ProductList.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Edit, Trash2, Plus, Minus, Download, ChevronRight, Upload } from "lucide-react";
import Button from "../ui/button.jsx";
import SearchBar from "../ui/SearchBar.jsx";
import ProductModal from "./ProductModal.jsx";
import ProductImportModal from "./ProductImportModal.jsx";
import QuickStockModal from "./QuickStockModal.jsx";
import BatchList from "../dashboard/BatchList.jsx";
import PurchaseHistoryList from "./PurchaseHistoryList.jsx";
import { useProductList } from "../../hooks/useProductList.jsx";
import StockBadge from "@/components/ui/StockBadge.jsx";
import { getStockStatus } from "@/utils/stock.js";
import { useStockThresholds } from "@/hooks";

const ProductList = () => {
  const { products, setProducts, fetchProducts, handleDeleteProduct, importProducts } = useProductList();
  const { getThresholdForCategory } = useStockThresholds();

  const [showForm, setShowForm]           = useState(false);
  const [productId, setProductId]         = useState(null);
  const [initialTab, setInitialTab]       = useState("info");
  const [quickStockProduct, setQuickStockProduct] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const BATCHED_CATEGORIES = ["Τροφή", "Φάρμακο"];
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [batchRefreshKeys, setBatchRefreshKeys] = useState({});

  useEffect(() => {
    const openModal = () => {
      setProductId(null);
      setShowForm(true);
    };
    document.addEventListener("openProductModal", openModal);
    return () => document.removeEventListener("openProductModal", openModal);
  }, []);

  const uniqueCategories = [...new Set(products.map((p) => p?.category).filter(Boolean))];

  const lower = (v) => (typeof v === "string" ? v.toLowerCase() : "");
  const q = (searchTerm ?? "").trim().toLowerCase();


  // Εξαγωγή CSV για χαμηλά/εξαντλημένα
  function exportCsv(rows) {
    const headers = ["Όνομα", "Κατηγορία", "Barcode", "Ποσότητα", "Τιμή Λιανικής", "Κατάσταση"];
    const lines = [headers.join(",")];
    rows.forEach((p) => {
      const cfg = getThresholdForCategory(p?.category);
      const totalQty = p?.stockTotal ?? p?.quantity ?? 0;
      const { label } = getStockStatus(totalQty, cfg);
      const values = [
        (p?.name ?? "").replaceAll('"', '""'),
        (p?.category ?? "").replaceAll('"', '""'),
        String(p?.barcode ?? ""),
        String(totalQty),
        p?.retailPrice != null ? Number(p.retailPrice).toFixed(2) : "",
        label,
      ];
      lines.push(values.map((v) => `"${v}"`).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "apografi_low_out.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Σταθερό callback για ενημέρωση ποσότητας από BatchList
  const handleBatchTotal = useCallback((id, total) => {
  setProducts((prev) =>
    prev.map((p) =>
      p._id === id
        ? {
            ...p,
            stockTotal: total,
            quantity: total,
            batchesCount: p.batchesCount ?? 1, // αν άνοιξες παρτίδες, τουλάχιστον 1
          }
        : p
    )
  );
}, [setProducts]);


  // Φίλτρα
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      q === "" ||
      lower(p?.name).includes(q) ||
      (p?.barcode ?? "").toString().includes(q) ||
      lower(p?.category).includes(q);

    const matchesCategory = selectedCategory === "all" || p?.category === selectedCategory;

    const cfg = getThresholdForCategory(p?.category);
    const totalQty = p?.stockTotal ?? p?.quantity ?? 0;
    const statusKey = getStockStatus(totalQty, cfg).key;
    const matchesStatus = selectedStatus === "all" || statusKey === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <>
      {/* 🔹 Search + Filters + Quick Actions */}
      <div className="bg-white dark:bg-win-surface rounded-2xl shadow p-4 mb-3 flex flex-wrap items-center gap-3 justify-between">
        {/* Αριστερά: Αναζήτηση + Φίλτρα */}
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Αναζήτηση (barcode, όνομα, κατηγορία)"
            className="flex-1 min-w-[250px] md:max-w-md"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-200 dark:border-win-border-light px-3 py-2 rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 min-w-[150px]"
            aria-label="Φίλτρο κατηγορίας"
          >
            <option value="all">Όλες οι Κατηγορίες</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-200 dark:border-win-border-light px-3 py-2 rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 min-w-[150px]"
            aria-label="Φίλτρο κατάστασης αποθέματος"
          >
            <option value="all">Όλες οι Καταστάσεις</option>
            <option value="out">Εξαντλημένο</option>
            <option value="low">Χαμηλό</option>
            <option value="ok">Εντάξει</option>
            <option value="high">Υψηλό</option>
          </select>
        </div>

        {/* Δεξιά: actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowImportModal(true)}
            title="Εισαγωγή προϊόντων από CSV"
          >
            <Upload className="w-4 h-4" />
            Εισαγωγή CSV
          </Button>
          <button
            type="button"
            onClick={() => {
              const rows = products.filter((p) => {
                const cfg = getThresholdForCategory(p?.category);
                const totalQty = p?.stockTotal ?? p?.quantity ?? 0;
                const k = getStockStatus(totalQty, cfg).key;
                return k === "out" || k === "low";
              });
              exportCsv(rows);
            }}
            title="Λήψη CSV: Χαμηλά/Εξαντλημένα"
            aria-label="Λήψη CSV"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 dark:border-win-border-light shadow-sm hover:bg-gray-100 dark:hover:bg-win-elevated active:scale-95 transition"
          >
            <Download className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

      </div>

    
      {/* 🔹 Πίνακας Προϊόντων */}
      <div className="overflow-x-auto bg-white dark:bg-win-surface rounded-2xl shadow">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-b border-orange-100 dark:border-orange-800/30 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Όνομα</th>
              <th className="px-4 py-3 text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Κατηγορία</th>
              <th className="px-4 py-3 text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Barcode</th>
              <th className="px-4 py-3 text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Ποσότητα</th>
              <th className="px-4 py-3 text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Τιμή</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Ενέργειες</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const cfg = getThresholdForCategory(product?.category);
                return (
                  <React.Fragment key={product._id}>
                    <tr className="border-b border-gray-50 dark:border-win-border/50 hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition">
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <button
                          onClick={() =>
                            setExpandedProduct(expandedProduct === product._id ? null : product._id)
                          }
                          className="flex-shrink-0 transition-transform duration-200"
                          style={{ transform: expandedProduct === product._id ? "rotate(90deg)" : "rotate(0deg)" }}
                          aria-label="Ιστορικό αγορών"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-300 hover:text-orange-400 transition-colors" />
                        </button>

                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{product.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 font-mono">{product.barcode || "—"}</td>
                      <td className="px-4 py-3">
                        <StockBadge qty={product.stockTotal ?? product.quantity ?? 0} config={cfg} />
                      </td>
                      <td className="px-4 py-3">
                        {product.retailPrice != null
                          ? <span className="text-sm font-semibold text-emerald-600">{Number(product.retailPrice).toFixed(2)} €</span>
                          : <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            title="Προσθήκη Αποθέματος"
                            onClick={() => {
                              if (BATCHED_CATEGORIES.includes(product.category)) {
                                setProductId(product._id);
                                setInitialTab("stock");
                                setShowForm(true);
                              } else {
                                setQuickStockProduct(product);
                              }
                            }}
                            className="p-2 rounded-xl bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-500 dark:text-orange-400 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            title="Επεξεργασία"
                            onClick={() => { setProductId(product._id); setInitialTab("info"); setShowForm(true); }}
                            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            title="Διαγραφή"
                            onClick={() => handleDeleteProduct(product._id)}
                            className="p-2 rounded-xl bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 dark:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedProduct === product._id && (
                      <tr>
                        <td colSpan="6" className="bg-gray-50 dark:bg-win-elevated/50 px-6 py-4">
                          {BATCHED_CATEGORIES.includes(product.category) ? (
                            <BatchList
                              key={batchRefreshKeys[product._id] || 0}
                              productId={product._id}
                              isOpen={true}
                              onQuantity={handleBatchTotal}
                              summaryQty={product.stockTotal ?? product.quantity ?? 0}
                              category={product.category}
                            />
                          ) : (
                            <PurchaseHistoryList
                              key={batchRefreshKeys[product._id] || 0}
                              productId={product._id}
                              isOpen={true}
                              onQuantity={handleBatchTotal}
                              summaryQty={product.stockTotal ?? product.quantity ?? 0}
                              category={product.category}
                            />
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Δεν βρέθηκαν προϊόντα.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Stock Modal (για μη-batched προϊόντα) */}
      {quickStockProduct && (
        <QuickStockModal
          product={quickStockProduct}
          onSave={(updated) => {
            if (updated?.productId) {
              setProducts((prev) =>
                prev.map((p) =>
                  p._id === updated.productId
                    ? { ...p, stockTotal: updated.quantity, quantity: updated.quantity }
                    : p
                )
              );
              setBatchRefreshKeys((prev) => ({
                ...prev,
                [updated.productId]: (prev[updated.productId] || 0) + 1,
              }));
            }
            setQuickStockProduct(null);
          }}
          onClose={() => setQuickStockProduct(null)}
        />
      )}

      {/* 🔹 Modal Προϊόντος */}
      {showForm && (
        <ProductModal
          productId={productId}
          initialTab={initialTab}
          onSave={(payload) => {
            // Περίπτωση Α: ήρθε full product (create/update info)
            if (payload && payload._id) {
              setProducts((prev) =>
  prev.some((p) => p._id === payload._id)
    ? prev.map((p) =>
        p._id === payload._id
          ? {
              ...p,
              ...payload,
              batchesCount: payload.batchesCount ?? p.batchesCount ?? 0,
            }
          : p
      )
    : [...prev, { ...payload, batchesCount: payload.batchesCount ?? 0 }]
);

              setShowForm(false);
              return;
            }

            // Περίπτωση Β: ήρθε αποτέλεσμα παρτίδων { productId, quantity, batches }
            if (payload && payload.productId) {
              setProducts((prev) =>
                prev.map((p) =>
                  p._id === payload.productId
                    ? { ...p, stockTotal: payload.quantity, quantity: payload.quantity }
                    : p
                )
              );
              // Αύξηση key → το BatchList κάνει remount και ξαναφορτώνει
              setBatchRefreshKeys((prev) => ({
                ...prev,
                [payload.productId]: (prev[payload.productId] || 0) + 1,
              }));
              setShowForm(false);
              return;
            }


            // Fallback: κλείσιμο χωρίς αλλαγή
            setShowForm(false);
          }}
          onClose={() => {
            setShowForm(false);
            setProductId(null);
            setInitialTab("info");
          }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ProductImportModal
          onClose={() => setShowImportModal(false)}
          onImport={importProducts}
        />
      )}
    </>
  );
};

export default ProductList;
