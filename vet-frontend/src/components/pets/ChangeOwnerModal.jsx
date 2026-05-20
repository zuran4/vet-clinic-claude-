import React, { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import { Search, User } from "lucide-react";
import request from "../../api/apiClient.js"; 
// 👆 Αν το αρχείο είναι απευθείας σε src/components (και όχι σε υποφάκελο),
// τότε κάν' το: import request from "../api/apiClient.js";

const ChangeOwnerModal = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const fetchOwners = async () => {
      try {
        setLoading(true);

        // Χρησιμοποιούμε apiClient:
        // - Production: VITE_API_BASE_URL (Render)
        // - Local: http://localhost:5000/api
        const data = await request(
          `/customers/search?q=${encodeURIComponent(query)}`
        );

        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Σφάλμα αναζήτησης πελατών:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchOwners, 400); // debounce 400ms
    return () => clearTimeout(timeout);
  }, [query]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-indigo-600" />
        Αναζήτηση νέου ιδιοκτήτη
      </h2>

      {/* Input αναζήτησης */}
      <input
        type="text"
        placeholder="Πληκτρολόγησε όνομα ή τηλέφωνο"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 mb-4 shadow-sm focus:ring-2 focus:ring-purple-500"
      />

      {loading && <p className="text-sm text-gray-500">Φόρτωση...</p>}

      {/* Λίστα αποτελεσμάτων */}
      <ul className="divide-y divide-gray-200">
        {results.map((owner) => (
          <li
            key={owner._id}
            className="p-2 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              onSelect(owner);
              onClose();
            }}
          >
            <span className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              {owner.name} ({owner.phone || "χωρίς τηλ."})
            </span>
            <span className="text-xs text-indigo-600">Επιλογή</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
};

export default ChangeOwnerModal;
