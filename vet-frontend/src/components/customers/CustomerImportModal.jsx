import React, { useState, useRef } from "react";
import { Upload, Download, CheckCircle2, AlertCircle, X, FileText, Loader2 } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import { Button } from "../ui/button.jsx";

// ──────────────────────────────────────────
// CSV template
// ──────────────────────────────────────────
const CSV_HEADERS = ["name", "phone", "email", "address", "notes"];

const CSV_TEMPLATE =
  CSV_HEADERS.join(",") +
  "\n" +
  "Γιώργης Παπαδόπουλος,6901234567,giorgos@email.gr,Αθήνα Κολωνάκι 10,Τακτικός πελάτης" +
  "\n" +
  "Μαρία Νικολάου,6977654321,maria@email.gr,,";

function downloadTemplate() {
  const blob = new Blob(["﻿" + CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "customers_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ──────────────────────────────────────────
// CSV parser (χωρίς εξωτερική library)
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
    .filter((row) => row.name || row.phone);
}

// ──────────────────────────────────────────
const FIELD_LABELS = {
  name: "Όνομα", phone: "Τηλέφωνο",
  email: "Email", address: "Διεύθυνση", notes: "Σημειώσεις",
};

const PREVIEW_COLS = ["name", "phone", "email", "address"];

const CustomerImportModal = ({ onClose, onImport }) => {
  const [rows, setRows]           = useState(null);
  const [fileName, setFileName]   = useState("");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [parseError, setParseError] = useState("");
  const fileRef                   = useRef();

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
      <div className="-mx-6 -mt-6 mb-5 rounded-t-2xl bg-gradient-to-r from-indigo-500 to-violet-400 px-6 py-5">
        <div className="flex items-center gap-2.5 text-white">
          <Upload className="w-5 h-5" />
          <span className="text-lg font-bold">Εισαγωγή Πελατών από CSV</span>
        </div>
      </div>

      <div className="space-y-4">

        {/* Βήμα 1 */}
        <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
          <FileText className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-indigo-800">Βήμα 1: Κατέβασε το template</p>
            <p className="text-xs text-indigo-600 mt-0.5">
              Συμπλήρωσε το αρχείο CSV με τους πελάτες σου (όνομα + τηλέφωνο υποχρεωτικά).
            </p>
            <p className="text-xs text-indigo-500 mt-1 italic">
              ⚠️ Δεν θα σταλούν email/SMS κατά τη μαζική εισαγωγή.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={downloadTemplate} className="flex-shrink-0">
            <Download className="w-3.5 h-3.5" />
            Template
          </Button>
        </div>

        {/* Βήμα 2: Upload */}
        {!result && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Βήμα 2: Επίλεξε αρχείο CSV
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-xl px-4 py-6 flex flex-col items-center gap-2 text-gray-400 hover:text-indigo-500 transition-colors"
            >
              <Upload className="w-6 h-6" />
              <span className="text-sm font-medium">
                {fileName ? fileName : "Κλικ για επιλογή αρχείου .csv"}
              </span>
              {fileName && rows && (
                <span className="text-xs text-emerald-600 font-semibold">
                  ✓ {rows.length} πελάτες βρέθηκαν
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
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Preview */}
        {rows && rows.length > 0 && !result && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Προεπισκόπηση ({rows.length} {rows.length === 1 ? "πελάτης" : "πελάτες"})
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {PREVIEW_COLS.map((c) => (
                      <th key={c} className="px-3 py-2 text-left text-gray-500 font-semibold">
                        {FIELD_LABELS[c]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      {PREVIEW_COLS.map((c) => (
                        <td key={c} className="px-3 py-2 text-gray-700 max-w-[120px] truncate">
                          {row[c] || <span className="text-gray-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && (
                <p className="text-xs text-gray-400 text-center py-2 bg-gray-50 border-t border-gray-100">
                  +{rows.length - 5} ακόμα πελάτες
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
                  <span className="font-bold">{result.inserted}</span> πελάτες προστέθηκαν επιτυχώς.
                </p>
              </div>
            </div>
            {result.errors?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-red-700">
                  {result.errors.length} γραμμές απέτυχαν:
                </p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600">
                    • {e.row?.name || e.row?.phone || "—"}: {e.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
            {result ? "Κλείσιμο" : "Ακύρωση"}
          </Button>
          {rows && !result && (
            <Button variant="success" onClick={handleImport} disabled={loading}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Εισαγωγή…</>
                : <><Upload className="w-4 h-4" /> Εισαγωγή {rows.length} πελατών</>
              }
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CustomerImportModal;
