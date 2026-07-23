import React, { useState, useEffect, useRef } from "react";
import { ShoppingBag, User, UserX, PackageSearch, X, Check, Search, Plus, CheckCircle2, RefreshCw, ScanBarcode } from "lucide-react";
import ExportCart from "../ui/ExportCart.jsx";
import CustomerPurchasesModal from "../customers/CustomerPurchasesModal.jsx";
import BarcodeScannerModal from "./BarcodeScannerModal.jsx";
import request from "@/api/apiClient.js";

const INPUT = "w-full border border-gray-200 dark:border-win-border-light rounded-2xl pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";

const ProductExport = () => {
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [customerQuery, setCustomerQuery] = useState("");
  const [debouncedCustomerQuery, setDebouncedCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showCustomerResults, setShowCustomerResults] = useState(false);

  const [productQuery, setProductQuery] = useState("");
  const [debouncedProductQuery, setDebouncedProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showProductResults, setShowProductResults] = useState(false);

  const [showPurchases, setShowPurchases] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState("");

  const customerRef = useRef(null);
  const productRef = useRef(null);
  const productInputRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (customerRef.current && !customerRef.current.contains(e.target)) setShowCustomerResults(false);
      if (productRef.current && !productRef.current.contains(e.target)) setShowProductResults(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCustomerQuery(customerQuery), 300);
    return () => clearTimeout(t);
  }, [customerQuery]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedProductQuery(productQuery), 300);
    return () => clearTimeout(t);
  }, [productQuery]);

  useEffect(() => {
    if (debouncedCustomerQuery.trim().length === 0) return;
    let cancelled = false;
    const doFetch = async () => {
      try {
        setLoadingCustomers(true);
        const data = await request(`/customers?search=${encodeURIComponent(debouncedCustomerQuery)}`);
        if (!cancelled) {
          setCustomerResults(Array.isArray(data) ? data : (data.data ?? []));
          setShowCustomerResults(true);
        }
      } catch {
        if (!cancelled) setCustomerResults([]);
      } finally {
        if (!cancelled) setLoadingCustomers(false);
      }
    };
    doFetch();
    return () => { cancelled = true; };
  }, [debouncedCustomerQuery]);

  useEffect(() => {
    if (debouncedProductQuery.trim().length === 0) return;
    let cancelled = false;
    const doFetch = async () => {
      try {
        setLoadingProducts(true);
        const data = await request(`/products?search=${encodeURIComponent(debouncedProductQuery)}`);
        if (!cancelled) {
          setProductResults(Array.isArray(data) ? data : (data.data ?? []));
          setShowProductResults(true);
        }
      } catch {
        if (!cancelled) setProductResults([]);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    };
    doFetch();
    return () => { cancelled = true; };
  }, [debouncedProductQuery]);

  const addToCart = (prod) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === prod._id);
      if (exists) return prev.map((p) => p.id === prod._id ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { id: prod._id, name: prod.name, quantity: 1 }];
    });
    setProductQuery("");
    setProductResults([]);
    setShowProductResults(false);
    setTimeout(() => productInputRef.current?.focus(), 50);
  };

  const handleBarcodeScanned = async (decodedText) => {
    setShowScanner(false);
    const code = (decodedText ?? "").trim();
    if (!code) return;
    try {
      const data = await request(`/products?search=${encodeURIComponent(code)}`);
      const results = Array.isArray(data) ? data : (data.data ?? []);
      const match = results.find((p) => (p?.barcode ?? "").toString().trim() === code) || results[0];
      if (match) {
        addToCart(match);
      } else {
        setScanError(`Δεν βρέθηκε προϊόν με barcode "${code}".`);
      }
    } catch {
      setScanError("Αποτυχία αναζήτησης προϊόντος.");
    }
  };

  const handleExport = async () => {
    if ((!selectedCustomer && !isAnonymous) || cart.length === 0) return;
    try {
      setLoading(true);
      if (isAnonymous) {
        // Ανώνυμη πώληση: μόνο μείωση αποθέματος, χωρίς εγγραφή σε ιστορικό πελάτη.
        for (const p of cart) {
          await request(`/products/export`, {
            method: "POST",
            body: { productId: p.id, quantity: p.quantity },
          });
        }
      } else {
        await request(`/customers/${selectedCustomer._id}/purchases`, {
          method: "POST",
          body: { products: cart.map((p) => ({ product: p.id, quantity: p.quantity })) },
        });
      }
      setSuccess(true);
    } catch (err) {
      alert("❌ Απέτυχε η καταχώρηση.\n" + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCart([]);
    setSelectedCustomer(null);
    setIsAnonymous(true);
    setSuccess(false);
    setCustomerQuery("");
  };

  // ── Success screen ──
  if (success) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Επιτυχής Καταχώρηση</p>
              <p className="text-white font-bold text-base leading-tight mt-0.5">Η πώληση καταχωρήθηκε!</p>
            </div>
          </div>
          <div className="px-5 py-5 space-y-3">
            <div className="bg-gray-50 dark:bg-win-elevated/50 rounded-xl border border-gray-100 dark:border-win-border-light p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm pb-2 border-b border-gray-100 dark:border-win-border">
                {isAnonymous ? (
                  <>
                    <UserX className="w-4 h-4 text-gray-400" />
                    <span className="font-bold text-gray-500 dark:text-gray-400">Ανώνυμη πώληση</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-gray-800 dark:text-gray-100">{selectedCustomer?.name}</span>
                  </>
                )}
              </div>
              {cart.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-200">{p.name}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">x{p.quantity}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleReset}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-bold shadow-md active:scale-95 transition"
            >
              <RefreshCw className="w-4 h-4" /> Νέα Πώληση
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-3xl mx-auto">

      {/* ── Πελάτης ── */}
      <div className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border shadow-sm">
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/20 border-b border-indigo-100 dark:border-indigo-700/50 px-4 py-3 flex items-center gap-2 rounded-t-2xl">
          <User className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Πελάτης</span>
        </div>

        {/* Επιλογή τρόπου: Ανώνυμη Πώληση / Υπάρχων Πελάτης */}
        <div className="px-4 pt-3">
          <div className="inline-flex p-1 gap-1 bg-gray-100 dark:bg-win-elevated2 rounded-xl">
            <button
              type="button"
              onClick={() => { setIsAnonymous(true); setSelectedCustomer(null); setCustomerQuery(""); setShowCustomerResults(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isAnonymous
                  ? "bg-white dark:bg-win-surface text-gray-700 dark:text-gray-200 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <UserX className="w-3.5 h-3.5" /> Ανώνυμη Πώληση
            </button>
            <button
              type="button"
              onClick={() => setIsAnonymous(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                !isAnonymous
                  ? "bg-white dark:bg-win-surface text-indigo-700 dark:text-indigo-300 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <User className="w-3.5 h-3.5" /> Υπάρχων Πελάτης
            </button>
          </div>
        </div>

        <div className="px-4 pb-4 pt-3">
          <div ref={customerRef} className="relative">
            {isAnonymous ? (
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-win-elevated/50 rounded-xl px-3 py-3 border border-dashed border-gray-200 dark:border-win-border-light">
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-win-elevated2 flex items-center justify-center flex-shrink-0">
                  <UserX className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                  Η πώληση θα καταχωρηθεί χωρίς στοιχεία πελάτη — μόνο μείωση αποθέματος, χωρίς εγγραφή σε ιστορικό αγορών.
                </p>
              </div>
            ) : selectedCustomer ? (
              <div className="flex items-center justify-between gap-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-3 py-2.5 border border-indigo-100 dark:border-indigo-700/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-300">
                      {selectedCustomer.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{selectedCustomer.name}</p>
                    {selectedCustomer.phone && <p className="text-xs text-gray-400 dark:text-gray-500">{selectedCustomer.phone}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setShowPurchases(true)}
                    className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                  >
                    <ShoppingBag className="w-3 h-3" /> Ιστορικό
                  </button>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-500" />
                <input
                  type="text"
                  value={customerQuery}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCustomerQuery(v);
                    if (v.trim().length === 0) { setCustomerResults([]); setShowCustomerResults(false); }
                  }}
                  onFocus={() => { if (customerQuery.trim().length > 0 && customerResults.length > 0) setShowCustomerResults(true); }}
                  placeholder="Αναζήτηση πελάτη..."
                  className={`${INPUT} focus:ring-indigo-300`}
                />
                {showCustomerResults && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white dark:bg-win-surface border border-gray-100 dark:border-win-border rounded-2xl shadow-lg overflow-hidden">
                    {loadingCustomers ? (
                      <div className="p-3 text-xs text-gray-400 text-center">Αναζήτηση...</div>
                    ) : customerResults.length > 0 ? (
                      <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50 dark:divide-win-border">
                        {customerResults.map((c) => (
                          <li key={c._id}>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex items-center gap-3"
                              onClick={() => { setSelectedCustomer(c); setCustomerQuery(""); setShowCustomerResults(false); }}
                            >
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-500">
                                {c.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-sm text-gray-800 dark:text-gray-100">{c.name}</div>
                                {c.phone && <div className="text-xs text-gray-400 dark:text-gray-500">{c.phone}</div>}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-3 text-xs text-gray-400 text-center">Δεν βρέθηκαν πελάτες.</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Προϊόντα ── */}
      <div className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border shadow-sm">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/20 border-b border-emerald-100 dark:border-emerald-700/50 px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <PackageSearch className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Προϊόντα</span>
          </div>
          {cart.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              {cart.length} {cart.length === 1 ? "προϊόν" : "προϊόντα"} · {cart.reduce((s, p) => s + p.quantity, 0)} τεμ.
            </span>
          )}
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className="relative" ref={productRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-500" />
            <input
              ref={productInputRef}
              type="text"
              value={productQuery}
              onChange={(e) => {
                const v = e.target.value;
                setProductQuery(v);
                if (v.trim().length === 0) { setProductResults([]); setShowProductResults(false); }
              }}
              onFocus={() => { if (productQuery.trim().length > 0 && productResults.length > 0) setShowProductResults(true); }}
              placeholder={cart.length > 0 ? "Προσθήκη άλλου προϊόντος..." : "Αναζήτηση προϊόντος..."}
              className={`${INPUT} focus:ring-emerald-300 sm:pr-3 pr-10`}
            />
            <button
              type="button"
              onClick={() => { setScanError(""); setShowScanner(true); }}
              title="Σάρωση barcode με κάμερα"
              className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center justify-center transition-colors"
            >
              <ScanBarcode className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </button>
            {showProductResults && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white dark:bg-win-surface border border-gray-100 dark:border-win-border rounded-2xl shadow-lg overflow-hidden">
                {loadingProducts ? (
                  <div className="p-3 text-xs text-gray-400 text-center">Αναζήτηση...</div>
                ) : productResults.length > 0 ? (
                  <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50 dark:divide-win-border">
                    {productResults.map((prod) => (
                      <li key={prod._id}>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-between gap-3"
                          onClick={() => addToCart(prod)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                              <Plus className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                            </div>
                            <span className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{prod.name}</span>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">απόθ. {prod.quantity ?? prod.stockTotal ?? 0}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-xs text-gray-400 text-center">Δεν βρέθηκαν προϊόντα.</div>
                )}
              </div>
            )}
          </div>

          {scanError && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{scanError}</p>
          )}

          <ExportCart items={cart} onChange={setCart} />
        </div>
      </div>

      {/* ── Επιβεβαίωση ── */}
      <button
        type="button"
        onClick={handleExport}
        disabled={(!selectedCustomer && !isAnonymous) || cart.length === 0 || loading}
        className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white text-sm font-bold shadow-md transition ${
          (!selectedCustomer && !isAnonymous) || cart.length === 0
            ? "bg-gray-200 dark:bg-win-elevated text-gray-400 dark:text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95"
        }`}
      >
        {loading
          ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Καταχώρηση...</>
          : <><Check className="w-4 h-4" /> Επιβεβαίωση Πώλησης{cart.length > 0 && ` (${cart.reduce((s, p) => s + p.quantity, 0)} τεμ.)`}</>
        }
      </button>

      <CustomerPurchasesModal
        isOpen={showPurchases}
        onClose={() => setShowPurchases(false)}
        customerId={selectedCustomer?._id}
      />

      {showScanner && (
        <BarcodeScannerModal
          onScanned={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default ProductExport;
