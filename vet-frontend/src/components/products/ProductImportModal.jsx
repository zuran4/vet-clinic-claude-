import React, { useState, useRef } from "react";
import { Upload, Download, CheckCircle2, AlertCircle, X, FileText, Loader2, Info } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import { Button } from "../ui/button.jsx";

// ──────────────────────────────────────────
// CSV template
// ──────────────────────────────────────────
const VALID_CATEGORIES = ["Φάρμακο", "Τροφή", "Παιχνίδι", "Αξεσουάρ", "Άλλο"];

const CSV_TEMPLATE =
  "name,category,quantity,unit,threshold,barcode,supplier,notes\n" +
  "Amoxicillin 250mg,Φάρμακο,50,κουτί,10,1234567890123,Καταλύτης ΑΕ,Αντιβιοτικό\n" +
  "Royal Canin Adult,Τροφή,30,σακούλα,5,,Biolab,\n" +
  "Παιχνίδι σχοινί,Παιχνίδι,20,τεμ.,5,,,";

function downloadTemplate() {
  const blob = new Blob(["﻿" + CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "products_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ──────────────────────────────────────────
// CSV parser
// ──────────────────────────────────────────
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());

  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const values = [];
      let cur = "", inQ = false;
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; }
        else if (ch === "," && !inQ) { values.push(cur.trim()); cur = ""; }
        else { cur += ch; }
      }
      values.push(cur.trim());

      return headers.reduce((obj, h, i) => {
        obj[h] = (values[i] || "").replace(/^["']|["']$/g, "").trim();
        return obj;
      }, {});
    })
    .filter((row) => row.name);
}

// ──────────────────────────────────────────
const FIELD_LABELS = {
  name: "Όνομα", category: "Κατηγορία",
  quantity: "Ποσότητα", unit: "Μονάδα",
  barcode: "Barcode", supplier: "Προμηθευτής",
};
const PREVIEW_COLS = ["name", "category", "quantity", "unit", "barcode", "supplier"];

const ProductImportModal = ({ onClose, onImport }) => {
  const [rows, setRows]             = useState(null);
  const [fileName, setFileName]     = useState("");
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [parseError, setParseError] = useState("");
  const fileRef                     = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError("");
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseCSV(ev.target.result);
        if (parsed.length === 0) {
          setParseError("Δεν βρέθηκαν έγκυρες γραμμές. Έλεγξε ότι το αρχείο έχει επικεφαλίδες.");
          setRows(null);
        } else {
          setRows(parsed);
        }
      } catch {
        setParseError("Σφάλμα ανάγνωσης αρχείου.");
        setRows(null);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = async () => {
    if (!rows?.length) return;
    setLoading(true);
    try {
      const res = await onImport(rows);
      setResult(res);
      setRows(null);
    } catch (err) {
      setParseError(err.message || "Σφάλμα κατά την εισαγωγή.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose}>
      {/* Header */}
      <div className="-mx-6 -mt-6 mb-5 rounded-t-2xl bg-gradient-to-r from-orange-400 to-amber-300 px-6 py-5">
        <div className="flex items-center gap-2.5 text-white">
          <Upload className="w-5 h-5" />
          <span className="text-lg font-bold">Εισαγωγή Προϊόντων από CSV</span>
        </div>
      </div>

      <div className="space-y-4">

        {/* Βήμα 1: Template */}
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl px-4 py-3">
          <FileText className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Βήμα 1: Κατέβασε το template</p>
            <p className="text-xs text-amber-600 dark:text-amber-300 mt-0.5">
              Το <strong>όνομα</strong> είναι υποχρεωτικό. Τα υπόλοιπα πεδία είναι προαιρετικά.
            </p>
          </div>
          <Button variant="warning" size="sm" onClick={downloadTemplate} className="flex-shrink-0">
            <Download className="w-3.5 h-3.5" />
            Template
          </Button>
        </div>

        {/* Έγκυρες κατηγορίες */}
        <div className="flex items-start gap-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5">
          <Info className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Έγκυρες κατηγορίες:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {VALID_CATEGORIES.map((c) => (
                <span key={c} className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-xs px-2 py-0.5 rounded-full font-medium">
                  {c}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Οτιδήποτε άλλο → "Άλλο" αυτόματα.</p>
          </div>
        </div>

        {/* Βήμα 2: Upload */}
        {!result && (
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Βήμα 2: Επίλεξε αρχείο CSV
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-600 rounded-xl px-4 py-6 flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500 hover:text-orange-500 transition-colors"
            >
              <Upload className="w-6 h-6" />
              <span className="text-sm font-medium">
                {fileName ? fileName : "Κλικ για επιλογή αρχείου .csv"}
              </span>
              {fileName && rows && (
                <span className="text-xs text-emerald-600 font-semibold">
                  ✓ {rows.length} προϊόντα βρέθηκαν
                </span>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        )}

        {/* Parse error */}
        {parseError && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 rounded-xl px-3 py-2.5 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Preview */}
        {rows && rows.length > 0 && !result && (
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Προεπισκόπηση ({rows.length} {rows.length === 1 ? "προϊόν" : "προϊόντα"})
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {PREVIEW_COLS.map((c) => (
                      <th key={c} className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-semibold whitespace-nowrap">
                        {FIELD_LABELS[c]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50/50 dark:bg-gray-700/50"}>
                      {PREVIEW_COLS.map((c) => (
                        <td key={c} className="px-3 py-2 text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                          {row[c] || <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
                  +{rows.length - 5} ακόμα προϊόντα
                </p>
              )}
            </div>
          </div>
        )}

        {/* Αποτέλεσμα */}
        {result && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold">Εισαγωγή ολοκληρώθηκε</p>
                <p className="text-xs mt-0.5">
                  <span className="font-bold">{result.inserted}</span> προϊόντα προστέθηκαν επιτυχώς.
                </p>
              </div>
            </div>
            {result.errors?.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl px-4 py-3 space-y-1 max-h-40 overflow-y-auto">
                <p className="text-xs font-semibold text-red-700 dark:text-red-300 sticky top-0 bg-red-50 dark:bg-red-900/20 pb-1">
                  {result.errors.length} γραμμές απέτυχαν:
                </p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600 dark:text-red-400">
                    • {e.row?.name || "—"}: {e.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
            {result ? "Κλείσιμο" : "Ακύρωση"}
          </Button>
          {rows && !result && (
            <Button variant="success" onClick={handleImport} disabled={loading}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Εισαγωγή…</>
                : <><Upload className="w-4 h-4" /> Εισαγωγή {rows.length} προϊόντων</>
              }
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProductImportModal;
