import React from "react";
import { ClipboardList, Clock4, FileText } from "lucide-react";

/**
 * AppointmentFormFields
 * - Δέχεται: formData, onChange, optionsByDoctor, doctor
 * - Δείχνει: select για type, select για duration, textarea για notes
 */
const AppointmentFormFields = ({ formData, onChange, optionsByDoctor, doctor }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Τύπος Ραντεβού */}
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <ClipboardList className="w-4 h-4 text-gray-500" />
          Τύπος
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={onChange}
          className="w-full border p-2 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-primary"
        >
          {optionsByDoctor[doctor]?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Διάρκεια */}
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <Clock4 className="w-4 h-4 text-gray-500" />
          Διάρκεια
        </label>
        <select
          name="duration"
          value={formData.duration}
          onChange={onChange}
          className="w-full border p-2 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-primary"
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
          className="w-full border p-2 rounded-2xl text-sm shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-primary"
          rows={3}
        />
      </div>
    </div>
  );
};

export default AppointmentFormFields;
