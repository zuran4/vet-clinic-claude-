import React, { useState, useEffect } from "react";
import { Clock, Plus, Trash2, CalendarDays, FileText } from "lucide-react";
import request from "@/api/apiClient.js";
import dayjs from "dayjs";

const PetHistory = ({ petId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [result, setResult] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await request(`/pets/${petId}/history`);
      setHistory(data || []);
    } catch (err) {
      console.error("❌", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (petId) fetchHistory();
  }, [petId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    try {
      setSaving(true);
      await request(`/pets/${petId}/history`, {
        method: "POST",
        body: { reason, result },
      });
      await fetchHistory();
      setReason("");
      setResult("");
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm("Διαγραφή εγγραφής;")) return;
    try {
      await request(`/pets/${petId}/history/${entryId}`, { method: "DELETE" });
      await fetchHistory();
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  return (
    <div className="p-4 space-y-4">

      {/* Φόρμα νέας εγγραφής */}
      <form onSubmit={handleAdd} className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-100 dark:border-sky-700/50 p-4 space-y-3">
        <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wide">Νέα Εγγραφή</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Λόγος επίσκεψης *"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="border border-gray-200 dark:border-win-border-light rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100"
          />
          <input
            type="text"
            placeholder="Αποτέλεσμα / Σχόλια"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="border border-gray-200 dark:border-win-border-light rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !reason.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {saving ? "Αποθήκευση..." : "Προσθήκη"}
          </button>
        </div>
      </form>

      {/* Λίστα */}
      {loading ? (
        <div className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">Φόρτωση...</div>
      ) : history.length === 0 ? (
        <div className="py-8 text-center">
          <Clock className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">Δεν υπάρχουν εγγραφές ιστορικού.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {history.map((entry) => (
            <li key={entry._id} className="bg-white dark:bg-win-elevated/50 rounded-2xl border border-gray-100 dark:border-win-border-light px-4 py-3 flex items-start justify-between gap-3 hover:bg-sky-50/30 dark:hover:bg-sky-900/10 transition-colors">
              <div className="flex gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CalendarDays className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                    {dayjs(entry.date).format("DD/MM/YYYY")}
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{entry.reason}</p>
                  {entry.result && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                      <FileText className="w-3 h-3" />{entry.result}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(entry._id)}
                className="p-1.5 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PetHistory;
