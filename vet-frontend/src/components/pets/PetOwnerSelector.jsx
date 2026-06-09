import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import toast from "react-hot-toast";

const API = "http://localhost:5000/api";

const PetOwnerSelector = ({ owner, selectedOwnerId, onSelect }) => {
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [selectedName, setSelectedName] = useState("");

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (owner && owner._id) {
      setSelectedName(`${owner.name} (${owner.phone || "-"})`);
      onSelectRef.current(owner._id);
    }
  }, [owner]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (owner) return;

    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${API}/customers`);
        if (!res.ok) throw new Error("Αποτυχία φόρτωσης πελατών");
        const data = await res.json();
        setCustomers(data);
      } catch (err) {
        console.error("❌ Σφάλμα φόρτωσης πελατών:", err);
        toast.error("❌ Αποτυχία φόρτωσης πελατών.");
      }
    };
    fetchCustomers();
  }, [owner]);

  useEffect(() => {
    if (owner || !query.trim()) {
      setFiltered([]);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
      )
    );
  }, [query, customers, owner]);

  const handleSelect = (c) => {
    setSelectedName(`${c.name} (${c.phone || "-"})`);
    setQuery("");
    setFiltered([]);
    onSelect(c._id);
  };

  return (
    <div className="w-full">
      <label className="block mb-1 text-gray-600 dark:text-gray-300">Ιδιοκτήτης</label>

      {owner ? (
        <input
          type="text"
          value={selectedName}
          readOnly
          className="border border-gray-200 dark:border-gray-600 px-3 py-2 rounded-2xl shadow-sm w-full text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed"
        />
      ) : (
        <>
          <div className="relative">
            <input
              type="text"
              placeholder="Αναζήτηση πελάτη (όνομα ή τηλέφωνο)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 px-3 py-2 rounded-2xl shadow-sm w-full text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>

          {selectedName && (
            <p className="mt-1 text-sm text-green-600 dark:text-green-400">
              ✅ Επιλέχθηκε: {selectedName}
            </p>
          )}

          {filtered.length > 0 && (
            <ul className="mt-2 border border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 shadow max-h-40 overflow-y-auto">
              {filtered.map((c) => (
                <li
                  key={c._id}
                  onClick={() => handleSelect(c)}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-100"
                >
                  {c.name} ({c.phone})
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default PetOwnerSelector;
