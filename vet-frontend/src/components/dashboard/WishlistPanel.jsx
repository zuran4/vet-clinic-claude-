import React, { useEffect, useRef, useState } from "react";
import { ShoppingCart, AlertTriangle, Clock, Printer, RefreshCw, ChevronDown, ChevronUp, Plus, X, Search } from "lucide-react";
import request from "@/api/apiClient.js";
import { useStockThresholds } from "@/hooks";
import { getStockStatus } from "@/utils/stock.js";
import StockBadge from "@/components/ui/StockBadge.jsx";
import dayjs from "dayjs";

const WishlistPanel = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [addingId, setAddingId] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [qtyInput, setQtyInput] = useState("");
  const addPanelRef = useRef(null);
  const { getThresholdForCategory } = useStockThresholds();

  useEffect(() => {
    if (!showAddPanel) return;
    const handleClickOutside = (e) => {
      if (addPanelRef.current && !addPanelRef.current.contains(e.target)) {
        setShowAddPanel(false);
        setSelectedCandidate(null);
        setAddSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddPanel]);

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
    if (p.manualReorder) return true;

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

  const reorderIds = new Set(needsReorder.map((p) => p._id));
  const addCandidates = products
    .filter((p) => !reorderIds.has(p._id))
    .filter((p) => p.name.toLowerCase().includes(addSearch.trim().toLowerCase()));

  const handleAddManual = async (productId, qty) => {
    try {
      setAddingId(productId);
      await request(`/products/${productId}`, {
        method: "PUT",
        body: { manualReorder: true, manualReorderQty: qty ? Number(qty) : null },
      });
      await fetchProducts();
      setAddSearch("");
      setSelectedCandidate(null);
      setQtyInput("");
      setShowAddPanel(false);
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveManual = async (productId) => {
    try {
      await request(`/products/${productId}`, { method: "PUT", body: { manualReorder: false } });
      await fetchProducts();
    } catch {
      // αγνόησε — η λίστα θα μείνει ως έχει αν αποτύχει
    }
  };

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

  const handlePrint = () => {
    const dateStr = dayjs().format("DD/MM/YYYY HH:mm");
    const refNo = `PO-${dayjs().format("YYYYMMDD-HHmm")}`;

    const buildReasons = (p) => {
      const cfg = getThresholdForCategory(p.category);
      const qty = p.stockTotal ?? p.quantity ?? 0;
      const { key } = getStockStatus(qty, cfg);
      const warnDays = p.expirationWarningDays ?? 30;
      const expiring = (p.batches ?? []).filter((b) => {
        if (!b.expirationDate || b.quantity <= 0) return false;
        return dayjs(b.expirationDate).diff(today, "day") <= warnDays;
      });
      const list = [];
      if (p.manualReorder) list.push({ text: "Χειροκίνητη προσθήκη", cls: "reason-manual" });
      if (key === "out") list.push({ text: "Εξαντλημένο", cls: "reason-critical" });
      else if (key === "low") list.push({ text: "Χαμηλό απόθεμα", cls: "reason-warn" });
      expiring.forEach((b) => {
        const diff = dayjs(b.expirationDate).diff(today, "day");
        const num = b.batchNumber ? ` #${b.batchNumber}` : "";
        list.push({
          text: diff < 0
            ? `Παρτίδα${num} έληξε (${dayjs(b.expirationDate).format("DD/MM/YY")})`
            : `Παρτίδα${num} λήγει σε ${diff}η (${dayjs(b.expirationDate).format("DD/MM/YY")})`,
          cls: diff < 0 ? "reason-critical" : "reason-warn",
        });
      });
      return list;
    };

    const sections = supplierKeys.map((supplierName, si) => {
      const items = bySupplier[supplierName];
      const rows = items.map((p, pi) => {
        const cfg = getThresholdForCategory(p.category);
        const qty = p.stockTotal ?? p.quantity ?? 0;
        const { key, label } = getStockStatus(qty, cfg);
        const stockCls = key === "out" ? "s-out" : key === "low" ? "s-low" : "s-ok";
        const reasons = buildReasons(p);
        const reasonsHtml = reasons.map(r =>
          `<span class="reason ${r.cls}">${r.text}</span>`
        ).join("");
        const orderQtyHtml = p.manualReorderQty
          ? `<strong>${p.manualReorderQty}${p.unit ? " " + p.unit : ""}</strong>`
          : `<div class="order-line"></div>`;
        return `<tr class="${pi % 2 === 1 ? "row-alt" : ""}">
          <td class="td-name">${p.name}</td>
          <td class="td-cat">${p.category || "—"}</td>
          <td class="td-stock"><span class="stock-val ${stockCls}">${label}</span><span class="stock-qty">${qty}</span></td>
          <td class="td-reason">${reasonsHtml}</td>
          <td class="td-order">${orderQtyHtml}</td>
        </tr>`;
      }).join("");

      return `<div class="section">
        <div class="sec-header">
          <div class="sec-left">
            <span class="sec-num">${String(si + 1).padStart(2, "0")}</span>
            <span class="sec-name">${supplierName}</span>
          </div>
          <span class="sec-badge">${items.length} προϊόντα</span>
        </div>
        <table>
          <thead><tr>
            <th style="width:22%">Προϊόν</th>
            <th style="width:14%">Κατηγορία</th>
            <th style="width:15%">Απόθεμα</th>
            <th style="width:33%">Λόγος Παραγγελίας</th>
            <th style="width:16%">Ποσ. Παραγγελίας</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="el"><head>
<meta charset="UTF-8">
<title>${refNo} — Λίστα Παραγγελίας</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:14mm 18mm}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:11px;color:#1f2937;background:#fff;padding:14mm 18mm;padding-top:28mm}

/* ── Header ── */
.doc-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;margin-bottom:6px}
.brand{display:flex;align-items:center;gap:10px}
.brand-icon{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#f97316,#fbbf24);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.brand-name{font-size:17px;font-weight:700;color:#111827;letter-spacing:-.3px}
.brand-sub{font-size:9.5px;color:#9ca3af;margin-top:2px;text-transform:uppercase;letter-spacing:.05em}
.doc-meta{text-align:right}
.doc-label{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;font-weight:700}
.doc-title{font-size:16px;font-weight:800;color:#ea580c;letter-spacing:-.2px;margin:2px 0}
.doc-ref{font-size:9.5px;color:#6b7280;font-family:monospace}
.doc-date{font-size:10px;color:#374151;margin-top:4px;font-weight:600}
.rule{height:3px;background:linear-gradient(90deg,#f97316 0%,#fbbf24 60%,#fff 100%);border-radius:2px;margin-bottom:14px}

/* ── Summary bar ── */
.summary{display:flex;gap:0;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:18px}
.sum-item{flex:1;padding:8px 12px;border-right:1px solid #e5e7eb;background:#fafafa}
.sum-item:last-child{border-right:none}
.sum-label{font-size:8.5px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:700;margin-bottom:3px}
.sum-val{font-size:15px;font-weight:800;color:#111827}
.sum-val.red{color:#dc2626}

/* ── Sections ── */
.section{margin-bottom:18px;page-break-inside:avoid;break-inside:avoid}
.sec-header{display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#f97316,#fb923c);color:#fff;padding:8px 14px;border-radius:5px 5px 0 0}
.sec-left{display:flex;align-items:center;gap:10px}
.sec-num{font-size:10px;font-weight:800;opacity:.7;letter-spacing:.05em}
.sec-name{font-size:12.5px;font-weight:700}
.sec-badge{font-size:9px;background:rgba(255,255,255,.25);padding:2px 9px;border-radius:20px;font-weight:700}

/* ── Table ── */
table{width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 5px 5px;overflow:hidden}
thead tr{background:#fafafa}
th{padding:6px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;text-align:left;border-bottom:1.5px solid #e5e7eb;border-right:1px solid #f3f4f6}
th:last-child{border-right:none}
td{padding:7.5px 10px;vertical-align:top;border-bottom:1px solid #f3f4f6;border-right:1px solid #f9fafb}
td:last-child{border-right:none}
.row-alt td{background:#fafafa}
tr:last-child td{border-bottom:none}
.td-name{font-weight:600;color:#111827;font-size:11.5px}
.td-cat{color:#6b7280;font-size:10px}
.td-stock{white-space:nowrap}
.stock-val{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:2px 6px;border-radius:3px;display:inline-block;margin-bottom:2px}
.stock-qty{display:block;font-size:13px;font-weight:800;color:#111827}
.s-out .stock-val,.s-out+.stock-qty{background:#fee2e2;color:#dc2626}
.s-out{background:#fee2e2;color:#dc2626}
.s-low{background:#fef3c7;color:#d97706}
.s-ok{background:#d1fae5;color:#059669}
.td-reason{font-size:10px;line-height:1.6}
.reason{display:block;padding:1px 0}
.reason-critical{color:#dc2626}
.reason-warn{color:#d97706}
.reason-manual{color:#2563eb}
.td-order{width:16%;border-left:1.5px dashed #d1d5db !important;background:#fffbeb !important;vertical-align:middle}
.order-line{height:1px;border-bottom:1px solid #d1d5db;margin:18px 8px 4px}

/* ── Signatures ── */
.sigs{display:flex;gap:16px;margin-top:22px}
.sig-box{flex:1;border:1px solid #e5e7eb;border-radius:5px;padding:10px 14px 8px}
.sig-lbl{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:26px}
.sig-line{border-top:1px solid #d1d5db;padding-top:5px;font-size:9px;color:#9ca3af}

/* ── Footer ── */
.footer{margin-top:18px;padding-top:10px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:9px;color:#9ca3af}

@media print{
  body{padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .section{page-break-inside:avoid}
  .close-btn{display:none}
}
.close-btn{position:fixed;top:14px;right:14px;z-index:9999;width:78px;height:78px;border-radius:50%;background:#fff;border:2px solid #e5e7eb;box-shadow:0 3px 12px rgba(0,0,0,.18);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:39px;color:#6b7280;line-height:1;padding:0}
.close-btn:hover{background:#f3f4f6;color:#111827}
</style></head><body>
<button class="close-btn" onclick="window.close()" title="Κλείσιμο">&#x2715;</button>

<div class="doc-header">
  <div class="brand">
    <div class="brand-icon">🐾</div>
    <div>
      <div class="brand-name">Κτηνιατρείο</div>
      <div class="brand-sub">Σύστημα Διαχείρισης</div>
    </div>
  </div>
  <div class="doc-meta">
    <div class="doc-label">Έγγραφο Παραγγελίας</div>
    <div class="doc-title">Λίστα Παραγγελίας</div>
    <div class="doc-ref">${refNo}</div>
    <div class="doc-date">${dateStr}</div>
  </div>
</div>
<div class="rule"></div>

<div class="summary">
  <div class="sum-item">
    <div class="sum-label">Προμηθευτές</div>
    <div class="sum-val">${supplierKeys.length}</div>
  </div>
  <div class="sum-item">
    <div class="sum-label">Προϊόντα</div>
    <div class="sum-val">${needsReorder.length}</div>
  </div>
  <div class="sum-item">
    <div class="sum-label">Κατάσταση</div>
    <div class="sum-val red">Εκκρεμεί</div>
  </div>
  <div class="sum-item">
    <div class="sum-label">Ημερομηνία</div>
    <div class="sum-val" style="font-size:11px;margin-top:3px">${dayjs().format("DD MMM YYYY")}</div>
  </div>
</div>

${sections}

<div class="sigs">
  <div class="sig-box"><div class="sig-lbl">Συντάχθηκε από</div><div class="sig-line">Υπογραφή / Ημερομηνία</div></div>
  <div class="sig-box"><div class="sig-lbl">Εγκρίθηκε από</div><div class="sig-line">Υπογραφή / Ημερομηνία</div></div>
  <div class="sig-box"><div class="sig-lbl">Παραλήφθηκε</div><div class="sig-line">Υπογραφή / Ημερομηνία</div></div>
</div>

<div class="footer">
  <span>Εκτυπώθηκε: ${dateStr}</span>
  <span>${refNo}</span>
  <span>Εμπιστευτικό · Για εσωτερική χρήση</span>
</div>
</body></html>`;

    const win = window.open("", "_blank", "width=1000,height=780");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const toggleSupplier = (key) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-[13.41px]">
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
        <div className="flex items-center gap-2 relative" ref={addPanelRef}>
          <button
            onClick={() => {
              setShowAddPanel((v) => !v);
              setSelectedCandidate(null);
            }}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors ${
              showAddPanel
                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                : "bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300"
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Προσθήκη
          </button>
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

          {showAddPanel && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border shadow-lg z-20 overflow-hidden">
              {selectedCandidate ? (
                <div className="p-3">
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-2"
                  >
                    ← πίσω
                  </button>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                    {selectedCandidate.name}
                  </p>
                  <label className="text-xs text-gray-400 dark:text-gray-500 mb-1 block">
                    Ποσότητα παραγγελίας {selectedCandidate.unit ? `(${selectedCandidate.unit})` : ""}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="number"
                      min="0"
                      step="any"
                      value={qtyInput}
                      onChange={(e) => setQtyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddManual(selectedCandidate._id, qtyInput);
                      }}
                      placeholder="π.χ. 5"
                      className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-win-border bg-gray-50 dark:bg-win-elevated text-gray-800 dark:text-gray-100 outline-none focus:ring-1 focus:ring-blue-300"
                    />
                    <button
                      onClick={() => handleAddManual(selectedCandidate._id, qtyInput)}
                      disabled={addingId === selectedCandidate._id}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                    >
                      Προσθήκη
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-2 border-b border-gray-100 dark:border-win-border relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      autoFocus
                      value={addSearch}
                      onChange={(e) => setAddSearch(e.target.value)}
                      placeholder="Αναζήτηση προϊόντος..."
                      className="w-full pl-8 pr-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-win-border bg-gray-50 dark:bg-win-elevated text-gray-800 dark:text-gray-100 outline-none focus:ring-1 focus:ring-blue-300"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {addCandidates.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">
                        Δεν βρέθηκαν προϊόντα.
                      </p>
                    ) : (
                      addCandidates.map((p) => (
                        <button
                          key={p._id}
                          onClick={() => {
                            setSelectedCandidate(p);
                            setQtyInput("");
                          }}
                          className="w-full flex items-center justify-between px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <span className="text-gray-700 dark:text-gray-200">{p.name}</span>
                          <span className="text-xs text-gray-400">{p.category}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
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
                className="w-full flex items-center justify-between px-4 py-[10.05px] bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 border-b border-orange-100 dark:border-orange-800/30 hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-900/40 dark:hover:to-amber-900/30 transition-colors"
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
                <>
                  {/* Desktop: πίνακας με Κατηγορία */}
                  <table className="hidden sm:table w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-win-elevated/50 border-b border-gray-100 dark:border-win-border">
                        <th className="px-4 py-[6.71px] text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Προϊόν</th>
                        <th className="px-4 py-[6.71px] text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Κατηγορία</th>
                        <th className="px-4 py-[6.71px] text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Απόθεμα</th>
                        <th className="px-4 py-[6.71px] text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Λόγος</th>
                        <th className="px-4 py-[6.71px] text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Ποσότητα</th>
                        <th className="px-4 py-[6.71px] w-8"></th>
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
                        if (p.manualReorder) reasons.push({ text: "Χειροκίνητη προσθήκη", color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30" });
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
                            <td className="px-4 py-[8.38px] font-medium text-gray-800 dark:text-gray-100">{p.name}</td>
                            <td className="px-4 py-[8.38px] text-gray-500 dark:text-gray-400 text-xs">{p.category}</td>
                            <td className="px-4 py-[8.38px]"><StockBadge qty={qty} config={cfg} /></td>
                            <td className="px-4 py-[8.38px]">
                              <div className="flex flex-col gap-[3.35px]">
                                {reasons.map((r, i) => (
                                  <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${r.color}`}>
                                    {r.text.includes("λήγ") || r.text.includes("έληξ") ? <Clock className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                    {r.text}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-[8.38px] text-sm font-semibold text-gray-700 dark:text-gray-200">
                              {p.manualReorderQty ? `${p.manualReorderQty}${p.unit ? " " + p.unit : ""}` : "—"}
                            </td>
                            <td className="px-2 py-[8.38px]">
                              {p.manualReorder && (
                                <button
                                  onClick={() => handleRemoveManual(p._id)}
                                  className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  title="Αφαίρεση από τη λίστα"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Mobile: ομαδοποίηση κατά κατηγορία, χωρίς στήλη Κατηγορία */}
                  <div className="sm:hidden">
                    {Object.entries(
                      items.reduce((acc, p) => {
                        const cat = p.category || "Άλλο";
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(p);
                        return acc;
                      }, {})
                    ).map(([category, catItems]) => (
                      <div key={category}>
                        <div className="px-4 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 border-y border-amber-200 dark:border-amber-700/50 uppercase tracking-wider">
                          {category}
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-win-elevated/50 border-b border-gray-100 dark:border-win-border">
                              <th className="px-4 py-[6.71px] text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Προϊόν</th>
                              <th className="px-4 py-[6.71px] text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Απόθεμα</th>
                              <th className="px-4 py-[6.71px] text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Λόγος</th>
                              <th className="px-4 py-[6.71px] text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Ποσότητα</th>
                              <th className="px-2 py-[6.71px] w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-win-border/50">
                            {catItems.map((p) => {
                              const cfg = getThresholdForCategory(p.category);
                              const qty = p.stockTotal ?? p.quantity ?? 0;
                              const { key } = getStockStatus(qty, cfg);
                              const warnDays = p.expirationWarningDays ?? 30;
                              const expiringBatches = (p.batches ?? []).filter((b) => {
                                if (!b.expirationDate || b.quantity <= 0) return false;
                                return dayjs(b.expirationDate).diff(today, "day") <= warnDays;
                              });
                              const reasons = [];
                              if (p.manualReorder) reasons.push({ text: "Χειροκίνητη προσθήκη", color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30" });
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
                                  <td className="px-4 py-[8.38px] font-medium text-gray-800 dark:text-gray-100">{p.name}</td>
                                  <td className="px-4 py-[8.38px]"><StockBadge qty={qty} config={cfg} mobileStack /></td>
                                  <td className="px-4 py-[8.38px]">
                                    <div className="flex flex-col gap-[3.35px]">
                                      {reasons.map((r, i) => (
                                        <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${r.color}`}>
                                          {r.text.includes("λήγ") || r.text.includes("έληξ") ? <Clock className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                          {r.text}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-4 py-[8.38px] text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    {p.manualReorderQty ? `${p.manualReorderQty}${p.unit ? " " + p.unit : ""}` : "—"}
                                  </td>
                                  <td className="px-2 py-[8.38px]">
                                    {p.manualReorder && (
                                      <button
                                        onClick={() => handleRemoveManual(p._id)}
                                        className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        title="Αφαίρεση από τη λίστα"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default WishlistPanel;
