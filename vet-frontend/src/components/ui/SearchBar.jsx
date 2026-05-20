import React from "react";
import { Search, X } from "lucide-react";

const SearchBar = ({
  value,
  onChange,
  placeholder = "Αναζήτηση...",
  onClear,              // προαιρετικό κουμπί καθαρισμού
  className = "",
  autoFocus = false,    // προαιρετικό autofocus
}) => {
  const handleClear = () => {
    if (onClear) onClear();
    else onChange("");
  };

  return (
    <div className={`relative w-full ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="pl-10 pr-8 border px-3 py-2 rounded-2xl shadow 
                   focus:ring-2 focus:ring-primary w-full text-sm"
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 
                     hover:text-gray-600 transition"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
