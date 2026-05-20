// src/components/settings/WorkingHoursSection.jsx
import React, { useState } from "react";
import { Power, PlusCircle, XCircle, ChevronDown, ChevronRight } from "lucide-react";

const DAYS = [
  { key: "monday", label: "Δευτέρα" },
  { key: "tuesday", label: "Τρίτη" },
  { key: "wednesday", label: "Τετάρτη" },
  { key: "thursday", label: "Πέμπτη" },
  { key: "friday", label: "Παρασκευή" },
  { key: "saturday", label: "Σάββατο" },
  { key: "sunday", label: "Κυριακή" },
];

const WorkingHoursSection = ({ title = "Ωράριο Λειτουργίας", workingHours, updateDay }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-2xl shadow-md bg-white">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <Power className="w-5 h-5 text-emerald-600" />
          <h4 className="font-semibold">{title}</h4>
        </div>
        {open ? (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-600" />
        )}
      </div>

      {/* Περιεχόμενο */}
      {open && (
        <div className="p-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DAYS.map(({ key, label }) => {
              const day = workingHours?.[key] || {
                enabled: false,
                intervals: [{ start: "09:00", end: "17:00" }],
              };

              return (
                <div key={key} className="border rounded-xl p-3 space-y-3">
                  {/* Ημέρα + Switch */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      {label}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!day.enabled}
                        onChange={(e) =>
                          updateDay(key, { enabled: e.target.checked })
                        }
                        className="h-4 w-4"
                      />
                      <span
                        className={`text-xs ${
                          day.enabled ? "text-emerald-600" : "text-gray-400"
                        }`}
                      >
                        {day.enabled ? "Ανοιχτά" : "Κλειστά"}
                      </span>
                    </div>
                  </div>

                  {/* Διαστήματα */}
                  <div className="space-y-2">
                    {day.intervals?.map((interval, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="time"
                          step="900"
                          value={interval.start}
                          disabled={!day.enabled}
                          onChange={(e) => {
                            const newIntervals = [...day.intervals];
                            newIntervals[idx] = {
                              ...newIntervals[idx],
                              start: e.target.value,
                            };
                            updateDay(key, { intervals: newIntervals });
                          }}
                          className="border rounded-lg px-2 py-1 shadow-sm focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-gray-400">–</span>
                        <input
                          type="time"
                          step="900"
                          value={interval.end}
                          disabled={!day.enabled}
                          onChange={(e) => {
                            const newIntervals = [...day.intervals];
                            newIntervals[idx] = {
                              ...newIntervals[idx],
                              end: e.target.value,
                            };
                            updateDay(key, { intervals: newIntervals });
                          }}
                          className="border rounded-lg px-2 py-1 shadow-sm focus:ring-2 focus:ring-indigo-500"
                        />
                        {day.intervals.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newIntervals = day.intervals.filter(
                                (_, i) => i !== idx
                              );
                              updateDay(key, { intervals: newIntervals });
                            }}
                            className="text-red-500 hover:text-red-700"
                            title="Διαγραφή διαστήματος"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Προσθήκη νέου διαστήματος */}
                    {day.enabled && (
                      <button
                        type="button"
                        onClick={() => {
                          const newIntervals = [
                            ...day.intervals,
                            { start: "09:00", end: "17:00" },
                          ];
                          updateDay(key, { intervals: newIntervals });
                        }}
                        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 mt-2"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Προσθήκη διαστήματος
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkingHoursSection;
