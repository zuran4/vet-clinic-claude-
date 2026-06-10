import React, { useState, useEffect } from "react";
import { PawPrint, FileText, Printer, Pill, User, Calendar, Stethoscope } from "lucide-react";
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
    const printWindow = window.open("", "_blank");
    const html = `<!DOCTYPE html>
<html lang="el"><head><meta charset="UTF-8"/>
<title>Συνταγή - ${animalName}</title>
<script>window.onload = function(){ window.print(); }</script>
<style>
  @page{size:A5;margin:12mm 16mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;background:#fff;font-size:13px}
  .page{width:100%;padding:0}
  .header{display:flex;align-items:center;justify-content:space-between;padding-bottom:14px;border-bottom:3px solid #ede9fe;margin-bottom:20px}
  .logo{width:35mm;height:auto;display:block}
  .clinic-name{font-size:16px;font-weight:700;color:#6d28d9;text-align:right}
  .clinic-sub{font-size:11px;color:#9ca3af;text-align:right;margin-top:3px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
  .info-box{background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:9px 12px}
  .info-label{font-size:9px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px}
  .info-value{font-size:13px;font-weight:600;color:#1f2937}
  .section{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin-bottom:12px}
  .section-title{font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px}
  .med-item{display:flex;align-items:center;padding:4px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151}
  .med-item:last-child{border-bottom:none}
  .dot{width:6px;height:6px;border-radius:50%;background:#7c3aed;margin-right:8px;flex-shrink:0;display:inline-block}
  .note{font-size:12px;color:#4b5563;line-height:1.6}
  .footer{margin-top:32px;display:flex;justify-content:space-between;align-items:flex-end}
  .sig-line{width:150px;border-top:1px solid #9ca3af;margin-bottom:5px}
  .sig-label{font-size:10px;color:#9ca3af;text-align:center}
  .date-label{font-size:11px;color:#6b7280}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head>
<body><div class="page">
  <div class="header">
    <img src="${logoUrl}" class="logo" alt="Logo" onerror="this.style.display='none'"/>
    <div>
      <div class="clinic-name">Ιατρείο Μικρών Ζώων</div>
      <div class="clinic-sub">Άγιος Στέφανος</div>
      <div class="clinic-sub" style="margin-top:6px;font-weight:600;color:#6d28d9">Κτηνιατρική Συνταγή</div>
    </div>
  </div>
  <div class="info-grid">
    <div class="info-box"><div class="info-label">Ιδιοκτήτης</div><div class="info-value">${prescription.clientName || "—"}</div></div>
    <div class="info-box"><div class="info-label">Κατοικίδιο</div><div class="info-value">${animalName}</div></div>
    <div class="info-box"><div class="info-label">Γιατρός</div><div class="info-value">${prescription.doctor || "—"}</div></div>
    <div class="info-box"><div class="info-label">Ημερομηνία</div><div class="info-value">${prescription.date ? dayjs(prescription.date).format("DD/MM/YYYY") : "—"}</div></div>
  </div>
  ${medicines.length > 0 ? `<div class="section"><div class="section-title">Φάρμακα</div>${medicines.map(m => `<div class="med-item"><span class="dot"></span>${m}</div>`).join("")}</div>` : ""}
  ${prescription.dosage ? `<div class="section"><div class="section-title">Δοσολογία</div><div class="note">${prescription.dosage}</div></div>` : ""}
  ${prescription.instructions || prescription.notes ? `<div class="section"><div class="section-title">Οδηγίες / Σημειώσεις</div>${prescription.instructions ? `<div class="note">${prescription.instructions}</div>` : ""}${prescription.notes ? `<div class="note" style="margin-top:6px">${prescription.notes}</div>` : ""}</div>` : ""}
  <div class="footer">
    <div class="date-label">Ημερομηνία: ${prescription.date ? dayjs(prescription.date).format("DD/MM/YYYY") : "—"}</div>
    <div><div class="sig-line"></div><div class="sig-label">Υπογραφή Κτηνιάτρου</div></div>
  </div>
</div></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (error) return <p className="text-red-500 text-sm">{error}</p>;

  return (
    <>
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
