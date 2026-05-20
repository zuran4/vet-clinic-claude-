import React, { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import { Search, User } from "lucide-react";
import request from "@/api/apiClient.js"; // 👈 χρήση apiClient με το @ alias

const PetHistory = ({ petId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [result, setResult] = useState("");

  // 🔹 Φόρτωση ιστορικού
  const fetchHistory = async () => {
    try {
      setLoading(true);

      const data = await request(`/pets/${petId}/history`);
      setHistory(data || []);
    } catch (err) {
      console.error("❌ Σφάλμα φόρτωσης ιστορικού:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (petId) fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  // 🔹 Προσθήκη νέας εγγραφής
  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("⚠️ Ο λόγος είναι υποχρεωτικός");
      return;
    }

    try {
      await request(`/pets/${petId}/history`, {
        method: "POST",
        body: { reason, result },
      });

      await fetchHistory(); // ανανέωση λίστας
      setReason("");
      setResult("");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  // 🔹 Διαγραφή εγγραφής
  const handleDelete = async (entryId) => {
    if (!window.confirm("Διαγραφή εγγραφής;")) return;
    try {
      await request(`/pets/${petId}/history/${entryId}`, {
        method: "DELETE",
      });

      await fetchHistory();
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  return (
    <div className="p-4 border rounded-2xl bg-gray-50 mt-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Clock className="w-5 h-5 text-purple-600" />
        Ιστορικό Ζώου
      </h3>

      {/* Φόρμα νέας εγγραφής */}
      <form
        onSubmit={handleAddEntry}
        className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4"
      >
        <input
          type="text"
          placeholder="Λόγος επίσκεψης"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="border px-3 py-2 rounded-2xl shadow-sm w-full text-sm"
          required
        />
        <input
          type="text"
          placeholder="Αποτέλεσμα / Σχόλια"
          value={result}
          onChange={(e) => setResult(e.target.value)}
          className="border px-3 py-2 rounded-2xl shadow-sm w-full text-sm"
        />
        <Button type="submit" variant="primary">
          <Plus className="w-4 h-4" />
          Προσθήκη
        </Button>
      </form>

      {/* Λίστα ιστορικού */}
      {loading ? (
        <p className="text-gray-500">Φόρτωση...</p>
      ) : history.length === 0 ? (
        <p className="text-gray-600">Δεν υπάρχουν εγγραφές στο ιστορικό.</p>
      ) : (
        <ul className="space-y-2">
          {history.map((entry) => (
            <li
              key={entry._id}
              className="flex justify-between items-start bg-white p-3 rounded-2xl shadow"
            >
              <div>
                <p className="font-semibold">
                  📅 {new Date(entry.date).toLocaleDateString("el-GR")}
                </p>
                <p className="text-sm text-gray-700">
                  Λόγος: {entry.reason}
                </p>
                {entry.result && (
                  <p className="text-sm text-gray-600">
                    Αποτέλεσμα: {entry.result}
                  </p>
                )}
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(entry._id)}
              >
                <Trash2 className="w-4 h-4" />
                Διαγραφή
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PetHistory;
