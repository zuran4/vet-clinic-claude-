import React from "react";
import { FileText, X, PawPrint, User, Calendar, Stethoscope, Pill, FlaskConical, StickyNote, Printer } from "lucide-react";
import dayjs from "dayjs";

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 dark:border-win-border/50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 dark:text-gray-100 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
};

const PrescriptionViewModal = ({ prescription, onClose }) => {
  if (!prescription) return null;

  const handlePrint = () => {
    const logoUrl = `${window.location.origin}/clinic-logo.png`;
    const animalName = prescription.animalId?.name || prescription.animalName || "—";
    const medicines = Array.isArray(prescription.medicines) ? prescription.medicines : [];
    const printWindow = window.open("", "_blank");
    const html = `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8"/>
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
  </style>
</head>
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-[480px] rounded-2xl overflow-hidden shadow-2xl z-10">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-400 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Αναλυτική Συνταγή</p>
              <p className="text-white/70 text-xs mt-0.5">
                {prescription.animalId?.name || prescription.animalName}
                {prescription.clientName && <span> — {prescription.clientName}</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="bg-gray-50 dark:bg-win-surface/50 p-5 space-y-3">
          <div className="bg-white dark:bg-win-elevated/50 rounded-2xl border border-gray-100 dark:border-win-border-light px-4 py-2">
            <InfoRow icon={Calendar}    label="Ημερομηνία" value={prescription.date ? dayjs(prescription.date).format("DD/MM/YYYY") : null} />
            <InfoRow icon={User}        label="Πελάτης"    value={prescription.clientName} />
            <InfoRow icon={PawPrint}    label="Ζώο"        value={prescription.animalId?.name || prescription.animalName} />
            <InfoRow icon={Stethoscope} label="Γιατρός"    value={prescription.doctor} />
          </div>

          {Array.isArray(prescription.medicines) && prescription.medicines.length > 0 && (
            <div className="bg-white dark:bg-win-elevated/50 rounded-2xl border border-gray-100 dark:border-win-border-light px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                  <Pill className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                </div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Φάρμακα</p>
              </div>
              <ul className="space-y-1">
                {prescription.medicines.map((m, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(prescription.dosage || prescription.instructions || prescription.notes) && (
            <div className="bg-white dark:bg-win-elevated/50 rounded-2xl border border-gray-100 dark:border-win-border-light px-4 py-2">
              <InfoRow icon={FlaskConical} label="Δοσολογία" value={prescription.dosage} />
              <InfoRow icon={StickyNote}   label="Οδηγίες"   value={prescription.instructions} />
              <InfoRow icon={StickyNote}   label="Σημειώσεις" value={prescription.notes} />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium transition-colors">
              <Printer className="w-4 h-4" /> Εκτύπωση
            </button>
            <button onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-gray-200 dark:border-win-border-light text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-win-elevated transition-colors">
              <X className="w-4 h-4" /> Κλείσιμο
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionViewModal;
