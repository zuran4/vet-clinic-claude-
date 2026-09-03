import React, { useState, useEffect } from "react";
import { PawPrint, FileText, Printer, Pill, User, Calendar, Stethoscope, Plus } from "lucide-react";
import PrescriptionViewModal from "./PrescriptionViewModal";
import PrescriptionFormModal from "./PrescriptionFormModal";
import dayjs from "dayjs";
import { usePrescriptions } from "../../hooks/usePrescriptions";

const PrescriptionList = () => {
  const { prescriptions, error, addPrescription } = usePrescriptions();
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const open = () => setShowForm(true);
    document.addEventListener("openPrescriptionForm", open);
    return () => document.removeEventListener("openPrescriptionForm", open);
  }, []);

  const handlePrint = (prescription) => {
    const logoUrl = `${window.location.origin}/clinic-logo.png`;
    const animalName = prescription.animalId?.name || prescription.animalName || "—";
    const medicines = Array.isArray(prescription.medicines) ? prescription.medicines : [];
    const refNo = `RX-${dayjs(prescription.date).format("YYYYMMDD")}-${prescription._id?.slice(-4).toUpperCase() || "0000"}`;
    const printWindow = window.open("", "_blank", "width=900,height=700");

    const medsHtml = medicines.length > 0
      ? `<div class="section">
          <div class="section-title">Φάρμακα</div>
          <div class="med-list">
          ${medicines.map((m, i) => `
            <div class="med-item">
              <span class="med-num">${i + 1}.</span>
              <span class="med-name">${m}</span>
            </div>`).join("")}
          </div>
        </div>`
      : "";

    const dosageHtml = prescription.dosage
      ? `<div class="section"><div class="section-title">Δοσολογία</div><div class="note">${prescription.dosage}</div></div>`
      : "";

    const notesHtml = (prescription.instructions || prescription.notes)
      ? `<div class="section"><div class="section-title">Οδηγίες / Σημειώσεις</div>
          ${prescription.instructions ? `<div class="note">${prescription.instructions}</div>` : ""}
          ${prescription.notes ? `<div class="note" style="margin-top:6px">${prescription.notes}</div>` : ""}
        </div>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="el"><head>
<meta charset="UTF-8"/>
<title>${refNo} — Κτηνιατρική Συνταγή</title>
<style>
@page{size:A5;margin:14mm 16mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;background:#fff;font-size:12.5px;line-height:1.5;padding:14mm 16mm;padding-top:32mm}

/* ── Close btn (screen only) ── */
.close-btn{position:fixed;top:14px;right:14px;z-index:9999;width:78px;height:78px;border-radius:50%;background:#fff;border:2px solid #e5e7eb;box-shadow:0 3px 12px rgba(0,0,0,.18);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:39px;color:#6b7280;line-height:1;padding:0}
.close-btn:hover{background:#f3f4f6;color:#111827}

/* ── Letterhead ── */
.header{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:14px;border-bottom:1.5px solid #111827;margin-bottom:20px}
.logo-wrap{display:flex;align-items:center;gap:12px}
.logo{width:44px;height:44px;border-radius:8px;object-fit:contain}
.logo-fallback{width:44px;height:44px;border-radius:8px;background:#4c1d95;display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;flex-shrink:0}
.brand-name{font-size:17px;font-weight:700;color:#111827;letter-spacing:-.3px}
.brand-sub{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-top:2px}
.doc-meta{text-align:right}
.doc-eyebrow{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:#6b7280;margin-bottom:3px}
.doc-title{font-size:19px;font-weight:700;color:#4c1d95;letter-spacing:-.3px}
.doc-ref{font-size:9.5px;color:#6b7280;font-family:'Courier New',monospace;margin-top:5px}
.doc-date{font-size:10px;color:#374151;margin-top:2px}

/* ── Patient / prescriber block -- καθαρός πίνακας, όχι έγχρωμα chips ── */
.info-table{width:100%;border-collapse:collapse;margin-bottom:22px}
.info-table td{padding:9px 0;border-bottom:1px solid #e5e7eb;vertical-align:top}
.info-table .lbl{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;padding-right:10px;white-space:nowrap;width:1%}
.info-table .val{font-size:13px;font-weight:600;color:#111827;padding-right:24px}

/* ── Sections ── */
.section{margin-bottom:16px}
.section-title{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#4c1d95;padding-bottom:5px;border-bottom:1px solid #ddd6fe;margin-bottom:8px}
.med-item{display:flex;align-items:baseline;gap:8px;padding:5px 0;border-bottom:1px solid #f3f4f6}
.med-item:last-child{border-bottom:none}
.med-num{font-size:12px;font-weight:700;color:#6b7280;min-width:16px}
.med-name{font-size:12.5px;font-weight:600;color:#111827}
.note{font-size:12px;color:#374151;line-height:1.65}

/* ── Footer ── */
.footer{margin-top:26px;display:flex;justify-content:space-between;align-items:flex-end;gap:12px;padding-top:14px;border-top:1px solid #e5e7eb}
.footer-left{font-size:9px;color:#9ca3af;line-height:1.8}
.sig-box{text-align:center;min-width:100px}
.sig-lbl{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#9ca3af;margin-bottom:24px}
.sig-line{border-top:1px solid #9ca3af;padding-top:4px;font-size:8px;color:#9ca3af}

@media print{
  body{padding:0 16mm;padding-top:18mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .close-btn{display:none}
}
</style></head>
<body>
<button class="close-btn" onclick="window.close()" title="Κλείσιμο">&#x2715;</button>

<div class="header">
  <div class="logo-wrap">
    <img src="${logoUrl}" class="logo" alt="Logo"
      onerror="this.outerHTML='<div class=\\'logo-fallback\\'>🐾</div>'"/>
    <div>
      <div class="brand-name">Κτηνιατρείο</div>
      <div class="brand-sub">Σύστημα Διαχείρισης</div>
    </div>
  </div>
  <div class="doc-meta">
    <div class="doc-eyebrow">Επίσημο Έγγραφο</div>
    <div class="doc-title">Κτηνιατρική Συνταγή</div>
    <div class="doc-ref">${refNo}</div>
    <div class="doc-date">${prescription.date ? dayjs(prescription.date).format("DD/MM/YYYY") : "—"}</div>
  </div>
</div>

<table class="info-table">
  <tr>
    <td class="lbl">Ιδιοκτήτης</td><td class="val">${prescription.clientName || "—"}</td>
    <td class="lbl">Κατοικίδιο</td><td class="val">${animalName}</td>
  </tr>
  <tr>
    <td class="lbl">Κτηνίατρος</td><td class="val">${prescription.doctor || "—"}</td>
    <td class="lbl">Αρ. Συνταγής</td><td class="val" style="font-family:'Courier New',monospace;font-size:11px">${refNo}</td>
  </tr>
</table>

${medsHtml}
${dosageHtml}
${notesHtml}

<div class="footer">
  <div class="footer-left">
    <div><strong>Εκδόθηκε:</strong> ${prescription.date ? dayjs(prescription.date).format("DD/MM/YYYY") : "—"}</div>
    <div><strong>Αρ.:</strong> ${refNo}</div>
    <div style="margin-top:4px;color:#c4b5fd;font-size:8px">Εμπιστευτικό ιατρικό έγγραφο</div>
  </div>
  <div class="sig-box">
    <div class="sig-lbl">Υπογραφή Κτηνιάτρου</div>
    <div class="sig-line">Υπογραφή / Σφραγίδα</div>
  </div>
</div>

<script>window.onload = function(){ window.print(); }</script>
</body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (error) return <p className="text-red-500 text-sm">{error}</p>;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="sm:hidden w-full mb-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-400 text-white text-sm font-semibold shadow-sm active:scale-95 transition"
      >
        <Plus className="w-4 h-4" /> Νέα Συνταγή
      </button>

      {prescriptions.length === 0 ? (
        <div className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border shadow-sm py-14 text-center">
          <Pill className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-400 dark:text-gray-500">Δεν υπάρχουν καταχωρημένες συνταγές.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {prescriptions.map((p) => (
            <div
              key={p._id}
              className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="flex items-center gap-4 px-4 py-3">
                {/* Violet accent */}
                <div className="w-1 self-stretch rounded-full bg-gradient-to-b from-violet-400 to-purple-500 flex-shrink-0" />

                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                  <PawPrint className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                    {p.animalId?.name || p.animalName}
                    <span className="text-gray-400 dark:text-gray-500 font-normal mx-1.5">—</span>
                    <span className="text-gray-600 dark:text-gray-300">{p.clientName}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Calendar className="w-3 h-3" />{dayjs(p.date).format("DD/MM/YYYY")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Stethoscope className="w-3 h-3" />{p.doctor}
                    </span>
                    {Array.isArray(p.medicines) && p.medicines.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400">
                        <Pill className="w-3 h-3" />
                        {p.medicines.slice(0, 2).join(", ")}
                        {p.medicines.length > 2 && ` +${p.medicines.length - 2}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    title="Προβολή"
                    onClick={() => setSelected(p)}
                    className="p-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-600 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    title="Εκτύπωση"
                    onClick={() => handlePrint(p)}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PrescriptionViewModal prescription={selected} onClose={() => setSelected(null)} />
      <PrescriptionFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={addPrescription}
        pets={[]}
      />
    </>
  );
};

export default PrescriptionList;
