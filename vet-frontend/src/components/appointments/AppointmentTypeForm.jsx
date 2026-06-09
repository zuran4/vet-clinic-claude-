import React, { useState } from "react";
import { Clock4 } from "lucide-react";
import { Button } from "../ui/button";
import Modal from "../ui/Modal";

const AppointmentTypeForm = ({ time, onSave, onCancel }) => {
  const [type, setType] = useState("Εξέταση");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(type);
  };

  return (
    <Modal isOpen={true} onClose={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-96 shadow-xl space-y-4">
        {/* Τίτλος */}
        <h2 className="text-lg font-bold flex items-center gap-2 text-gray-700 dark:text-gray-100">
          <Clock4 className="w-5 h-5 text-primary" />
          {time} – Επιλογή Τύπου
        </h2>

        {/* Φόρμα */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-600 px-3 py-2 rounded-2xl shadow focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="Εξέταση">Εξέταση</option>
            <option value="Εμβόλιο">Εμβόλιο</option>
            <option value="Αποπαρασίτωση">Αποπαρασίτωση</option>
            <option value="Χειρουργείο">Χειρουργείο</option>
            <option value="Στείρωση">Στείρωση</option>
          </select>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="gap-2"
            >
              Άκυρο
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="gap-2"
            >
              Καταχώρηση
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AppointmentTypeForm;
