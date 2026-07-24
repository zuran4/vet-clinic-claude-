import React, { useState } from "react";
import dayjs from "dayjs";
import { PlusCircle, Trash2, Save, XCircle, Edit } from "lucide-react";
import { Button } from "../ui/button";
import request from "../../api/apiClient.js";

const INPUT = "mt-1 w-full border border-gray-300 dark:border-win-border-light rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-purple-500 bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100";
const LABEL = "block text-sm font-medium text-gray-700 dark:text-gray-300";

const StockSection = ({ productId, batches = [], expirationWarningDays = 30, onChange }) => {
  const [adding, setAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editBatch, setEditBatch] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [newBatch, setNewBatch] = useState({
    batchNumber: "",
    quantity: "",
    expirationDate: "",
    purchaseDate: "",
    invoiceNumber: "",
  });

  if (!productId) {
    return <p className="text-gray-500 dark:text-gray-400">Αποθήκευσε πρώτα το προϊόν για να προσθέσεις παρτίδες.</p>;
  }

  // Κάθε ενέργεια αποθηκεύεται κατευθείαν στο backend — όχι μόνο στο τοπικό
  // state — ώστε να μη χάνεται η παρτίδα αν κλείσεις το modal χωρίς να
  // πατήσεις ξεχωριστά το γενικό "Αποθήκευση Αποθέματος".
  const persistAction = async (payload) => {
    setSaveError("");
    setSaving(true);
    try {
      const result = await request(`/products/${productId}/batches`, {
        method: "PUT",
        body: payload,
      });
      onChange(result.batches ?? batches);
      return true;
    } catch (err) {
      setSaveError(err.message || "Σφάλμα αποθήκευσης παρτίδας.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNewBatch = async () => {
    const ok = await persistAction({
      action: "add",
      batch: {
        batchNumber: newBatch.batchNumber || "",
        quantity: Number(newBatch.quantity || 0),
        purchaseDate: newBatch.purchaseDate || null,
        expirationDate: newBatch.expirationDate || null,
        invoiceNumber: newBatch.invoiceNumber || "",
      },
    });
    if (!ok) return;
    setNewBatch({ batchNumber: "", quantity: "", expirationDate: "", purchaseDate: "", invoiceNumber: "" });
    setAdding(false);
  };

  // Auto-save: κάθε πεδίο της γραμμής επεξεργασίας αποθηκεύεται μόνο του
  // όταν φεύγεις από αυτό (blur) — χωρίς ξεχωριστό κουμπί "Αποθήκευση".
  const persistEditField = (updatedBatch) => {
    if (!updatedBatch?._id) return;
    persistAction({
      action: "update",
      batchId: updatedBatch._id,
      patch: {
        batchNumber: updatedBatch.batchNumber || "",
        quantity: Number(updatedBatch.quantity || 0),
        purchaseDate: updatedBatch.purchaseDate || null,
        expirationDate: updatedBatch.expirationDate || null,
        invoiceNumber: updatedBatch.invoiceNumber || "",
      },
    });
  };

  const closeEditRow = () => {
    setEditingIndex(null);
    setEditBatch(null);
  };

  const removeBatch = async (index) => {
    const target = batches[index];
    if (!target?._id) return;
    await persistAction({ action: "remove", batchId: target._id });
  };

  const getRowClass = (b) => {
    const expired = b.expirationDate && dayjs(b.expirationDate).isBefore(dayjs(), "day");
    const expiringSoon = b.expirationDate && dayjs(b.expirationDate).isBefore(dayjs().add(expirationWarningDays, "day"), "day");
    if (expired) return "bg-red-100 dark:bg-red-900/30";
    if (expiringSoon) return "bg-orange-100 dark:bg-orange-900/30";
    return "bg-green-50 dark:bg-green-900/10";
  };

  return (
    <div className="space-y-6">
      {saveError && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{saveError}</p>
      )}
      {batches.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Δεν υπάρχουν παρτίδες. Πρόσθεσε μία.</p>
      ) : (
        <div className="w-full">
          {/* Table για desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full table-auto text-sm border border-gray-200 dark:border-win-border-light rounded-lg">
              <thead className="bg-gray-100 dark:bg-win-elevated text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-2 py-2 border border-gray-200 dark:border-win-border-light">Αρ. Παρτίδας</th>
                  <th className="px-2 py-2 border border-gray-200 dark:border-win-border-light">Ποσότητα</th>
                  <th className="px-2 py-2 border border-gray-200 dark:border-win-border-light">Α/Α Τιμολογίου</th>
                  <th className="px-2 py-2 border border-gray-200 dark:border-win-border-light">Ημ. Αγοράς</th>
                  <th className="px-2 py-2 border border-gray-200 dark:border-win-border-light">Ημ. Λήξης</th>
                  <th className="px-2 py-2 border border-gray-200 dark:border-win-border-light">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b, i) => (
                  <tr key={i} className={getRowClass(b)}>
                    {editingIndex === i ? (
                      <>
                        <td className="px-2 py-1 border border-gray-200 dark:border-win-border-light">
                          <label className={LABEL}>Αρ. Παρτίδας</label>
                          <input type="text" value={editBatch.batchNumber}
                            onChange={(e) => setEditBatch({ ...editBatch, batchNumber: e.target.value })}
                            onBlur={() => persistEditField(editBatch)}
                            className={INPUT} />
                        </td>
                        <td className="px-2 py-1 border border-gray-200 dark:border-win-border-light">
                          <label className={LABEL}>Ποσότητα</label>
                          <input type="number" inputMode="numeric" value={editBatch.quantity}
                            onChange={(e) => setEditBatch({ ...editBatch, quantity: Number(e.target.value) })}
                            onBlur={() => persistEditField(editBatch)}
                            className={INPUT} />
                        </td>
                        <td className="px-2 py-1 border border-gray-200 dark:border-win-border-light">
                          <label className={LABEL}>Α/Α Τιμολογίου</label>
                          <input type="text" value={editBatch.invoiceNumber}
                            onChange={(e) => setEditBatch({ ...editBatch, invoiceNumber: e.target.value })}
                            onBlur={() => persistEditField(editBatch)}
                            className={INPUT} />
                        </td>
                        <td className="px-2 py-1 border border-gray-200 dark:border-win-border-light">
                          <label className={LABEL}>Ημ. Αγοράς</label>
                          <input type="date"
                            value={editBatch.purchaseDate ? dayjs(editBatch.purchaseDate).format("YYYY-MM-DD") : ""}
                            onChange={(e) => { const next = { ...editBatch, purchaseDate: e.target.value }; setEditBatch(next); persistEditField(next); }}
                            className={INPUT} />
                        </td>
                        <td className="px-2 py-1 border border-gray-200 dark:border-win-border-light">
                          <label className={LABEL}>Ημ. Λήξης</label>
                          <input type="date"
                            value={editBatch.expirationDate ? dayjs(editBatch.expirationDate).format("YYYY-MM-DD") : ""}
                            onChange={(e) => { const next = { ...editBatch, expirationDate: e.target.value }; setEditBatch(next); persistEditField(next); }}
                            className={INPUT} />
                        </td>
                        <td className="px-2 py-1 border border-gray-200 dark:border-win-border-light">
                          <Button onClick={closeEditRow} variant="secondary" className="flex items-center gap-1">
                            <XCircle size={16} /> Κλείσιμο
                          </Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 border border-gray-200 dark:border-win-border-light text-gray-800 dark:text-gray-100">{b.batchNumber || "-"}</td>
                        <td className="px-4 py-2 border border-gray-200 dark:border-win-border-light text-gray-800 dark:text-gray-100">{b.quantity}</td>
                        <td className="px-4 py-2 border border-gray-200 dark:border-win-border-light text-gray-800 dark:text-gray-100">{b.invoiceNumber || "-"}</td>
                        <td className="px-4 py-2 border border-gray-200 dark:border-win-border-light text-gray-700 dark:text-gray-200">
                          {b.purchaseDate ? dayjs(b.purchaseDate).format("DD/MM/YYYY") : "-"}
                        </td>
                        <td className="px-4 py-2 border border-gray-200 dark:border-win-border-light text-gray-700 dark:text-gray-200">
                          {b.expirationDate ? dayjs(b.expirationDate).format("DD/MM/YYYY") : "-"}
                        </td>
                        <td className="px-4 py-2 border border-gray-200 dark:border-win-border-light flex gap-2">
                          <Button onClick={() => { setEditingIndex(i); setEditBatch({ ...b }); }} variant="secondary" className="flex items-center gap-1">
                            <Edit size={16} /> Επεξεργασία
                          </Button>
                          <Button onClick={() => removeBatch(i)} disabled={saving} variant="danger" className="flex items-center gap-1">
                            <Trash2 size={16} /> Διαγραφή
                          </Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card layout για κινητό */}
          <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {batches.map((b, i) => (
              <div key={i} className={`p-3 border border-gray-200 dark:border-win-border-light rounded-lg shadow ${getRowClass(b)}`}>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200"><strong>Αρ. Παρτίδας:</strong> {b.batchNumber || "-"}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200"><strong>Ποσότητα:</strong> {b.quantity}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200"><strong>Α/Α Τιμολογίου:</strong> {b.invoiceNumber || "-"}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200"><strong>Ημ. Αγοράς:</strong> {b.purchaseDate ? dayjs(b.purchaseDate).format("DD/MM/YYYY") : "-"}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200"><strong>Ημ. Λήξης:</strong> {b.expirationDate ? dayjs(b.expirationDate).format("DD/MM/YYYY") : "-"}</p>
                <div className="flex gap-2 mt-2">
                  <Button onClick={() => setEditingIndex(i)} variant="secondary" className="flex items-center gap-1">
                    <Edit size={16} /> Επεξεργασία
                  </Button>
                  <Button onClick={() => removeBatch(i)} disabled={saving} variant="danger" className="flex items-center gap-1">
                    <Trash2 size={16} /> Διαγραφή
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Φόρμα νέας παρτίδας */}
      {adding && (
        <div className="p-4 border border-gray-200 dark:border-win-border-light rounded-xl shadow bg-white dark:bg-win-surface space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={LABEL}>Αρ. Παρτίδας</label>
              <input type="text" value={newBatch.batchNumber}
                onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
                className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Ποσότητα</label>
              <input type="number" inputMode="numeric" placeholder="0" value={newBatch.quantity}
                onChange={(e) => setNewBatch({ ...newBatch, quantity: e.target.value })}
                className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Α/Α Τιμολογίου</label>
              <input type="text" value={newBatch.invoiceNumber}
                onChange={(e) => setNewBatch({ ...newBatch, invoiceNumber: e.target.value })}
                className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Ημ. Αγοράς</label>
              <input type="date" value={newBatch.purchaseDate}
                onChange={(e) => setNewBatch({ ...newBatch, purchaseDate: e.target.value })}
                className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Ημ. Λήξης</label>
              <input type="date" value={newBatch.expirationDate}
                onChange={(e) => setNewBatch({ ...newBatch, expirationDate: e.target.value })}
                className={INPUT} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSaveNewBatch} disabled={saving} variant="success" className="flex items-center gap-2">
              <Save size={18} /> {saving ? "Αποθήκευση…" : "Αποθήκευση"}
            </Button>
            <Button onClick={() => setAdding(false)} variant="secondary" className="flex items-center gap-2">
              <XCircle size={18} /> Ακύρωση
            </Button>
          </div>
        </div>
      )}

      {!adding && (
        <Button onClick={() => setAdding(true)} variant="primary" className="flex items-center gap-2">
          <PlusCircle size={18} /> Προσθήκη Παρτίδας
        </Button>
      )}
    </div>
  );
};

export default StockSection;
