import React, { useState } from "react";
import { Clock, ChevronDown, ChevronUp, Plus, X } from "lucide-react";

const DAYS = [
  { key: "monday",    label: "Δευτέρα"   },
  { key: "tuesday",   label: "Τρίτη"     },
  { key: "wednesday", label: "Τετάρτη"   },
  { key: "thursday",  label: "Πέμπτη"    },
  { key: "friday",    label: "Παρασκευή" },
  { key: "saturday",  label: "Σάββατο"   },
  { key: "sunday",    label: "Κυριακή"   },
];

const TIME_INPUT = "border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 tabular-nums w-[90px]";

const WorkingHoursSection = ({ title = "Ωράριο Λειτουργίας", workingHours, updateDay }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">

      {/* Header — collapsible */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</span>
          {/* Σύνοψη ανοιχτών ημερών */}
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
            {DAYS.filter(d => workingHours?.[d.key]?.enabled).length} / 7 ημέρες
          </span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        }
      </button>

      {/* Content */}
      {open && (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {DAYS.map(({ key, label }) => {
            const day = workingHours?.[key] || {
              enabled: false,
              intervals: [{ start: "09:00", end: "17:00" }],
            };

            return (
              <div key={key} className={`px-5 py-3 transition-colors ${day.enabled ? "" : "opacity-50"}`}>
                <div className="flex items-center gap-4">

                  {/* Pill toggle */}
                  <button
                    type="button"
                    onClick={() => updateDay(key, { enabled: !day.enabled })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full flex-shrink-0 transition-colors ${
                      day.enabled ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      day.enabled ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </button>

                  {/* Day label */}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-24 flex-shrink-0">{label}</span>

                  {/* Intervals */}
                  {day.enabled ? (
                    <div className="flex-1 space-y-1.5">
                      {day.intervals?.map((interval, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="time"
                            step="900"
                            value={interval.start}
                            onChange={(e) => {
                              const updated = [...day.intervals];
                              updated[idx] = { ...updated[idx], start: e.target.value };
                              updateDay(key, { intervals: updated });
                            }}
                            className={TIME_INPUT}
                          />
                          <span className="text-gray-400 dark:text-gray-500 text-sm">—</span>
                          <input
                            type="time"
                            step="900"
                            value={interval.end}
                            onChange={(e) => {
                              const updated = [...day.intervals];
                              updated[idx] = { ...updated[idx], end: e.target.value };
                              updateDay(key, { intervals: updated });
                            }}
                            className={TIME_INPUT}
                          />
                          {day.intervals.length > 1 && (
                            <button
                              type="button"
                              onClick={() => updateDay(key, { intervals: day.intervals.filter((_, i) => i !== idx) })}
                              className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Add interval */}
                      <button
                        type="button"
                        onClick={() => updateDay(key, {
                          intervals: [...day.intervals, { start: "09:00", end: "17:00" }]
                        })}
                        className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Προσθήκη διαστήματος
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">Κλειστά</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkingHoursSection;
