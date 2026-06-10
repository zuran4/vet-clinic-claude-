// src/components/settings/StockThresholdsPanel.jsx
console.log("StockThresholdsPanel mounted");

import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useStockThresholds } from "@/hooks";




/**
 * Panel ρυθμίσεων για thresholds αποθέματος:
 * - Global (όλοι)
 * - Override ανά κατηγορία (add/remove)
 * - Import/Export JSON
 */
export default function StockThresholdsPanel({ categories = [] }) {
  const {
    thresholds,
    setGlobalThresholds,
    setCategoryThresholds,
    removeCategoryThresholds,
    importThresholds,
    exportThresholds,
  } = useStockThresholds();

  // Local form state
  const [globalLow, setGlobalLow] = useState(String(thresholds?._global?.low ?? 5));
  const [globalOk, setGlobalOk] = useState(String(thresholds?._global?.ok ?? 20));

  // Συγχρονισμός όταν φορτώνουν/αλλάζουν τα global από storage
  useEffect(() => {
    console.log("StockThresholdsPanel mounted");
    setGlobalLow(String(thresholds?._global?.low ?? 5));
    setGlobalOk(String(thresholds?._global?.ok ?? 20));
  }, [thresholds?._global?.low, thresholds?._global?.ok]);

  const [newCat, setNewCat] = useState("");
  const [newLow, setNewLow] = useState("5");
  const [newOk, setNewOk] = useState("20");

  // Λίστα κατηγοριών για datalist: merge props + υπάρχοντα overrides
  const existingCats = useMemo(() => {
    const keys = Object.keys(thresholds?._byCategory || {});
    const merged = Array.from(new Set([...(categories || []), ...keys])).filter(Boolean);
    return merged.sort((a, b) => String(a).localeCompare(String(b), "el"));
  }, [categories, thresholds]);

  const handleExport = () => {
    const data = exportThresholds ? exportThresholds() : thresholds;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stock-thresholds.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      importThresholds(obj);
    } catch {
      alert("Μη έγκυρο JSON.");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Global thresholds */}
      <section className="p-4 rounded-2xl border bg-gray-50 dark:bg-win-bg dark:border-win-border">
        <h3 className="text-sm font-semibold mb-3 dark:text-gray-200">Global thresholds</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Low (≤)</label>
            <input
              type="number"
              min={0}
              value={globalLow}
              onChange={(e) => setGlobalLow(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2 dark:bg-win-bg dark:border-win-border"
            />
            <p className="mt-1 text-[11px] text-gray-500">Κάτω ή ίσο με αυτό το όριο θεωρείται χαμηλό.</p>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">OK (&gt;)</label>
            <input
              type="number"
              min={1}
              value={globalOk}
              onChange={(e) => setGlobalOk(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2 dark:bg-win-bg dark:border-win-border"
            />
            <p className="mt-1 text-[11px] text-gray-500">Ποσότητα πάνω από αυτό θεωρείται ΟΚ.</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() =>
                setGlobalThresholds({
                  low: Number.isFinite(+globalLow) ? +globalLow : 5,
                  ok: Number.isFinite(+globalOk) ? +globalOk : 20,
                })
              }
              className="w-full"
            >
              Αποθήκευση
            </Button>
          </div>
        </div>
      </section>

      {/* Per-category overrides */}
      <section className="p-4 rounded-2xl border dark:border-win-border">
        <h3 className="text-sm font-semibold mb-3 dark:text-gray-200">Overrides ανά κατηγορία</h3>

        {/* Add new override */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end mb-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Κατηγορία</label>
            <input
              list="known-categories"
              placeholder="π.χ. Φάρμακα"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2 dark:bg-win-bg dark:border-win-border"
            />
            <datalist id="known-categories">
              {existingCats.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Low (≤)</label>
            <input
              type="number"
              min={0}
              value={newLow}
              onChange={(e) => setNewLow(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2 dark:bg-win-bg dark:border-win-border"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">OK (&gt;)</label>
            <input
              type="number"
              min={1}
              value={newOk}
              onChange={(e) => setNewOk(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2 dark:bg-win-bg dark:border-win-border"
            />
          </div>
        </div>
        <Button
          onClick={() => {
            const name = (newCat || "").trim();
            if (!name) return;
            setCategoryThresholds(name, {
              low: Number.isFinite(+newLow) ? +newLow : 5,
              ok: Number.isFinite(+newOk) ? +newOk : 20,
            });
            setNewCat("");
          }}
        >
          Προσθήκη / Ενημέρωση
        </Button>

        {/* List overrides */}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b dark:border-win-border">
                <th className="py-2 pr-2">Κατηγορία</th>
                <th className="py-2 pr-2">Low</th>
                <th className="py-2 pr-2">OK</th>
                <th className="py-2 text-right">Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(thresholds?._byCategory || {}).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-3 text-gray-500 dark:text-gray-400">
                    Δεν υπάρχουν overrides.
                  </td>
                </tr>
              )}
              {existingCats.map((cat) => {
                const cfg = thresholds?._byCategory?.[cat];
                if (!cfg) return null; // δείχνουμε μόνο όσα έχουν override
                return (
                  <tr key={cat} className="border-b dark:border-win-border">
                    <td className="py-2 pr-2">{cat}</td>
                    <td className="py-2 pr-2">{cfg.low}</td>
                    <td className="py-2 pr-2">{cfg.ok}</td>
                    <td className="py-2">
                      <div className="flex justify-end">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeCategoryThresholds(cat)}
                        >
                          Διαγραφή
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Import / Export */}
      <section className="p-4 rounded-2xl border bg-gray-50 dark:bg-win-bg dark:border-win-border">
        <h3 className="text-sm font-semibold mb-3 dark:text-gray-200">Import / Export</h3>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExport}>Export JSON</Button>

          <label className="inline-flex items-center gap-2">
            <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
            <span className="px-3 py-2 rounded-2xl border cursor-pointer dark:border-win-border dark:text-gray-200">
              Import JSON
            </span>
          </label>
        </div>
      </section>
    </div>
  );
}
