import React, { useState, useEffect } from "react";
import { Save, Truck, Phone, Mail, Globe, User, StickyNote } from "lucide-react";
import { Button } from "../ui/button.jsx";
import Modal from "../ui/Modal.jsx";

const INPUT = "w-full border border-gray-200 dark:border-win-border-light rounded-2xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder-gray-400 dark:placeholder-gray-500 dark:bg-win-elevated dark:text-gray-100";
const LABEL = "block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1";

const SupplierModal = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "", contact: "", phone: "", email: "", website: "", notes: "",
  });

  useEffect(() => {
    setFormData({
      _id:     initialData?._id     || null,
      name:    initialData?.name    || "",
      contact: initialData?.contact || "",
      phone:   initialData?.phone   || "",
      email:   initialData?.email   || "",
      website: initialData?.website || "",
      notes:   initialData?.notes   || "",
    });
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Το όνομα είναι υποχρεωτικό.");
      return;
    }
    onSave?.(formData);
  };

  return (
    <Modal isOpen={true} onClose={onCancel}>
      {/* Gradient Header */}
      <div className="-mx-6 -mt-6 mb-5 rounded-t-2xl bg-gradient-to-r from-orange-400 to-amber-300 px-6 py-5">
        <div className="flex items-center gap-2.5 text-white">
          <Truck className="w-5 h-5" />
          <span className="text-lg font-bold">
            {initialData ? "Επεξεργασία Προμηθευτή" : "Νέος Προμηθευτής"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Βασικά */}
        <div className="bg-gray-50 dark:bg-win-elevated/50 rounded-2xl px-4 py-3 space-y-3">
          <p className={LABEL}>Βασικά Στοιχεία</p>
          <div>
            <label className={LABEL}>Όνομα *</label>
            <input
              type="text" name="name"
              placeholder="π.χ. Arielu Sigma"
              value={formData.name}
              onChange={handleChange}
              className={INPUT}
              required
            />
          </div>
          <div>
            <label className={LABEL}>Υπεύθυνος Επικοινωνίας</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
              <input
                type="text" name="contact"
                placeholder="Όνομα υπεύθυνου"
                value={formData.contact}
                onChange={handleChange}
                className={INPUT + " pl-8"}
              />
            </div>
          </div>
        </div>

        {/* Επικοινωνία */}
        <div className="bg-gray-50 dark:bg-win-elevated/50 rounded-2xl px-4 py-3 space-y-3">
          <p className={LABEL}>Επικοινωνία</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Τηλέφωνο</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                <input
                  type="text" name="phone"
                  placeholder="210 0000000"
                  value={formData.phone}
                  onChange={handleChange}
                  className={INPUT + " pl-8"}
                />
              </div>
            </div>
            <div>
              <label className={LABEL}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                <input
                  type="email" name="email"
                  placeholder="info@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={INPUT + " pl-8"}
                />
              </div>
            </div>
          </div>
          <div>
            <label className={LABEL}>Ιστότοπος</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
              <input
                type="text" name="website"
                placeholder="www.example.com"
                value={formData.website}
                onChange={handleChange}
                className={INPUT + " pl-8"}
              />
            </div>
          </div>
        </div>

        {/* Σημειώσεις */}
        <div className="bg-gray-50 dark:bg-win-elevated/50 rounded-2xl px-4 py-3">
          <label className={LABEL}>Σημειώσεις</label>
          <textarea
            name="notes"
            placeholder="Προαιρετικές σημειώσεις..."
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className={INPUT}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 dark:border-win-border">
          <Button variant="danger" type="button" onClick={onCancel}>
            Ακύρωση
          </Button>
          <Button variant="success" type="submit">
            <Save className="w-4 h-4" />
            Αποθήκευση
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SupplierModal;
