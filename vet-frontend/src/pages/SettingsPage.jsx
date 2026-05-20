// src/pages/SettingsPage.jsx
import React, { useState } from "react";
import { Settings, Bell, Monitor, Image, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import GeneralSettings from "../components/settings/GeneralSettings";
import LogoUpload from "../components/ui/LogoUpload";
import DarkModeToggle from "../components/settings/DarkModeToggle";
import { useSettingsPage } from "../hooks/useSettingsPage"; // ✅ νέο import
import StockThresholdsPanel from "../components/settings/StockThresholdsPanel.jsx";

const SettingsPage = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("general");
  const {
    settings,
    setSettings,
    updateSettings,
    uploadLogo,
    loading,
    error,
  } = useSettingsPage();

  // 🔹 Κατάσταση για αλλαγή λειτουργίας worker (headless/visible)
  const [registryWorkerChanging, setRegistryWorkerChanging] = useState(false);
  const [registryWorkerError, setRegistryWorkerError] = useState(null);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Φόρτωση ρυθμίσεων...
      </div>
    );
  }
  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }
  if (!settings) return null;

    // ✅ Βοηθητικό: τρέχουσα τιμή headless από τα settings (default false)
  const headlessEnabled = Boolean(settings.registryWorkerHeadless);

  // ✅ Αλλαγή headless:
  // 1) σώζουμε settings
  // 2) σταματάμε τον worker
  // 3) τον ξαναξεκινάμε με τη νέα ρύθμιση
  const handleToggleHeadless = async () => {
    // αν ήδη τρέχει διαδικασία αλλαγής, αγνοούμε το click
    if (registryWorkerChanging) return;

    const newValue = !headlessEnabled;
    const updatedSettings = {
      ...settings,
      registryWorkerHeadless: newValue,
    };

    setRegistryWorkerError(null);
    setRegistryWorkerChanging(true);

    try {
      // 1️⃣ Αποθήκευση ρύθμισης (backend settings)
      await updateSettings(updatedSettings);
      // ενημερώνουμε και το τοπικό state ΜΟΝΟ αφού πετύχει
      setSettings(updatedSettings);

      // 2️⃣ Σταμάτημα υπάρχοντος worker (αν τρέχει)
      const stopRes = await fetch("/api/registry/worker/stop", {
        method: "POST",
      });

      if (!stopRes.ok) {
        throw new Error("Αποτυχία τερματισμού του registry worker.");
      }

      // 3️⃣ Εκκίνηση worker με τη νέα ρύθμιση headless
      const startRes = await fetch("/api/registry/worker/start", {
        method: "POST",
      });

      if (!startRes.ok) {
        throw new Error("Αποτυχία εκκίνησης του registry worker.");
      }

      // εδώ όλα καλά, δεν χρειάζεται κάτι άλλο
    } catch (err) {
      console.error("Registry worker headless toggle error:", err);
      setRegistryWorkerError(
        err?.message ||
          "Κάτι πήγε στραβά κατά την αλλαγή λειτουργίας του registry worker."
      );
      // προαιρετικά: θα μπορούσαμε να κάνουμε reload ρυθμίσεις από το API
      // προς το παρόν αφήνουμε το state ως έχει
    } finally {
      setRegistryWorkerChanging(false);
    }
  };


  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
          <Settings className="w-6 h-6 text-primary" />
          Ρυθμίσεις
        </h1>
        <Button variant="secondary" onClick={onClose}>
          Κλείσιμο
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        <button
          onClick={() => setActiveTab("general")}
          className={`pb-2 border-b-2 transition ${
            activeTab === "general"
              ? "border-primary text-primary font-medium"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Γενικά
        </button>
        <button
          onClick={() => setActiveTab("ui")}
          className={`pb-2 border-b-2 transition ${
            activeTab === "ui"
              ? "border-primary text-primary font-medium"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          UI
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`pb-2 border-b-2 transition ${
            activeTab === "notifications"
              ? "border-primary text-primary font-medium"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Ειδοποιήσεις
        </button>
        {/* 🔹 Νέο tab: Admin */}
        <button
          onClick={() => setActiveTab("admin")}
          className={`pb-2 border-b-2 transition ${
            activeTab === "admin"
              ? "border-primary text-primary font-medium"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Admin
        </button>
      </div>

      {/* Περιεχόμενο */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        {/* ---------------- ΓΕΝΙΚΑ ---------------- */}
        {activeTab === "general" && (
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Settings className="w-5 h-5 text-primary" />
              Γενικές Ρυθμίσεις
            </h2>

            {/* Λογότυπο */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Image className="w-4 h-4 text-primary" />
                Λογότυπο
              </label>
              <LogoUpload
                value={settings.logo}
                onUploadFile={async (file) => {
                  const url = await uploadLogo(file);
                  const updated = { ...settings, logo: url };
                  setSettings(updated);
                  await updateSettings(updated);
                }}
              />
            </div>

            <GeneralSettings
              settings={settings}
              setSettings={setSettings}
              onSave={updateSettings}
            />
          </div>
        )}

        {/* ---------------- UI ---------------- */}
        {activeTab === "ui" && (
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Monitor className="w-5 h-5 text-primary" />
              Ρυθμίσεις Εμφάνισης (UI)
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Επέλεξε Dark/Light Mode (και στο μέλλον χρώματα &amp; layout).
            </p>

            <DarkModeToggle settings={settings} setSettings={setSettings} />

            {/* Stock thresholds panel */}
            <div className="mt-8">
              <h3 className="text-base font-semibold mb-3">
                Stock thresholds
              </h3>
              <StockThresholdsPanel
                // Προαιρετικά: πέρασε categories από settings ή από προϊόντα
                // categories={Array.from(new Set((settings?.knownCategories ?? []))).filter(Boolean)}
              />
            </div>
          </div>
        )}

        {/* ---------------- ΕΙΔΟΠΟΙΗΣΕΙΣ ---------------- */}
        {activeTab === "notifications" && (
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Bell className="w-5 h-5 text-primary" />
              Ειδοποιήσεις
            </h2>
            <p className="text-gray-600">
              Εδώ θα μπουν επιλογές για email alerts, reminders και push
              ειδοποιήσεις.
            </p>
          </div>
        )}

                {/* ---------------- ADMIN ---------------- */}
        {activeTab === "admin" && (
          <div className="space-y-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-2">
              <Shield className="w-5 h-5 text-primary" />
              Admin / Worker
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Ρυθμίσεις για τον Playwright registry worker. Το headless
              επηρεάζει αν ο browser θα φαίνεται ή θα τρέχει στο παρασκήνιο.
            </p>

            {/* Headless toggle */}
            <div className="space-y-2 max-w-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    Headless registry worker
                  </div>
                  <div className="text-xs text-gray-500">
                    Όταν είναι ενεργό, ο Chromium τρέχει χωρίς ορατό παράθυρο.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleHeadless}
                  disabled={registryWorkerChanging}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    headlessEnabled ? "bg-green-500" : "bg-gray-300"
                  } ${
                    registryWorkerChanging
                      ? "opacity-60 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      headlessEnabled ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {registryWorkerChanging && (
                <p className="text-xs text-gray-500">
                  Γίνεται επανεκκίνηση του registry worker με τη νέα ρύθμιση...
                </p>
              )}

              {registryWorkerError && (
                <p className="text-xs text-red-600">
                  {registryWorkerError}
                </p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsPage;
