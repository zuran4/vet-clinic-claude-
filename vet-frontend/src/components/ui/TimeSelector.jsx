import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Clock } from "lucide-react";
import { Button } from "./button";

/**
 * TimeSelector
 * - Δέχεται: date, onChangeDate, availableSlots, selectedTime, onChangeTime
 * - Δείχνει datepicker + grid με ώρες
 */
const TimeSelector = ({
  date,
  onChangeDate,
  availableSlots = [],
  selectedTime,
  onChangeTime,
}) => {
  return (
    <div className="space-y-2">
      {/* Επιλογή ημερομηνίας */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        <DatePicker
          selected={date}
          onChange={onChangeDate}
          dateFormat="dd/MM/yyyy"
          className="border dark:border-win-border-light px-2 py-1.5 rounded-lg text-sm dark:bg-win-elevated dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Slots */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
        {availableSlots.length === 0 && (
          <p className="col-span-full text-gray-400 dark:text-gray-500 text-xs">
            Δεν υπάρχουν διαθέσιμα slots
          </p>
        )}
        {availableSlots.map(({ time, taken }) => (
          <button
            key={time}
            type="button"
            onClick={() => !taken && onChangeTime(time)}
            disabled={taken}
            className={`text-xs font-medium py-1.5 rounded-lg transition-colors ${
              taken
                ? "bg-red-50 dark:bg-red-900/20 text-red-300 dark:text-red-700 cursor-not-allowed"
                : selectedTime === time
                ? "bg-indigo-500 text-white shadow-sm"
                : "bg-white dark:bg-win-elevated border border-gray-200 dark:border-win-border-light text-gray-600 dark:text-gray-300 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            }`}
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeSelector;
