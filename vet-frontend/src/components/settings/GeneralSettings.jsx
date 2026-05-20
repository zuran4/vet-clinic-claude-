import React, { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
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

const GeneralSettings = ({ settings, setSettings }) => {
  const [localSettings, setLocalSettings] = useState(() => ({
    clinicName: "",
    logo: "",
    language: "el",
    timezone: "Europe/Athens",
    clinicWorkingHours: defaultWorkingHours(),
    groomingWorkingHours: defaultWorkingHours(),
    ...(settings || {}),
  }));

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
