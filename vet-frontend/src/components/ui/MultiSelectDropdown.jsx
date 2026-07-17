import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

// ── Enterprise-style multi-select dropdown (tag input + searchable list) ──
const MultiSelectDropdown = ({ options, selected, onChange, placeholder = "Επίλεξε..." }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const toggleOption = (opt) => {
    const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
    onChange(next);
  };

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left text-sm bg-white dark:bg-win-elevated transition-all duration-150 ${
          open
            ? "border-indigo-400 dark:border-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/30"
            : "border-gray-200 dark:border-win-border-light hover:border-gray-300 dark:hover:border-win-border shadow-sm"
        }`}
      >
        <div className="flex-1 min-w-0 flex flex-wrap gap-1 py-0.5">
          {selected.length === 0 ? (
            <span className="text-gray-400 dark:text-gray-500 py-0.5">{placeholder}</span>
          ) : (
            selected.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium pl-2 pr-1 py-0.5 rounded-md"
              >
                {s}
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => { e.stopPropagation(); toggleOption(s); }}
                  className="hover:bg-indigo-200 dark:hover:bg-indigo-800/60 rounded-sm p-0.5 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full min-w-[260px] rounded-xl border border-gray-200 dark:border-win-border-light bg-white dark:bg-win-surface shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-win-border-light">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Αναζήτηση..."
                className="w-full pl-8 pr-2 py-1.5 text-sm rounded-lg bg-gray-50 dark:bg-win-elevated border-none focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-gray-400 dark:text-gray-500">Δεν βρέθηκαν αποτελέσματα</p>
            ) : (
              filtered.map((opt) => {
                const active = selected.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleOption(opt)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-left transition-colors ${
                      active
                        ? "bg-indigo-50 dark:bg-indigo-900/25 text-indigo-700 dark:text-indigo-300 font-medium"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-win-elevated/60"
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {active && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {selected.length > 0 && (
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-gray-100 dark:border-win-border-light bg-gray-50/60 dark:bg-win-elevated/20">
              <span className="text-[11px] text-gray-400 dark:text-gray-500">{selected.length} επιλεγμένα</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[11px] font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
              >
                Καθαρισμός
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
