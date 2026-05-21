import React, { useState, useEffect, useRef } from "react";
import { X, User, UserPlus, Search } from "lucide-react";
import request from "@/api/apiClient.js";
import QuickCreateCustomerModal from "./QuickCreateCustomerModal.jsx";

const CustomerSearchBox = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const skipSearch = useRef(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (skipSearch.current) { skipSearch.current = false; return; }
    if (!query.trim() || query.length < 2) { setResults([]); setShowDropdown(false); return; }

    let cancelled = false;
    const doFetch = async () => {
      try {
        setLoading(true);
        const data = await request(`/customers?search=${encodeURIComponent(query)}`);
        if (!cancelled) {
          setResults(Array.isArray(data) ? data : (data.data ?? []));
          setShowDropdown(true);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const t = setTimeout(doFetch, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  const handleSelect = (customer) => {
    skipSearch.current = true;
    setSelected(customer);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    onSelect?.({ id: customer._id, name: customer.name, phone: customer.phone || "" });
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    setResults([]);
    onSelect?.(null);
  };

  const handleQuickCreated = (customer) => {
    setShowQuickCreate(false);
    handleSelect(customer);
  };

  if (selected) {
    return (
      <div className="flex items-center gap-2 border border-indigo-200 bg-indigo-50 rounded-2xl px-3 py-2 shadow-sm">
        <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-indigo-600">{selected.name?.charAt(0)?.toUpperCase()}</span>
        </div>
        <span className="text-sm font-medium text-indigo-700 flex-1 truncate">
          {selected.name}
          {selected.phone && <span className="text-indigo-400 font-normal ml-2">{selected.phone}</span>}
        </span>
        <button type="button" onClick={handleClear} className="text-indigo-400 hover:text-red-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="relative" ref={wrapperRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Όνομα ή τηλέφωνο πελάτη..."
          className="w-full border border-gray-200 rounded-2xl pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400"
        />

        {showDropdown && query.length >= 2 && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="px-4 py-3 text-xs text-gray-400 text-center">Αναζήτηση...</div>
            ) : (
              <>
                {results.length > 0 ? (
                  <ul className="max-h-44 overflow-y-auto divide-y divide-gray-50">
                    {results.map((c) => (
                      <li key={c._id}>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors flex items-center gap-2"
                          onClick={() => handleSelect(c)}
                        >
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-indigo-500">{c.name?.charAt(0)?.toUpperCase()}</span>
                          </div>
                          <div>
                            <span className="font-medium text-sm text-gray-800">{c.name}</span>
                            <span className="text-xs text-gray-400 ml-2">{c.phone}</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-xs text-gray-400 text-center">Δεν βρέθηκαν αποτελέσματα.</div>
                )}

                {/* Quick create option — πάντα εμφανίζεται */}
                <div className="border-t border-dashed border-indigo-100">
                  <button
                    type="button"
                    onClick={() => { setShowDropdown(false); setShowQuickCreate(true); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors flex items-center gap-2 text-indigo-600"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium">Δημιούργησε </span>
                      <span className="text-sm font-bold">"{query}"</span>
                      <span className="text-xs text-indigo-400 ml-1">ως νέο πελάτη</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showQuickCreate && (
        <QuickCreateCustomerModal
          initialName={query}
          onCreated={handleQuickCreated}
          onCancel={() => setShowQuickCreate(false)}
        />
      )}
    </>
  );
};

export default CustomerSearchBox;
