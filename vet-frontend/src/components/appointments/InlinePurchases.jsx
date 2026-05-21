import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, Minus, Trash2, Check, ShoppingBag, PackageSearch } from "lucide-react";
import request from "@/api/apiClient.js";

const InlinePurchases = ({ customerId }) => {
  const [purchases, setPurchases] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dropdownPos, setDropdownPos] = useState(null);
  const inputRef = useRef(null);

  const fetchPurchases = async () => {
    try {
      setLoadingHistory(true);
      const data = await request(`/customers/${customerId}/purchases`);
      setPurchases(data.purchases || []);
    } catch { }
    finally { setLoadingHistory(false); }
  };

  useEffect(() => { fetchPurchases(); }, [customerId]);

  useEffect(() => {
    if (query.trim().length === 0) { setResults([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setLoadingSearch(true);
        const data = await request(`/products?search=${encodeURIComponent(query.trim())}`);
        if (!cancelled) setResults(Array.isArray(data) ? data : (data.data ?? []));
      } catch { if (!cancelled) setResults([]); }
      finally { if (!cancelled) setLoadingSearch(false); }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  const openDropdown = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  };

  const closeDropdown = () => setDropdownPos(null);

  const addToCart = (prod) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === prod._id);
      if (exists) return prev.map((p) => p.id === prod._id ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { id: prod._id, name: prod.name, quantity: 1 }];
    });
    setQuery("");
    setResults([]);
    closeDropdown();
  };

  const handleSave = async () => {
    if (cart.length === 0) return;
    try {
      setSaving(true);
      await request(`/customers/${customerId}/purchases`, {
        method: "POST",
        body: { products: cart.map((p) => ({ product: p.id, quantity: p.quantity })) },
      });
      setCart([]);
      await fetchPurchases();
    } catch (err) {
      alert("❌ " + (err.message || "Αποτυχία αποθήκευσης"));
    } finally { setSaving(false); }
  };

  const showDropdown = dropdownPos && query.trim().length > 0;

  return (
    <div className="space-y-3">

      {/* Φόρμα νέας αγοράς */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 px-4 py-2.5 flex items-center gap-2">
          <PackageSearch className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-700">Νέα Αγορά</span>
        </div>
        <div className="p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim().length > 0) openDropdown();
                else closeDropdown();
              }}
              onFocus={openDropdown}
              onBlur={() => setTimeout(closeDropdown, 200)}
              placeholder="Αναζήτηση προϊόντος..."
              className="w-full border border-gray-200 rounded-2xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <>
              <div className="rounded-2xl border border-emerald-100 overflow-hidden">
                <ul className="divide-y divide-emerald-50">
                  {cart.map((p) => (
                    <li key={p.id} className="flex items-center justify-between px-3 py-2 bg-white">
                      <span className="text-sm font-medium text-gray-800 flex-1 truncate pr-2">{p.name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button type="button" onClick={() => setCart((prev) => prev.map((x) => x.id === p.id && x.quantity > 1 ? { ...x, quantity: x.quantity - 1 } : x))}
                          className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                          <Minus className="w-3 h-3 text-gray-600" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">{p.quantity}</span>
                        <button type="button" onClick={() => setCart((prev) => prev.map((x) => x.id === p.id ? { ...x, quantity: x.quantity + 1 } : x))}
                          className="w-6 h-6 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center">
                          <Plus className="w-3 h-3 text-emerald-700" />
                        </button>
                        <button type="button" onClick={() => setCart((prev) => prev.filter((x) => x.id !== p.id))}
                          className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center ml-1">
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-60">
                  <Check className="w-4 h-4" />
                  {saving ? "Αποθήκευση..." : "Καταχώρηση Αγοράς"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dropdown μέσω portal — έξω από overflow container */}
      {showDropdown && createPortal(
        <div
          style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
          className="bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden"
        >
          {loadingSearch ? (
            <div className="p-3 text-xs text-gray-400 text-center">Αναζήτηση...</div>
          ) : results.length > 0 ? (
            <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
              {results.map((prod) => (
                <li key={prod._id}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); addToCart(prod); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-800">{prod.name}</span>
                    <span className="text-xs text-gray-400">απόθ.: {prod.quantity ?? 0}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-xs text-gray-400 text-center">Δεν βρέθηκαν προϊόντα.</div>
          )}
        </div>,
        document.body
      )}

      {/* Ιστορικό */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 px-4 py-2.5 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-600">Ιστορικό Αγορών</span>
        </div>
        {loadingHistory ? (
          <div className="py-6 text-center text-sm text-gray-400">Φόρτωση...</div>
        ) : purchases.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">Δεν υπάρχουν αγορές ακόμα.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {purchases.map((p) => (
              <div key={p._id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.product?.name || "Άγνωστο προϊόν"}</p>
                    <p className="text-xs text-gray-400">{p.date ? new Date(p.date).toLocaleDateString("el-GR") : "—"}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-500">×{p.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InlinePurchases;
