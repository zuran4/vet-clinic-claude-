import React from "react";
import MultiSelectDropdown from "../ui/MultiSelectDropdown";

const LABEL = "text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide";
const CONTROL = "w-full border border-gray-200 dark:border-win-border-light p-2 rounded-2xl text-sm shadow-sm bg-white dark:bg-win-elevated text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300";

/**
 * AppointmentFormFields
 * - Δέχεται: formData, onChange, optionsByDoctor, doctor
 * - Δείχνει: dropdown για type, select για duration, textarea για notes
 */
const AppointmentFormFields = ({ formData, onChange, onChangeType, optionsByDoctor, doctor }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Τύπος Ραντεβού — πολλαπλή επιλογή */}
      <div className="col-span-full flex flex-col gap-1.5">
        <label className={LABEL}>
          Τύπος <span className="text-gray-400 dark:text-gray-500 font-normal normal-case tracking-normal">(μπορείς να διαλέξεις παραπάνω από έναν)</span>
        </label>
        <MultiSelectDropdown
          options={optionsByDoctor[doctor] || []}
          selected={formData.type}
          onChange={onChangeType}
          placeholder="Επίλεξε τύπο ραντεβού..."
        />
      </div>

      {/* Διάρκεια */}
      <div className="flex flex-col gap-1.5">
        <label className={LABEL}>Διάρκεια</label>
        <select
          name="duration"
          value={formData.duration}
          onChange={onChange}
          className={CONTROL}
        >
          <option value={30}>30 λεπτά</option>
          <option value={60}>1 ώρα</option>
          <option value={90}>1 ώρα & 30 λεπτά</option>
          <option value={120}>2 ώρες</option>
        </select>
      </div>

      {/* Σημειώσεις */}
      <div className="col-span-full flex flex-col gap-1.5">
        <label className={LABEL}>Σημειώσεις</label>
        <textarea
          name="notes"
          placeholder="Σημειώσεις (προαιρετικό)"
          value={formData.notes}
          onChange={onChange}
          className={`${CONTROL} placeholder-gray-400 dark:placeholder-gray-500 resize-none`}
          rows={3}
        />
      </div>
    </div>
  );
};

export default AppointmentFormFields;
