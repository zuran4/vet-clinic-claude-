import React, { useEffect } from "react";
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
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (!prescription) return null;

  const handlePrint = () => {
    const logoUrl = `${window.location.origin}/clinic-logo.png`;
    const animalName = prescription.animalId?.name || prescription.animalName || "—";
    const medicines = Array.isArray(prescription.medicines) ? prescription.medicines : [];
    const refNo = `RX-${dayjs(prescription.date).format("YYYYMMDD")}-${prescription._id?.slice(-4).toUpperCase() || "0000"}`;
    const printWindow = window.open("", "_blank", "width=900,height=700");

    const medsHtml = medicines.length > 0
      ? `<div class="section">
          <div class="section-title">💊 Φάρμακα</div>
          ${medicines.map((m, i) => `
            <div class="med-item">
              <span class="med-num">${i + 1}</span>
              <span class="med-name">${m}</span>
            </div>`).join("")}
        </div>`
      : "";

    const dosageHtml = prescription.dosage
      ? `<div class="section"><div class="section-title">📋 Δοσολογία</div><div class="note">${prescription.dosage}</div></div>`
      : "";

    const notesHtml = (prescription.instructions || prescription.notes)
      ? `<div class="section"><div class="section-title">📝 Οδηγίες / Σημειώσεις</div>
          ${prescription.instructions ? `<div class="note">${prescription.instructions}</div>` : ""}
          ${prescription.notes ? `<div class="note" style="margin-top:6px">${prescription.notes}</div>` : ""}
        </div>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="el"><head>
<meta charset="UTF-8"/>
<title>${refNo} — Κτηνιατρική Συνταγή</title>
<style>
@page{size:A5;margin:10mm 14mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;background:#fff;font-size:12px;padding:10mm 14mm;padding-top:28mm}
.close-btn{position:fixed;top:14px;right:14px;z-index:9999;width:78px;height:78px;border-radius:50%;background:#fff;border:2px solid #e5e7eb;box-shadow:0 3px 12px rgba(0,0,0,.18);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:39px;color:#6b7280;line-height:1;padding:0}
.close-btn:hover{background:#f3f4f6;color:#111827}
.header{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:12px;margin-bottom:6px}
.logo-wrap{display:flex;align-items:center;gap:10px}
.logo{width:38px;height:38px;border-radius:50%;object-fit:contain}
.logo-fallback{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;flex-shrink:0}
.brand-name{font-size:15px;font-weight:800;color:#1f2937;letter-spacing:-.2px}
.brand-sub{font-size:9px;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;margin-top:1px}
.doc-meta{text-align:right}
.doc-badge{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#7c3aed;background:#f5f3ff;border:1px solid #e9d5ff;padding:2px 8px;border-radius:20px;display:inline-block;margin-bottom:4px}
.doc-title{font-size:16px;font-weight:800;color:#6d28d9;letter-spacing:-.2px}
.doc-ref{font-size:9px;color:#9ca3af;font-family:monospace;margin-top:2px}
.doc-date{font-size:10px;font-weight:600;color:#374151;margin-top:3px}
.rule{height:3px;background:linear-gradient(90deg,#7c3aed 0%,#a855f7 60%,#fff 100%);border-radius:2px;margin-bottom:14px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px}
.info-box{border:1px solid #e9d5ff;border-left:3px solid #7c3aed;border-radius:6px;padding:7px 10px;background:#faf5ff}
.info-label{font-size:8px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px}
.info-value{font-size:12.5px;font-weight:700;color:#1f2937}
.section{border:1px solid #e5e7eb;border-radius:8px;margin-bottom:10px;overflow:hidden}
.section-title{background:#f5f3ff;border-bottom:1px solid #e9d5ff;padding:6px 12px;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6d28d9}
.med-item{display:flex;align-items:center;gap:10px;padding:7px 12px;border-bottom:1px solid #f3f4f6}
.med-item:last-child{border-bottom:none}
.med-item:nth-child(even){background:#faf5ff}
.med-num{width:20px;height:20px;border-radius:50%;background:#7c3aed;color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.med-name{font-size:12px;font-weight:600;color:#1f2937}
.note{padding:8px 12px;font-size:11.5px;color:#374151;line-height:1.65}
.footer{margin-top:18px;display:flex;justify-content:space-between;align-items:flex-end;gap:12px}
.footer-left{font-size:9px;color:#9ca3af;line-height:1.8}
.sig-box{text-align:center;min-width:90px}
.sig-lbl{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#9ca3af;margin-bottom:22px}
.sig-line{border-top:1px solid #d1d5db;padding-top:4px;font-size:8px;color:#9ca3af}
@media print{body{padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.close-btn{display:none}}
</style></head>
<body>
<button class="close-btn" onclick="window.close()" title="Κλείσιμο">&#x2715;</button>
<div class="header">
  <div class="logo-wrap">
    <img src="${logoUrl}" class="logo" alt="Logo" onerror="this.outerHTML='<div class=\\'logo-fallback\\'>🐾</div>'"/>
    <div><div class="brand-name">Κτηνιατρείο</div><div class="brand-sub">Σύστημα Διαχείρισης</div></div>
  </div>
  <div class="doc-meta">
    <div class="doc-badge">Επίσημο Έγγραφο</div>
    <div class="doc-title">Κτηνιατρική Συνταγή</div>
    <div class="doc-ref">${refNo}</div>
    <div class="doc-date">${prescription.date ? dayjs(prescription.date).format("DD/MM/YYYY") : "—"}</div>
  </div>
</div>
<div class="rule"></div>
<div class="info-grid">
  <div class="info-box"><div class="info-label">Ιδιοκτήτης</div><div class="info-value">${prescription.clientName || "—"}</div></div>
  <div class="info-box"><div class="info-label">Κατοικίδιο</div><div class="info-value">${animalName}</div></div>
  <div class="info-box"><div class="info-label">Κτηνίατρος</div><div class="info-value">${prescription.doctor || "—"}</div></div>
  <div class="info-box"><div class="info-label">Αρ. Συνταγής</div><div class="info-value" style="font-family:monospace;font-size:11px">${refNo}</div></div>
</div>
${medsHtml}${dosageHtml}${notesHtml}
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
