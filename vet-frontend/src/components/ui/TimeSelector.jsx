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
    <div className="space-y-3">
      {/* Επιλογή ημερομηνίας */}
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <DatePicker
          selected={date}
          onChange={onChangeDate}
          dateFormat="dd/MM/yyyy"
          className="w-full border dark:border-gray-600 p-2 rounded text-sm dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Slots */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {availableSlots.length === 0 && (
          <p className="col-span-full text-gray-400 dark:text-gray-500 text-sm">
            Δεν υπάρχουν διαθέσιμα slots
          </p>
        )}
        {availableSlots.map(({ time, taken }) => (
          <Button
            key={time}
            type="button"
            variant={
              taken
                ? "danger"
                : selectedTime === time
                ? "primary"
                : "secondary"
            }
            className={`w-full text-sm ${
              taken ? "cursor-not-allowed opacity-50" : ""
            }`}
            onClick={() => !taken && onChangeTime(time)}
            disabled={taken}
          >
            {time}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TimeSelector;
