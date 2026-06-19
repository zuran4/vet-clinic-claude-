import React, { useState, useEffect } from "react";
import { Clock, Plus, Trash2, CalendarDays, FileText, ChevronDown, ChevronUp, Activity } from "lucide-react";
import request from "@/api/apiClient.js";
import dayjs from "dayjs";

const emptyForm = {
  reason: "",
  result: "",
  weight: "",
  temperature: "",
  heartRate: "",
  diagnosis: "",
  treatment: "",
  nextVisit: "",
  vet: "",
};

const PetHistory = ({ petId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showClinical, setShowClinical] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) return;
    try {
      setSaving(true);
      const payload = {
        reason: form.reason,
        result: form.result || undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        temperature: form.temperature ? parseFloat(form.temperature) : undefined,
        heartRate: form.heartRate ? parseInt(form.heartRate) : undefined,
        diagnosis: form.diagnosis || undefined,
        treatment: form.treatment || undefined,
        nextVisit: form.nextVisit || undefined,
        vet: form.vet || undefined,
      };
      await request(`/pets/${petId}/history`, { method: "POST", body: payload });
      await fetchHistory();
      setForm(emptyForm);
      setShowClinical(false);
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

  const inputClass =
    "border border-gray-200 dark:border-win-border-light rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 w-full";

  return (
    <div className="p-4 space-y-4">
      {/* Φόρμα νέας εγγραφής */}
      <form
        onSubmit={handleAdd}
        className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-100 dark:border-sky-700/50 p-4 space-y-3"
      >
        <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wide">
          Νέα Εγγραφή
        </p>

        {/* Βασικά */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            name="reason"
            type="text"
            placeholder="Λόγος επίσκεψης *"
            value={form.reason}
            onChange={handleChange}
            required
            className={inputClass}
          />
          <input
            name="result"
            type="text"
            placeholder="Αποτέλεσμα / Σχόλια"
            value={form.result}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Toggle κλινικών στοιχείων */}
        <button
          type="button"
          onClick={() => setShowClinical((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-medium hover:underline"
        >
          <Activity className="w-3.5 h-3.5" />
          Κλινικά Στοιχεία
          {showClinical ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showClinical && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <input
              name="weight"
              type="number"
              step="0.1"
              min="0"
              placeholder="Βάρος (kg)"
              value={form.weight}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              name="temperature"
              type="number"
              step="0.1"
              min="0"
              placeholder="Θερμοκρασία (°C)"
              value={form.temperature}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              name="heartRate"
              type="number"
              min="0"
              placeholder="Καρδιακοί (bpm)"
              value={form.heartRate}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              name="diagnosis"
              type="text"
              placeholder="Διάγνωση"
              value={form.diagnosis}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              name="treatment"
              type="text"
              placeholder="Αγωγή / Φάρμακα"
              value={form.treatment}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              name="vet"
              type="text"
              placeholder="Κτηνίατρος"
              value={form.vet}
              onChange={handleChange}
              className={inputClass}
            />
            <div className="col-span-2 md:col-span-3">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Επόμενη επίσκεψη
              </label>
              <input
                name="nextVisit"
                type="date"
                value={form.nextVisit}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !form.reason.trim()}
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
            <li
              key={entry._id}
              className="bg-white dark:bg-win-elevated/50 rounded-2xl border border-gray-100 dark:border-win-border-light px-4 py-3 flex items-start justify-between gap-3 hover:bg-sky-50/30 dark:hover:bg-sky-900/10 transition-colors"
            >
              <div className="flex gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CalendarDays className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                    {dayjs(entry.date).format("DD/MM/YYYY")}
                    {entry.vet && (
                      <span className="ml-2 text-gray-400 dark:text-gray-500">· {entry.vet}</span>
                    )}
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
                    {entry.reason}
                  </p>
                  {entry.result && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {entry.result}
                    </p>
                  )}

                  {/* Κλινικά badges */}
                  {(entry.weight || entry.temperature || entry.heartRate) && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {entry.weight && (
                        <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-lg">
                          {entry.weight} kg
                        </span>
                      )}
                      {entry.temperature && (
                        <span className="text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-2 py-0.5 rounded-lg">
                          {entry.temperature}°C
                        </span>
                      )}
                      {entry.heartRate && (
                        <span className="text-xs bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-300 px-2 py-0.5 rounded-lg">
                          {entry.heartRate} bpm
                        </span>
                      )}
                    </div>
                  )}

                  {/* Διάγνωση / Αγωγή */}
                  {(entry.diagnosis || entry.treatment) && (
                    <div className="mt-1.5 space-y-0.5">
                      {entry.diagnosis && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Διάγνωση:</span> {entry.diagnosis}
                        </p>
                      )}
                      {entry.treatment && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Αγωγή:</span> {entry.treatment}
                        </p>
                      )}
                    </div>
                  )}

                  {entry.nextVisit && (
                    <p className="text-xs text-sky-500 dark:text-sky-400 mt-1">
                      Επόμενη επίσκεψη: {dayjs(entry.nextVisit).format("DD/MM/YYYY")}
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
