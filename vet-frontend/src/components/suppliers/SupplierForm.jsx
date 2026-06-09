import React, { useState, useEffect } from "react";
import {
  Phone,
  Mail,
  StickyNote,
  User,
  Save,
  X,
  Globe
} from "lucide-react";
import  Button  from "../ui/button";

const SupplierForm = ({ initialData, onSave, onCancel }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [websiteError, setWebsiteError] = useState("");

  // 🔹 Κανονικοποίηση website
  const normalizeWebsite = (raw) => {
    if (!raw) return "";
    let v = raw.trim();
    if (/^https?:\/\//i.test(v)) return v;
    if (/^www\./i.test(v)) return `https://${v}`;
    if (/^[a-z0-9-]+\.[a-z]{2,}(\S*)?$/i.test(v)) return `https://${v}`;
    return v;
  };

  // 🔹 Ελαφρύ validation
  const isValidWebsite = (v) => {
    if (!v) return true; // το αφήνουμε κενό αν θέλει
    return /^(https?:\/\/)?([^\s.]+\.)+[^\s]{2,}\/?([^\s]*)?$/.test(v);
  };

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setPhone(initialData.phone || "");
      setEmail(initialData.email || "");
      setWebsite(initialData.website || "");
      setNotes(initialData.notes || "");
    }
  }, [initialData]);

  const handleWebsiteBlur = (value) => {
    const normalized = normalizeWebsite(value);
    setWebsite(normalized);
    setWebsiteError(isValidWebsite(normalized) ? "" : "Μη έγκυρο URL");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const supplier = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      website: normalizeWebsite(website),
      notes: notes.trim(),
    };

    if (initialData?._id) {
      supplier._id = initialData._id;
    }

    if (!supplier.name) {
      alert("Το όνομα είναι υποχρεωτικό.");
      return;
    }
    if (websiteError) {
      alert("Διόρθωσε το πεδίο Website πριν την αποθήκευση.");
      return;
    }

    onSave(supplier);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border dark:border-gray-600 mt-4">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-purple-500" />
        {initialData ? "Επεξεργασία Προμηθευτή" : "Νέος Προμηθευτής"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Όνομα */}
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1 mb-1">
            <User className="w-4 h-4" />
            Όνομα
          </label>
          <input
            type="text"
            className="w-full border dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Τηλέφωνο */}
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1 mb-1">
            <Phone className="w-4 h-4" />
            Τηλέφωνο
          </label>
          <input
            type="text"
            className="w-full border dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1 mb-1">
            <Mail className="w-4 h-4" />
            Email
          </label>
          <input
            type="email"
            className="w-full border dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Website */}
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1 mb-1">
            <Globe className="w-4 h-4" />
            Website
          </label>
          <input
            type="text"
            placeholder="https://example.com ή www.example.com"
            className={`w-full border dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 ${websiteError ? "border-red-500" : ""}`}
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            onBlur={(e) => handleWebsiteBlur(e.target.value)}
            inputMode="url"
          />
          {websiteError && (
            <p className="text-red-500 text-xs mt-1">{websiteError}</p>
          )}
        </div>

        {/* Σημειώσεις */}
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1 mb-1">
            <StickyNote className="w-4 h-4" />
            Σημειώσεις
          </label>
          <textarea
            className="w-full border dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Κουμπιά */}
        <div className="flex gap-3 mt-4">
          <Button type="submit" variant="primary">
            <Save className="w-4 h-4" />
            Αποθήκευση
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            <X className="w-4 h-4" />
            Ακύρωση
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
