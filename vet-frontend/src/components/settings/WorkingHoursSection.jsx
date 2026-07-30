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

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

// Native <input type="time"> εμφανίζει 12ωρο (AM/PM) ή 24ωρο ανάλογα με τις
// ρυθμίσεις γλώσσας/περιοχής των Windows/Chrome, όχι με βάση τη σελίδα —
// δύο select (ώρα/λεπτά) εγγυώνται πάντα 24ωρη μορφή, ανεξάρτητα συσκευής.
function TimeInput24({ value, onChange }) {
  const [h, m] = (value || "00:00").split(":");
  const minuteOptions = MINUTES.includes(m) ? MINUTES : [...MINUTES, m].sort();

  return (
    <div className="flex items-center gap-0.5 border border-gray-200 dark:border-win-border-light rounded-lg pl-2.5 pr-1.5 py-1.5 bg-white dark:bg-win-elevated focus-within:ring-2 focus-within:ring-indigo-300">
      <select
        value={h}
        onChange={(e) => onChange(`${e.target.value}:${m}`)}
        className="text-sm bg-transparent focus:outline-none tabular-nums text-gray-900 dark:text-gray-100 [color-scheme:light] dark:[color-scheme:dark]"
      >
        {HOURS.map((hh) => <option key={hh} value={hh}>{hh}</option>)}
      </select>
      <span className="text-gray-400 dark:text-gray-500 text-sm">:</span>
      <select
        value={m}
        onChange={(e) => onChange(`${h}:${e.target.value}`)}
        className="text-sm bg-transparent focus:outline-none tabular-nums text-gray-900 dark:text-gray-100 [color-scheme:light] dark:[color-scheme:dark]"
      >
        {minuteOptions.map((mm) => <option key={mm} value={mm}>{mm}</option>)}
      </select>
    </div>
  );
}

const WorkingHoursSection = ({ title = "Ωράριο Λειτουργίας", workingHours, updateDay }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-win-border overflow-hidden">

      {/* Header — collapsible */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-win-elevated/50 hover:bg-gray-100 dark:hover:bg-win-elevated transition-colors"
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
        <div className="divide-y divide-gray-100 dark:divide-win-border">
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
                          <TimeInput24
                            value={interval.start}
                            onChange={(v) => {
                              const updated = [...day.intervals];
                              updated[idx] = { ...updated[idx], start: v };
                              updateDay(key, { intervals: updated });
                            }}
                          />
                          <span className="text-gray-400 dark:text-gray-500 text-sm">—</span>
                          <TimeInput24
                            value={interval.end}
                            onChange={(v) => {
                              const updated = [...day.intervals];
                              updated[idx] = { ...updated[idx], end: v };
                              updateDay(key, { intervals: updated });
                            }}
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
