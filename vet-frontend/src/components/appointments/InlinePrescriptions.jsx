import React, { useState, useEffect } from "react";
import { Pill, Calendar, Stethoscope, FilePlus, Printer } from "lucide-react";
import dayjs from "dayjs";
import request from "../../api/apiClient.js";
import PrescriptionFormModal from "../prescriptions/PrescriptionFormModal.jsx";
import { useRealtimeSync } from "../../hooks/useRealtimeSync.jsx";

const handlePrint = (rx) => {
  const logoUrl = `${window.location.origin}/clinic-logo.png`;
  const animalName = rx.animalId?.name || rx.animalName || "—";
  const medicines = Array.isArray(rx.medicines) ? rx.medicines : [];
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
    <div class="info-box"><div class="info-label">Ιδιοκτήτης</div><div class="info-value">${rx.clientName || "—"}</div></div>
    <div class="info-box"><div class="info-label">Κατοικίδιο</div><div class="info-value">${animalName}</div></div>
    <div class="info-box"><div class="info-label">Γιατρός</div><div class="info-value">${rx.doctor || "—"}</div></div>
    <div class="info-box"><div class="info-label">Ημερομηνία</div><div class="info-value">${rx.date ? dayjs(rx.date).format("DD/MM/YYYY") : "—"}</div></div>
  </div>
  ${medicines.length > 0 ? `<div class="section"><div class="section-title">Φάρμακα</div>${medicines.map(m => `<div class="med-item"><span class="dot"></span>${m}</div>`).join("")}</div>` : ""}
  ${rx.dosage ? `<div class="section"><div class="section-title">Δοσολογία</div><div class="note">${rx.dosage}</div></div>` : ""}
  ${rx.instructions || rx.notes ? `<div class="section"><div class="section-title">Οδηγίες / Σημειώσεις</div>${rx.instructions ? `<div class="note">${rx.instructions}</div>` : ""}${rx.notes ? `<div class="note" style="margin-top:6px">${rx.notes}</div>` : ""}</div>` : ""}
  <div class="footer">
    <div class="date-label">Ημερομηνία: ${rx.date ? dayjs(rx.date).format("DD/MM/YYYY") : "—"}</div>
    <div><div class="sig-line"></div><div class="sig-label">Υπογραφή Κτηνιάτρου</div></div>
  </div>
</div></body></html>`;
  printWindow.document.write(html);
  printWindow.document.close();
};

const InlinePrescriptions = ({ petId, pet, customer }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchPrescriptions = async () => {
    if (!petId) return;
    try {
      setLoading(true);
      const data = await request(`/prescriptions/by-animal/${petId}`);
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch {
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [petId]);

  // 🔹 Real-time ενημέρωση όταν προστίθεται συνταγή από άλλη συσκευή
  useRealtimeSync({ prescriptions: fetchPrescriptions });

  const handleSubmit = async (prescriptionData) => {
    // Δεν κάνουμε catch εδώ -- το PrescriptionFormModal περιμένει να πετάξει
    // (throw) σε αποτυχία, ώστε να δείξει το σφάλμα inline αντί να κλείσει
    // σαν να πέτυχε η αποθήκευση.
    await request("/prescriptions", { method: "POST", body: prescriptionData });
    await fetchPrescriptions();
  };

  if (!petId) return (
    <div className="py-10 text-center">
      <Pill className="w-8 h-8 text-gray-200 mx-auto mb-2" />
      <p className="text-sm text-gray-400">Δεν βρέθηκε κατοικίδιο για εμφάνιση συνταγών.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Τίτλος + κουμπί */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          Συνταγές κατοικιδίου
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-xs font-medium transition-colors"
        >
          <FilePlus className="w-3.5 h-3.5" />
          Νέα Συνταγή
        </button>
      </div>

      {/* Λίστα */}
      {loading ? (
        <div className="py-6 text-center text-sm text-gray-400">Φόρτωση...</div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border py-10 text-center">
          <Pill className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">Δεν υπάρχουν συνταγές ακόμα.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {prescriptions.map((rx) => (
            <div key={rx._id} className="bg-white dark:bg-win-surface rounded-2xl border border-gray-100 dark:border-win-border px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Pill className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mb-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {rx.date ? dayjs(rx.date).format("DD/MM/YYYY") : "—"}
                    </span>
                    {rx.doctor && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" />
                        {rx.doctor}
                      </span>
                    )}
                  </div>
                  {Array.isArray(rx.medicines) && rx.medicines.length > 0 && (
                    <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                      {rx.medicines.slice(0, 3).join(", ")}
                      {rx.medicines.length > 3 && (
                        <span className="text-violet-400 dark:text-violet-500 font-normal"> +{rx.medicines.length - 3}</span>
                      )}
                    </p>
                  )}
                  {rx.dosage && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{rx.dosage}</p>
                  )}
                </div>
                <button
                  title="Εκτύπωση"
                  onClick={() => handlePrint(rx)}
                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors flex-shrink-0"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Φόρμα νέας συνταγής — προσυμπληρωμένη */}
      <PrescriptionFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        initialCustomer={customer}
        initialPet={pet}
      />
    </div>
  );
};

export default InlinePrescriptions;
