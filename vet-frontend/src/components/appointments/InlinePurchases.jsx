import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search, Plus, Minus, Trash2, Check, ShoppingBag,
  PackageSearch, Bell, BellOff, Calendar, X,
} from "lucide-react";
import request from "@/api/apiClient.js";
import dayjs from "dayjs";

/* ── Quick preset buttons (days from now) ── */
const PRESETS = [
  { label: "+30 μέρες", days: 30 },
  { label: "+60 μέρες", days: 60 },
  { label: "+90 μέρες", days: 90 },
];

const InlinePurchases = ({ customerId }) => {
  const [purchases, setPurchases]         = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [cart, setCart]                   = useState([]);
  const [query, setQuery]                 = useState("");
  const [results, setResults]             = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [saving, setSaving]               = useState(false);
  const [dropdownPos, setDropdownPos]     = useState(null);
  const inputRef = useRef(null);

  /* ── Reminder state ── */
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDate, setReminderDate]       = useState("");
  const [reminderNote, setReminderNote]       = useState("");

  /* ── Fetch purchase history ── */
  const fetchPurchases = async () => {
    try {
      setLoadingHistory(true);
      const data = await request(`/customers/${customerId}/purchases`);
      setPurchases(data.purchases || []);
    } catch { }
    finally { setLoadingHistory(false); }
  };

  useEffect(() => { fetchPurchases(); }, [customerId]);

  /* ── Product search ── */
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

  /* ── Dropdown positioning ── */
  const openDropdown = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  };
  const closeDropdown = () => setDropdownPos(null);

  /* ── Add to cart ── */
  const addToCart = (prod) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === prod._id);
      if (exists) return prev.map((p) => p.id === prod._id ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { id: prod._id, name: prod.name, quantity: 1, retailPrice: prod.retailPrice ?? null }];
    });
    setQuery("");
    setResults([]);
    closeDropdown();
  };

  /* ── Save purchase (+ optional reminder) ── */
  const handleSave = async () => {
    if (cart.length === 0) return;
    try {
      setSaving(true);

      // 1. Αποθήκευση αγοράς
      await request(`/customers/${customerId}/purchases`, {
        method: "POST",
        body: { products: cart.map((p) => ({ product: p.id, quantity: p.quantity })) },
      });

      // 2. Αποθήκευση υπενθύμισης (αν ενεργοποιήθηκε)
      if (reminderEnabled && reminderDate) {
        await request("/reminders", {
          method: "POST",
          body: {
            customerId,
            reminderDate,
            note:         reminderNote.trim() || "",
            productNames: cart.map((p) => p.name),
          },
        });
      }

      // Reset
      setCart([]);
      setReminderEnabled(false);
      setReminderDate("");
      setReminderNote("");
      await fetchPurchases();
    } catch (err) {
      alert("❌ " + (err.message || "Αποτυχία αποθήκευσης"));
    } finally { setSaving(false); }
  };

  const showDropdown = dropdownPos && query.trim().length > 0;

  return (
    <div className="space-y-3">

      {/* ── Φόρμα νέας αγοράς ── */}
      <div className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-emerald-100 dark:border-emerald-800/30 px-4 py-2.5 flex items-center gap-2">
          <PackageSearch className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Νέα Αγορά</span>
        </div>
        <div className="p-3 space-y-2">

          {/* Search input */}
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
              className="w-full border border-gray-200 dark:border-win-border-light rounded-2xl pl-9 pr-3 py-2 text-sm bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <>
              <div className="rounded-2xl border border-emerald-100 overflow-hidden">
                <ul className="divide-y divide-emerald-50">
                  {cart.map((p) => (
                    <li key={p.id} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-win-elevated/50 gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100 block truncate">{p.name}</span>
                        {p.retailPrice != null && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {Number(p.retailPrice).toFixed(2)} € / τεμ.
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setCart((prev) => prev.map((x) => x.id === p.id && x.quantity > 1 ? { ...x, quantity: x.quantity - 1 } : x))}
                          className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-win-elevated2 hover:bg-gray-200 dark:hover:bg-win-elevated2 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">{p.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setCart((prev) => prev.map((x) => x.id === p.id ? { ...x, quantity: x.quantity + 1 } : x))}
                          className="w-6 h-6 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3 text-emerald-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCart((prev) => prev.filter((x) => x.id !== p.id))}
                          className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center ml-1"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                        {p.retailPrice != null && (
                          <span className="text-sm font-bold text-emerald-600 ml-2 w-16 text-right">
                            {(Number(p.retailPrice) * p.quantity).toFixed(2)} €
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── Σύνολο ── */}
              {cart.some((p) => p.retailPrice != null) && (
                <div className="flex justify-between items-center px-3 py-2 bg-emerald-50 rounded-xl">
                  <span className="text-xs font-semibold text-emerald-700">Σύνολο</span>
                  <span className="text-sm font-bold text-emerald-700">
                    {cart.reduce((sum, p) => sum + (p.retailPrice != null ? Number(p.retailPrice) * p.quantity : 0), 0).toFixed(2)} €
                  </span>
                </div>
              )}

              {/* ── Υπενθύμιση section ── */}
              <div className={`rounded-2xl border transition-all overflow-hidden ${
                reminderEnabled ? "border-violet-200 dark:border-violet-700/50 bg-violet-50 dark:bg-violet-900/20" : "border-gray-100 dark:border-win-border bg-gray-50 dark:bg-win-elevated/30"
              }`}>
                {/* Toggle header */}
                <button
                  type="button"
                  onClick={() => setReminderEnabled((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                >
                  <div className="flex items-center gap-2">
                    {reminderEnabled
                      ? <Bell className="w-3.5 h-3.5 text-violet-500" />
                      : <BellOff className="w-3.5 h-3.5 text-gray-400" />
                    }
                    <span className={`text-xs font-semibold ${reminderEnabled ? "text-violet-700 dark:text-violet-300" : "text-gray-500 dark:text-gray-400"}`}>
                      Υπενθύμιση email στον πελάτη
                    </span>
                  </div>
                  <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors flex-shrink-0 ${
                    reminderEnabled ? "bg-violet-500" : "bg-gray-300 dark:bg-win-elevated2"
                  }`}>
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
                      reminderEnabled ? "translate-x-3.5" : "translate-x-0.5"
                    }`} />
                  </div>
                </button>

                {/* Reminder options (expanded) */}
                {reminderEnabled && (
                  <div className="px-3 pb-3 space-y-2 border-t border-violet-100">

                    {/* Quick presets */}
                    <div className="flex gap-1.5 pt-2 flex-wrap">
                      {PRESETS.map((preset) => {
                        const d = dayjs().add(preset.days, "day").format("YYYY-MM-DD");
                        const isActive = reminderDate === d;
                        return (
                          <button
                            key={preset.days}
                            type="button"
                            onClick={() => setReminderDate(d)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              isActive
                                ? "bg-violet-500 text-white"
                                : "bg-white border border-violet-200 text-violet-600 hover:bg-violet-100"
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom date */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                      <input
                        type="date"
                        value={reminderDate}
                        min={dayjs().add(1, "day").format("YYYY-MM-DD")}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="flex-1 border border-violet-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
                      />
                      {reminderDate && (
                        <span className="text-xs text-violet-500 font-medium whitespace-nowrap">
                          {dayjs(reminderDate).format("DD/MM/YYYY")}
                        </span>
                      )}
                    </div>

                    {/* Note */}
                    <input
                      type="text"
                      value={reminderNote}
                      onChange={(e) => setReminderNote(e.target.value)}
                      placeholder="Σημείωση (προαιρετική)..."
                      className="w-full border border-violet-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
                    />

                    {!reminderDate && (
                      <p className="text-[10px] text-violet-400 italic">
                        Επέλεξε ημερομηνία ή γρήγορη επιλογή παραπάνω
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Save button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || (reminderEnabled && !reminderDate)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  {saving ? "Αποθήκευση..." : "Καταχώρηση Αγοράς"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Search dropdown via portal ── */}
      {showDropdown && createPortal(
        <div
          style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
          className="bg-white dark:bg-win-surface border border-gray-100 dark:border-win-border rounded-2xl shadow-lg overflow-hidden"
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
                    className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{prod.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {prod.retailPrice != null && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{Number(prod.retailPrice).toFixed(2)} €</span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500">απόθ.: {prod.quantity ?? 0}</span>
                    </div>
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

      {/* ── Ιστορικό αγορών ── */}
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
