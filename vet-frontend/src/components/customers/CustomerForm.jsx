// ===============================================
// 📄 CustomerForm.jsx
// Περιγραφή: Φόρμα για προσθήκη / επεξεργασία πελάτη
// ===============================================

import React from "react";
import { XCircle, Save } from "lucide-react";
import { Button } from "../ui/button.jsx";
import { useCustomerForm } from "./hooks/useCustomerForm.js";

const CustomerForm = ({ initialData, onSaved, onCancel }) => {
  // -------------------------------------
  // 1️⃣ Custom hook για τη φόρμα
  // -------------------------------------
  const {
    formData,
    loading,
    handleChange,
    handleNotificationChange,
    handleSubmit,
  } = useCustomerForm(initialData, onSaved, onCancel);

  // -------------------------------------
  // 2️⃣ UI φόρμας
  // -------------------------------------
  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
      >
        {/* Όνομα */}
        <input
          type="text"
          name="name"
          placeholder="Ονοματεπώνυμο"
          value={formData.name}
          onChange={handleChange}
          className="border px-3 py-2 rounded-2xl shadow-sm w-full text-sm"
          required
        />

        {/* Τηλέφωνο */}
        <input
          type="tel"
          name="phone"
          placeholder="Τηλέφωνο"
          value={formData.phone}
          onChange={handleChange}
          className="border px-3 py-2 rounded-2xl shadow-sm w-full text-sm"
        />

        {/* Email */}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="border px-3 py-2 rounded-2xl shadow-sm w-full text-sm"
        />

        {/* Διεύθυνση */}
        <input
          type="text"
          name="address"
          placeholder="Διεύθυνση"
          value={formData.address}
          onChange={handleChange}
          className="border px-3 py-2 rounded-2xl shadow-sm w-full text-sm"
        />

        {/* Σημειώσεις */}
        <textarea
          name="notes"
          placeholder="Σημειώσεις"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          className="border px-3 py-2 rounded-2xl shadow-sm w-full text-sm col-span-2"
        />

        {/* Ειδοποιήσεις */}
        <div className="col-span-2 flex flex-wrap gap-4 mt-2">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              name="email"
              checked={formData.notifications.email}
              onChange={handleNotificationChange}
            />
            Email
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              name="sms"
              checked={formData.notifications.sms}
              onChange={handleNotificationChange}
            />
            SMS
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              name="reminders"
              checked={formData.notifications.reminders}
              onChange={handleNotificationChange}
            />
            Υπενθυμίσεις
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              name="promotions"
              checked={formData.notifications.promotions}
              onChange={handleNotificationChange}
            />
            Προσφορές
          </label>
        </div>

        {/* Κουμπιά */}
        <div className="flex justify-end gap-3 pt-4 col-span-2">
          <Button variant="secondary" type="button" onClick={onCancel}>
            <XCircle className="w-4 h-4" />
            Ακύρωση
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Αποθήκευση...
              </span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Αποθήκευση
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
