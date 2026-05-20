import React, { useState, useEffect, useRef } from "react";
import SearchBar from "../ui/SearchBar";
import { X, User } from "lucide-react";

const API = "http://localhost:5000/api/customers";

const CustomerSearchBox = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const skipSearch = useRef(false);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }

    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${API}?search=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Σφάλμα στο API");
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error("❌ Σφάλμα αναζήτησης:", err);
        setResults([]);
      }
    };

    fetchCustomers();
  }, [query]);

  const handleSelect = (customer) => {
    skipSearch.current = true;
    setSelected(customer);
    setQuery("");
    setResults([]);
    onSelect?.({
      id: customer._id,
      name: customer.name,
      phone: customer.phone || "",
    });
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    setResults([]);
    onSelect?.(null);
  };

  // Αν έχει επιλεγεί πελάτης → εμφάνισε chip
  if (selected) {
    return (
      <div className="flex items-center gap-2 border border-indigo-200 bg-indigo-50 rounded-2xl px-3 py-2 shadow-sm">
        <User className="w-4 h-4 text-indigo-500 flex-shrink-0" />
        <span className="text-sm font-medium text-indigo-700 flex-1 truncate">
          {selected.name}
          {selected.phone && (
            <span className="text-indigo-400 font-normal ml-2">{selected.phone}</span>
          )}
        </span>
        <button
          type="button"
          onClick={handleClear}
          className="text-indigo-400 hover:text-indigo-700 transition-colors"
          title="Αλλαγή πελάτη"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Αλλιώς → εμφάνισε search box
  return (
    <div className="relative">
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Όνομα ή τηλέφωνο πελάτη..."
        onClear={() => {
          setQuery("");
          setResults([]);
        }}
      />

      {results.length > 0 && (
        <ul className="absolute z-20 bg-white border rounded-2xl w-full max-h-48 overflow-y-auto shadow text-sm mt-1">
          {results.map((c) => (
            <li
              key={c._id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(c)}
            >
              {c.name} — {c.phone}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomerSearchBox;
