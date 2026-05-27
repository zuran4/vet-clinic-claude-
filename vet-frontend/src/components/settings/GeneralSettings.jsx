import React, { useEffect, useMemo, useState } from "react";
import { Clock, UserPlus, X, Users } from "lucide-react";
import { Button } from "../ui/button";
import dayjs from "../../utils/dayjsConfig";
import WorkingHoursSection from "./WorkingHoursSection";
import request from "../../api/apiClient.js"; // ✅ χρήση του apiClient

// 🔹 Προεπιλεγμένο ωράριο (intervals format — ταιριάζει με backend + WorkingHoursSection)
const defaultWorkingHours = () => ({
  monday:    { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  tuesday:   { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  wednesday: { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  thursday:  { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  friday:    { enabled: true,  intervals: [{ start: "09:00", end: "17:00" }] },
  saturday:  { enabled: true,  intervals: [{ start: "10:00", end: "14:00" }] },
  sunday:    { enabled: false, intervals: [{ start: "09:00", end: "17:00" }] },
});

// 🔹 Fallback για timezones
const getSupportedTimeZones = () => {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [
      "Europe/Athens",
      "UTC",
      "Europe/London",
      "America/New_York",
      "America/Los_Angeles",
      "Asia/Dubai",
      "Asia/Tokyo",
      "Australia/Sydney",
    ];
  }
};

const ROLES = ["Κτηνίατρος", "Βοηθός Κτηνιάτρου", "Groomer"];

const ROLE_STYLE = {
  "Κτηνίατρος":        "bg-violet-100 text-violet-700",
  "Βοηθός Κτηνιάτρου": "bg-sky-100 text-sky-700",
  "Groomer":            "bg-teal-100 text-teal-700",
};

const GeneralSettings = ({ settings, setSettings }) => {
  const [localSettings, setLocalSettings] = useState(() => ({
    clinicName: "",
    logo: "",
    language: "el",
    timezone: "Europe/Athens",
    clinicWorkingHours: defaultWorkingHours(),
    groomingWorkingHours: defaultWorkingHours(),
    staff: [],
    ...(settings || {}),
  }));

  // State για τη φόρμα νέου μέλους
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Κτηνίατρος");

  // Συγχρονισμός όταν αλλάζει το parent settings
  useEffect(() => {
    if (settings) {
      setLocalSettings((prev) => ({
        ...prev,
        ...settings,
        clinicWorkingHours: {
          ...defaultWorkingHours(),
          ...(settings.clinicWorkingHours || {}),
        },
        groomingWorkingHours: {
          ...defaultWorkingHours(),
          ...(settings.groomingWorkingHours || {}),
        },
        staff: settings.staff || [],
      }));
    }
  }, [settings]);

  // Ενημέρωση πεδίων
  const handleChange = (field, value) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  // Update functions
  const updateClinicDay = (dayKey, patch) => {
    setLocalSettings((prev) => ({
      ...prev,
      clinicWorkingHours: {
        ...prev.clinicWorkingHours,
        [dayKey]: { ...prev.clinicWorkingHours[dayKey], ...patch },
      },
    }));
  };

  const updateGroomingDay = (dayKey, patch) => {
    setLocalSettings((prev) => ({
      ...prev,
      groomingWorkingHours: {
        ...prev.groomingWorkingHours,
        [dayKey]: { ...prev.groomingWorkingHours[dayKey], ...patch },
      },
    }));
  };

  const timeZones = useMemo(getSupportedTimeZones, []);

  // Προσθήκη μέλους προσωπικού
  const addStaff = () => {
    const name = newName.trim();
    if (!name) return;
    setLocalSettings((prev) => ({
      ...prev,
      staff: [...(prev.staff || []), { name, role: newRole }],
    }));
    setNewName("");
    setNewRole("Κτηνίατρος");
  };

  // Αφαίρεση μέλους
  const removeStaff = (index) => {
    setLocalSettings((prev) => ({
      ...prev,
      staff: prev.staff.filter((_, i) => i !== index),
    }));
  };

  // Αποθήκευση
  const handleSave = async () => {
    try {
      const payload = {
        clinicName: localSettings.clinicName,
        logo: localSettings.logo,
        language: localSettings.language,
        timezone: localSettings.timezone,
        clinicWorkingHours: localSettings.clinicWorkingHours,
        groomingWorkingHours: localSettings.groomingWorkingHours,
        staff: localSettings.staff || [],
      };

      // 🔁 Χρήση apiClient αντί για fetch + localhost
      const data = await request("/settings", {
        method: "PUT",
        body: payload,
      });

      setSettings(data);

      // LocalStorage
      localStorage.setItem("clinicName", data.clinicName || "");
      localStorage.setItem("language", data.language || "el");
      localStorage.setItem("timeZone", data.timezone || "Europe/Athens");
      localStorage.setItem(
        "clinicWorkingHours",
        JSON.stringify(data.clinicWorkingHours || defaultWorkingHours())
      );
      localStorage.setItem(
        "groomingWorkingHours",
        JSON.stringify(data.groomingWorkingHours || defaultWorkingHours())
      );

      // Dayjs default timezone
      if (data.timezone) dayjs.tz.setDefault(data.timezone);

      // Custom events
      window.dispatchEvent(
        new CustomEvent("settings:timezoneChanged", {
          detail: { timeZone: data.timezone },
        })
      );
      window.dispatchEvent(
        new CustomEvent("settings:workingHoursChanged", {
          detail: {
            clinicWorkingHours: data.clinicWorkingHours,
            groomingWorkingHours: data.groomingWorkingHours,
          },
        })
      );

      alert("✅ Αποθηκεύτηκαν οι ρυθμίσεις!");
    } catch (err) {
      console.error("❌ Error saving settings", err);
      alert("❌ Παρουσιάστηκε σφάλμα κατά την αποθήκευση.");
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-2xl shadow">
      {/* Κεφαλίδα */}
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold">Γενικές Ρυθμίσεις</h3>
      </div>

      {/* Όνομα κτηνιατρείου */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Όνομα Κτηνιατρείου
        </label>
        <input
          type="text"
          value={localSettings.clinicName}
          onChange={(e) => handleChange("clinicName", e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500"
          placeholder="Άγιος Στέφανος"
        />
      </div>

      {/* Γλώσσα */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Γλώσσα
        </label>
        <select
          value={localSettings.language}
          onChange={(e) => handleChange("language", e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="el">Ελληνικά</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* Ζώνη Ώρας */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Ζώνη Ώρας
        </label>
        <select
          value={localSettings.timezone}
          onChange={(e) => handleChange("timezone", e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500"
        >
          {timeZones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      {/* Προσωπικό */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-indigo-700">Προσωπικό</span>
            {(localSettings.staff || []).length > 0 && (
              <span className="text-xs font-semibold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                {localSettings.staff.length}
              </span>
            )}
          </div>
        </div>

        {/* Λίστα μελών */}
        {(localSettings.staff || []).length > 0 ? (
          <div className="divide-y divide-gray-100">
            {localSettings.staff.map((member, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors group">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-sm font-bold text-white">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Όνομα */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{member.name}</p>
                </div>
                {/* Role badge */}
                <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${ROLE_STYLE[member.role] || "bg-gray-100 text-gray-600"}`}>
                  {member.role}
                </span>
                {/* Delete */}
                <button
                  type="button"
                  onClick={() => removeStaff(i)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Δεν έχει καταχωρηθεί προσωπικό ακόμα.</p>
          </div>
        )}

        {/* Φόρμα προσθήκης */}
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStaff()}
              placeholder="Όνομα μέλους..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addStaff}
              disabled={!newName.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Προσθήκη
            </button>
          </div>
        </div>
      </div>

      {/* Ωράριο Ιατρείου */}
      <WorkingHoursSection
        title="Ωράριο Ιατρείου"
        workingHours={localSettings.clinicWorkingHours}
        updateDay={updateClinicDay}
      />

      {/* Ωράριο Grooming */}
      <WorkingHoursSection
        title="Ωράριο Grooming"
        workingHours={localSettings.groomingWorkingHours}
        updateDay={updateGroomingDay}
      />

      {/* Αποθήκευση */}
      <div className="flex justify-end">
        <Button onClick={handleSave} variant="primary">
          Αποθήκευση
        </Button>
      </div>
    </div>
  );
};

export default GeneralSettings;
