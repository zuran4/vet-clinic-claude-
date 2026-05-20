import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button.jsx";
import { ShoppingBag, User, PackageSearch, X, Check, Search } from "lucide-react";
import ExportCart from "../ui/ExportCart.jsx";
import CustomerPurchasesModal from "../customers/CustomerPurchasesModal.jsx";
import request from "@/api/apiClient.js";

const ProductExport = () => {
  const [showResults, setShowResults] = useState(false);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [customerQuery, setCustomerQuery] = useState("");
  const [debouncedCustomerQuery, setDebouncedCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [productQuery, setProductQuery] = useState("");
  const [debouncedProductQuery, setDebouncedProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showProductResults, setShowProductResults] = useState(false);

  const [showPurchases, setShowPurchases] = useState(false);
  const customerRef = useRef(null);
  const productRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (customerRef.current && !customerRef.current.contains(e.target)) setShowResults(false);
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
    if (!showResults) return;
    let cancelled = false;
    const doFetch = async () => {
      try {
        setLoadingCustomers(true);
        const url = debouncedCustomerQuery.trim().length > 0
          ? `/customers?search=${encodeURIComponent(debouncedCustomerQuery)}`
          : `/customers?limit=100`;
        const data = await request(url);
        if (!cancelled) setCustomerResults(Array.isArray(data) ? data : (data.data ?? []));
      } catch {
        if (!cancelled) setCustomerResults([]);
      } finally {
        if (!cancelled) setLoadingCustomers(false);
      }
    };
    doFetch();
    return () => { cancelled = true; };
  }, [debouncedCustomerQuery, showResults]);

  useEffect(() => {
    if (!showProductResults) return;
    let cancelled = false;
    const doFetch = async () => {
      try {
        setLoadingProducts(true);
        const url = debouncedProductQuery.trim().length > 0
          ? `/products?search=${encodeURIComponent(debouncedProductQuery)}`
          : `/products`;
        const data = await request(url);
        if (!cancelled) setProductResults(Array.isArray(data) ? data : (data.data ?? []));
      } catch {
        if (!cancelled) setProductResults([]);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    };
    doFetch();
    return () => { cancelled = true; };
  }, [debouncedProductQuery, showProductResults]);

  const handleExport = async () => {
    if (!selectedCustomer) { alert("Πρέπει να επιλέξεις πελάτη."); return; }
    if (cart.length === 0) { alert("Το καλάθι είναι άδειο."); return; }
    try {
      await request(`/customers/${selectedCustomer._id}/purchases`, {
        method: "POST",
        body: { products: cart.map((p) => ({ product: p.id, quantity: p.quantity })) },
      });
      setCart([]);
      setSelectedCustomer(null);
      alert("✅ Η πώληση καταχωρήθηκε!");
    } catch (err) {
      alert("❌ Απέτυχε η καταχώρηση.\n" + (err.message || ""));
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">

      {/* Επιλογή Πελάτη */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100 px-4 py-3 flex items-center gap-2 rounded-t-2xl">
          <User className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-indigo-700">Πελάτης</span>
        </div>
        <div className="px-4 py-4">
          <div ref={customerRef} className="relative">
            {selectedCustomer ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-indigo-500">
                      {selectedCustomer.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{selectedCustomer.name}</p>
                    <p className="text-xs text-gray-400">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPurchases(true)}
                    className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Ιστορικό
                  </button>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1.5 rounded-xl hover:bg-red-50 text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  value={customerQuery}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCustomerQuery(v);
                    setShowResults(v.trim().length > 0);
                    if (v.trim().length === 0) setCustomerResults([]);
                  }}
                  placeholder="Αναζήτηση πελάτη..."
                  className="w-full border border-gray-200 rounded-2xl pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                {showResults && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
                    {loadingCustomers ? (
                      <div className="p-3 text-xs text-gray-400 text-center">Αναζήτηση...</div>
                    ) : customerResults.length > 0 ? (
                      <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                        {customerResults.map((c) => (
                          <li key={c._id}>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors"
                              onClick={() => { setSelectedCustomer(c); setCustomerQuery(""); setShowResults(false); }}
                            >
                              <span className="font-medium text-sm text-gray-800">{c.name}</span>
                              <span className="text-xs text-gray-400 ml-2">{c.phone}</span>
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

      {/* Επιλογή Προϊόντων */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 px-4 py-3 flex items-center gap-2 rounded-t-2xl">
          <PackageSearch className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-700">Προϊόντα</span>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className="relative" ref={productRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              value={productQuery}
              onChange={(e) => {
                const v = e.target.value;
                setProductQuery(v);
                setShowProductResults(v.trim().length > 0);
                if (v.trim().length === 0) setProductResults([]);
              }}
              placeholder="Αναζήτηση προϊόντος..."
              className="w-full border border-gray-200 rounded-2xl pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            {showProductResults && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
                {loadingProducts ? (
                  <div className="p-3 text-xs text-gray-400 text-center">Αναζήτηση...</div>
                ) : productResults.length > 0 ? (
                  <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                    {productResults.map((prod) => (
                      <li key={prod._id}>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors flex items-center justify-between"
                          onClick={() => {
                            setCart((prev) => {
                              const exists = prev.find((p) => p.id === prod._id);
                              if (exists) return prev.map((p) => p.id === prod._id ? { ...p, quantity: p.quantity + 1 } : p);
                              return [...prev, { id: prod._id, name: prod.name, quantity: 1 }];
                            });
                            setProductQuery("");
                            setProductResults([]);
                            setShowProductResults(false);
                          }}
                        >
                          <span className="font-medium text-sm text-gray-800">{prod.name}</span>
                          <span className="text-xs text-gray-400">απόθεμα: {prod.quantity ?? prod.stockTotal ?? 0}</span>
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

          <ExportCart items={cart} onChange={setCart} />
        </div>
      </div>

      {/* Επιβεβαίωση */}
      <div className="flex justify-end">
        <Button
          onClick={handleExport}
          variant="success"
          className="flex items-center gap-2 px-6"
        >
          <Check className="w-4 h-4" />
          Επιβεβαίωση Πώλησης
        </Button>
      </div>

      <CustomerPurchasesModal
        isOpen={showPurchases}
        onClose={() => setShowPurchases(false)}
        customerId={selectedCustomer?._id}
      />
    </div>
  );
};

export default ProductExport;
