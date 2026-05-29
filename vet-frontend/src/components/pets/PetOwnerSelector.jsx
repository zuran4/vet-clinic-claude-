// ===============================================
// 📄 PetOwnerSelector.jsx
// Περιγραφή: Επιλογή ή αναζήτηση ιδιοκτήτη κατοικιδίου
// ===============================================

import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import toast from "react-hot-toast";

const API = "http://localhost:5000/api";

const PetOwnerSelector = ({ owner, selectedOwnerId, onSelect }) => {
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [selectedName, setSelectedName] = useState("");

  // Ref για να αποφύγουμε infinite loop από inline onSelect
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // -------------------------------------
  // 1️⃣ Prefill όταν υπάρχει owner
  // -------------------------------------
  useEffect(() => {
    if (owner && owner._id) {
      setSelectedName(`${owner.name} (${owner.phone || "-"})`);
      onSelectRef.current(owner._id);
    }
  }, [owner]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------
  // 2️⃣ Φόρτωση λίστας πελατών (αν δεν υπάρχει owner)
  // -------------------------------------
  useEffect(() => {
    if (owner) return; // Δεν χρειάζεται αν ήδη έχουμε owner

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

  // -------------------------------------
  // 3️⃣ Φιλτράρισμα κατά την πληκτρολόγηση
  // -------------------------------------
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

  // -------------------------------------
  // 4️⃣ Επιλογή πελάτη από λίστα
  // -------------------------------------
  const handleSelect = (c) => {
    setSelectedName(`${c.name} (${c.phone || "-"})`);
    setQuery("");
    setFiltered([]);
    onSelect(c._id);
  };

  // -------------------------------------
  // 5️⃣ UI
  // -------------------------------------
  return (
    <div className="w-full">
      <label className="block mb-1 text-gray-600">Ιδιοκτήτης</label>

      {owner ? (
        // Πελάτης γνωστός (read-only)
        <input
          type="text"
          value={selectedName}
          readOnly
          className="border px-3 py-2 rounded-2xl shadow-sm w-full text-sm bg-gray-50 text-gray-700 cursor-not-allowed"
        />
      ) : (
        <>
          {/* Πεδίο αναζήτησης */}
          <div className="relative">
            <input
              type="text"
              placeholder="Αναζήτηση πελάτη (όνομα ή τηλέφωνο)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border px-3 py-2 rounded-2xl shadow-sm w-full text-sm"
            />
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>

          {/* Επιλεγμένος */}
          {selectedName && (
            <p className="mt-1 text-sm text-green-600">
              ✅ Επιλέχθηκε: {selectedName}
            </p>
          )}

          {/* Αποτελέσματα */}
          {filtered.length > 0 && (
            <ul className="mt-2 border rounded-2xl bg-white shadow max-h-40 overflow-y-auto">
              {filtered.map((c) => (
                <li
                  key={c._id}
                  onClick={() => handleSelect(c)}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
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
