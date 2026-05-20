import React, { useState } from "react";
import dayjs from "dayjs";
import { PlusCircle, Trash2, Save, XCircle, Edit } from "lucide-react";
import { Button } from "../ui/button";

const StockSection = ({ productId, batches = [], expirationWarningDays = 30, onChange }) => {
  const [adding, setAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editBatch, setEditBatch] = useState(null);
  const [newBatch, setNewBatch] = useState({
    batchNumber: "",
    quantity: 0,
    expirationDate: "",
    purchaseDate: "",
    invoiceNumber: "",
  });

  if (!productId) {
    return <p className="text-gray-500">Αποθήκευσε πρώτα το προϊόν για να προσθέσεις παρτίδες.</p>;
  }

  // ✅ Προσθήκη νέας παρτίδας
  const handleSaveNewBatch = () => {
    onChange([...batches, newBatch]);
    setNewBatch({ batchNumber: "", quantity: 0, expirationDate: "", purchaseDate: "", invoiceNumber: "" });
    setAdding(false);
  };

  // ✅ Αποθήκευση αλλαγών σε υπάρχουσα παρτίδα
  const handleSaveEdit = (index, updatedBatch) => {
    const updated = [...batches];
    updated[index] = updatedBatch;
    onChange(updated);
    setEditingIndex(null);
    setEditBatch(null);
  };

  // ✅ Διαγραφή παρτίδας
  const removeBatch = (index) => {
    const updated = batches.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {batches.length === 0 ? (
        <p className="text-gray-500">Δεν υπάρχουν παρτίδες. Πρόσθεσε μία.</p>
      ) : (
        <div className="w-full">
          {/* ✅ Table για desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full table-auto text-sm border border-gray-200 rounded-lg">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-2 py-2 border">Αρ. Παρτίδας</th>
                  <th className="px-2 py-2 border">Ποσότητα</th>
                  <th className="px-2 py-2 border">Α/Α Τιμολογίου</th>
                  <th className="px-2 py-2 border">Ημ. Αγοράς</th>
                  <th className="px-2 py-2 border">Ημ. Λήξης</th>
                  <th className="px-2 py-2 border">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b, i) => {
                  const expired = b.expirationDate && dayjs(b.expirationDate).isBefore(dayjs(), "day");
                  const expiringSoon =
                    b.expirationDate &&
                    dayjs(b.expirationDate).isBefore(dayjs().add(expirationWarningDays, "day"), "day");

                  return (
                    <tr
                      key={i}
                      className={`${
                        expired
                          ? "bg-red-100"
                          : expiringSoon
                          ? "bg-orange-100"
                          : "bg-green-50"
                      }`}
                    >
                      {editingIndex === i ? (
                        <>
                          <td className="px-2 py-1 border">
                            <label className="block text-sm font-medium text-gray-700">Αρ. Παρτίδας</label>
                            <input
                              type="text"
                              value={editBatch.batchNumber}
                              onChange={(e) => setEditBatch({ ...editBatch, batchNumber: e.target.value })}
                              className="mt-1 w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-2 py-1 border">
                            <label className="block text-sm font-medium text-gray-700">Ποσότητα</label>
                            <input
                              type="number"
                              value={editBatch.quantity}
                              onChange={(e) => setEditBatch({ ...editBatch, quantity: Number(e.target.value) })}
                              className="mt-1 w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-2 py-1 border">
                            <label className="block text-sm font-medium text-gray-700">Α/Α Τιμολογίου</label>
                            <input
                              type="text"
                              value={editBatch.invoiceNumber}
                              onChange={(e) => setEditBatch({ ...editBatch, invoiceNumber: e.target.value })}
                              className="mt-1 w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-2 py-1 border">
                            <label className="block text-sm font-medium text-gray-700">Ημ. Αγοράς</label>
                            <input
                              type="date"
                              value={editBatch.purchaseDate ? dayjs(editBatch.purchaseDate).format("YYYY-MM-DD") : ""}
                              onChange={(e) => setEditBatch({ ...editBatch, purchaseDate: e.target.value })}
                              className="mt-1 w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-2 py-1 border">
                            <label className="block text-sm font-medium text-gray-700">Ημ. Λήξης</label>
                            <input
                              type="date"
                              value={editBatch.expirationDate ? dayjs(editBatch.expirationDate).format("YYYY-MM-DD") : ""}
                              onChange={(e) => setEditBatch({ ...editBatch, expirationDate: e.target.value })}
                              className="mt-1 w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-2 py-1 border flex gap-2">
                            <Button
                              onClick={() => handleSaveEdit(i, editBatch)}
                              variant="success"
                              className="flex items-center gap-1"
                            >
                              <Save size={16} /> Αποθήκευση
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingIndex(null);
                                setEditBatch(null);
                              }}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <XCircle size={16} /> Ακύρωση
                            </Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2 border">{b.batchNumber || "-"}</td>
                          <td className="px-4 py-2 border">{b.quantity}</td>
                          <td className="px-4 py-2 border">{b.invoiceNumber || "-"}</td>
                          <td className="px-4 py-2 border">
                            {b.purchaseDate ? dayjs(b.purchaseDate).format("DD/MM/YYYY") : "-"}
                          </td>
                          <td className="px-4 py-2 border">
                            {b.expirationDate ? dayjs(b.expirationDate).format("DD/MM/YYYY") : "-"}
                          </td>
                          <td className="px-4 py-2 border flex gap-2">
                            <Button
                              onClick={() => {
                                setEditingIndex(i);
                                setEditBatch({ ...b });
                              }}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <Edit size={16} /> Επεξεργασία
                            </Button>
                            <Button
                              onClick={() => removeBatch(i)}
                              variant="danger"
                              className="flex items-center gap-1"
                            >
                              <Trash2 size={16} /> Διαγραφή
                            </Button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ✅ Card layout για κινητό (2 στήλες σε tablet) */}
          <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {batches.map((b, i) => (
              <div
                key={i}
                className={`p-3 border rounded-lg shadow ${
                  b.expirationDate && dayjs(b.expirationDate).isBefore(dayjs(), "day")
                    ? "bg-red-100"
                    : b.expirationDate &&
                      dayjs(b.expirationDate).isBefore(dayjs().add(expirationWarningDays, "day"), "day")
                    ? "bg-orange-100"
                    : "bg-green-50"
                }`}
              >
                <p className="text-sm font-medium text-gray-700">
                  <strong>Αρ. Παρτίδας:</strong> {b.batchNumber || "-"}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  <strong>Ποσότητα:</strong> {b.quantity}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  <strong>Α/Α Τιμολογίου:</strong> {b.invoiceNumber || "-"}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  <strong>Ημ. Αγοράς:</strong> {b.purchaseDate ? dayjs(b.purchaseDate).format("DD/MM/YYYY") : "-"}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  <strong>Ημ. Λήξης:</strong> {b.expirationDate ? dayjs(b.expirationDate).format("DD/MM/YYYY") : "-"}
                </p>
                <div className="flex gap-2 mt-2">
                  <Button onClick={() => setEditingIndex(i)} variant="secondary" className="flex items-center gap-1">
                    <Edit size={16} /> Επεξεργασία
                  </Button>
                  <Button onClick={() => removeBatch(i)} variant="danger" className="flex items-center gap-1">
                    <Trash2 size={16} /> Διαγραφή
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ Φόρμα νέας παρτίδας */}
      {adding && (
        <div className="p-4 border rounded-xl shadow bg-white space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Αρ. Παρτίδας</label>
              <input
                type="text"
                value={newBatch.batchNumber}
                onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
                className="mt-1 w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ποσότητα</label>
              <input
                type="number"
                value={newBatch.quantity}
                onChange={(e) => setNewBatch({ ...newBatch, quantity: Number(e.target.value) })}
                className="mt-1 w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Α/Α Τιμολογίου</label>
              <input
                type="text"
                value={newBatch.invoiceNumber}
                onChange={(e) => setNewBatch({ ...newBatch, invoiceNumber: e.target.value })}
                className="mt-1 w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ημ. Αγοράς</label>
              <input
                type="date"
                value={newBatch.purchaseDate}
                onChange={(e) => setNewBatch({ ...newBatch, purchaseDate: e.target.value })}
                className="mt-1 w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ημ. Λήξης</label>
              <input
                type="date"
                value={newBatch.expirationDate}
                onChange={(e) => setNewBatch({ ...newBatch, expirationDate: e.target.value })}
                className="mt-1 w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSaveNewBatch} variant="success" className="flex items-center gap-2">
              <Save size={18} /> Αποθήκευση
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
