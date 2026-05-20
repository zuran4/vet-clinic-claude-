// src/hooks/useSettingsPage.jsx
import { useState, useEffect } from "react";
import settingsApi from "../api/settingsApi";

/**
 * 🧩 useSettingsPage
 * Ενώνει όλη τη λογική της SettingsPage: φόρτωση, αποθήκευση, upload logo
 */
export function useSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Ανάκτηση ρυθμίσεων
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getSettings();
      setSettings(data);
    } catch (err) {
      console.error("❌ Σφάλμα φόρτωσης ρυθμίσεων:", err);
      setError("Αποτυχία φόρτωσης ρυθμίσεων.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Ενημέρωση ρυθμίσεων
  const updateSettings = async (updatedData) => {
    try {
      setLoading(true);
      const data = await settingsApi.updateSettings(updatedData);
      setSettings(data);
      return data;
    } catch (err) {
      console.error("❌ Σφάλμα ενημέρωσης:", err);
      setError("Αποτυχία ενημέρωσης ρυθμίσεων.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Upload λογότυπου
  const uploadLogo = async (file) => {
    try {
      setLoading(true);
      const res = await settingsApi.uploadLogo(file);
      const updated = { ...settings, logo: res.url };
      setSettings(updated);
      await updateSettings(updated);
      return res.url;
    } catch (err) {
      console.error("❌ Σφάλμα upload logo:", err);
      setError("Αποτυχία ανεβάσματος λογότυπου.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    setSettings,
    fetchSettings,
    updateSettings,
    uploadLogo,
    loading,
    error,
  };
}
