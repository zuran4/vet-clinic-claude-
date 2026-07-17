import React from "react";
import { ClipboardList, Clock4, FileText } from "lucide-react";
import MultiSelectDropdown from "../ui/MultiSelectDropdown";

/**
 * AppointmentFormFields
 * - Δέχεται: formData, onChange, optionsByDoctor, doctor
 * - Δείχνει: dropdown για type, select για duration, textarea για notes
 */
const AppointmentFormFields = ({ formData, onChange, onChangeType, optionsByDoctor, doctor }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Τύπος Ραντεβού — πολλαπλή επιλογή */}
      <div className="col-span-full flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
          <ClipboardList className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          Τύπος <span className="text-xs text-gray-400 font-normal">(μπορείς να διαλέξεις παραπάνω από έναν)</span>
        </label>
        <MultiSelectDropdown
          options={optionsByDoctor[doctor] || []}
          selected={formData.type}
          onChange={onChangeType}
          placeholder="Επίλεξε τύπο ραντεβού..."
        />
      </div>

      {/* Διάρκεια */}
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <Clock4 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          Διάρκεια
        </label>
        <select
          name="duration"
          value={formData.duration}
          onChange={onChange}
          className="w-full border border-gray-300 dark:border-win-border-light p-2 rounded-2xl text-sm shadow-sm bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary"
        >
          <option value={30}>30 λεπτά</option>
          <option value={60}>1 ώρα</option>
          <option value={90}>1 ώρα & 30 λεπτά</option>
          <option value={120}>2 ώρες</option>
        </select>
      </div>

      {/* Σημειώσεις */}
      <div className="col-span-full flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <FileText className="w-4 h-4 text-gray-500" />
          Σημειώσεις
        </label>
        <textarea
          name="notes"
          placeholder="Σημειώσεις (προαιρετικό)"
          value={formData.notes}
          onChange={onChange}
          className="w-full border border-gray-300 dark:border-win-border-light p-2 rounded-2xl text-sm shadow-sm bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary"
          rows={3}
        />
      </div>
    </div>
  );
};

export default AppointmentFormFields;
