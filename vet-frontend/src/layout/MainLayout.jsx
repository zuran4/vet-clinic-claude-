// src/layouts/MainLayout.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import dayjs from "dayjs";
import "dayjs/locale/el";
import { AlertTriangle } from "lucide-react";
import HeaderBar from "../components/ui/HeaderBar";
import Dashboard from "../components/dashboard/Dashboard";
import RegistryStatus from "../components/registry/RegistryStatus";

import AppointmentsPage from "../pages/AppointmentsPage";
import ProductsPage from "../pages/ProductsPage";
import CustomersPage from "../pages/CustomersPage";
import PrescriptionsPage from "../pages/PrescriptionsPage";
import ExportPage from "../pages/ExportPage";
import PetsPage from "../pages/PetsPage";
import SettingsPage from "../pages/SettingsPage";

// ✅ i18n
import i18n from "../i18n";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useRefetchOnFocus } from "../hooks/useRefetchOnFocus";
import { useRealtimeSync } from "../hooks/useRealtimeSync";

import request from "../api/apiClient.js";

dayjs.locale("el");

function MainLayout({
  user,
  onLogout,
  appointments,
  products,
  onSaveAppointment,
  onDeleteAppointment,
  onEditAppointment,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  selectedDoctor,
  setSelectedDoctor,
  editingAppointment,
  setEditingAppointment,
  errorMessage,
}) {
  // ✅ Single source of truth για navigation/panels
  // "dashboard" | "appointments" | "products" | "customers" | "pets" | "prescriptions" | "export" | "settings"
  const [activePanel, setActivePanel] = useState("dashboard");
  const [petsCount, setPetsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [appointmentsDoctorFilter, setAppointmentsDoctorFilter] = useState(null);

  // ✅ Settings state
  const [settings, setSettings] = useState(null);

  // 🔹 Κατάσταση μητρώου / worker
  const [registryStatus, setRegistryStatus] = useState("UNKNOWN");

  const openPanel = (panel) => setActivePanel(panel);
  const closePanel = () => {
    setActivePanel("dashboard");
    setAppointmentsDoctorFilter(null);
  };

  // 🔹 Όταν ανοίγουμε ραντεβού από το Dashboard, γυρνάμε πίσω μόλις κλείσει το modal.
  // modalWasOpenedRef: σηματοδοτεί ότι ο χρήστης άνοιξε τη φόρμα (έκανε κλικ σε slot),
  // ώστε να μην επιστρέψουμε στο dashboard πριν ανοίξει η φόρμα.
  const cameFromDashboardRef = useRef(false);
  const modalWasOpenedRef = useRef(false);

  useEffect(() => {
    if (cameFromDashboardRef.current && selectedTime) {
      modalWasOpenedRef.current = true;
    }
  }, [selectedTime]);

  useEffect(() => {
    if (
      cameFromDashboardRef.current &&
      modalWasOpenedRef.current &&
      activePanel === "appointments" &&
      !selectedTime &&
      !editingAppointment
    ) {
      cameFromDashboardRef.current = false;
      modalWasOpenedRef.current = false;
      setActivePanel("dashboard");
    }
  }, [activePanel, selectedTime, editingAppointment]);

  useKeyboardShortcuts({
    goHome:          () => openPanel("dashboard"),
    goAppointments:  () => { setAppointmentsDoctorFilter(null); openPanel("appointments"); },
    goCustomers:     () => openPanel("customers"),
    goProducts:      () => openPanel("products"),
    goPrescriptions: () => openPanel("prescriptions"),
    goPets:          () => openPanel("pets"),
    goSettings:      () => openPanel("settings"),
  });

  // 🔹 Scroll reset σε κάθε αλλαγή panel
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePanel]);

  // 🔹 Φόρτωση αριθμού κατοικιδίων για Dashboard
  const loadPetsCount = useCallback(() => {
    request("/pets/count")
      .then((data) => setPetsCount(data.total ?? 0))
      .catch(() => {});
  }, []);

  const loadCustomersCount = useCallback(() => {
    request("/customers?page=1&pageSize=1")
      .then((data) => setCustomersCount(data.total ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadPetsCount();
    loadCustomersCount();
  }, [loadPetsCount, loadCustomersCount]);

  // 🔹 Φόρτωση settings από backend
  const loadSettings = useCallback(async () => {
    try {
      const data = await request("/settings");
      setSettings(data);
    } catch (err) {
      console.error("⚠️ Error loading settings", err);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 🔹 Ξανά-φόρτωση settings/πλήθους κατοικιδίων όταν η εφαρμογή επανέρχεται σε προσκήνιο
  useRefetchOnFocus(() => {
    loadSettings();
    loadPetsCount();
    loadCustomersCount();
  });

  // 🔹 Real-time ενημέρωση όταν αλλάζουν δεδομένα από άλλη συσκευή
  useRealtimeSync({
    settings: loadSettings,
    pets: loadPetsCount,
    customers: loadCustomersCount,
  });

  // 🔹 Live αλλαγή γλώσσας όταν αλλάζουν τα settings
  useEffect(() => {
    if (settings?.language) {
      i18n.changeLanguage(settings.language);
      dayjs.locale(settings.language === "el" ? "el" : "en");
    }
  }, [settings?.language]);

  // 🔹 Dark mode toggle με βάση τα settings
  useEffect(() => {
    if (settings?.darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [settings?.darkMode]);

  // 🔹 Ενημέρωση όταν αλλάζει το status του μητρώου
  const handleRegistryStatusChange = (newStatus) => {
    setRegistryStatus(newStatus || "UNKNOWN");
  };

  // ✅ Προσθέτουμε expirationDate από τα batches (πιο κοντινή)
  const productsWithExpDate = useMemo(() => {
    return products.map((p) => {
      if ((!p.expirationDate || p.expirationDate === null) && p.batches?.length > 0) {
        const nearestBatch = p.batches.reduce((nearest, b) => {
          return !nearest || new Date(b.expirationDate) < new Date(nearest.expirationDate)
            ? b
            : nearest;
        }, null);
        return { ...p, expirationDate: nearestBatch?.expirationDate };
      }
      return p;
    });
  }, [products]);

  // ✅ Page title (enterprise: σταθερό header pattern)
  const pageInfo = useMemo(() => {
    switch (activePanel) {
      case "appointments":
        return { title: "Ραντεβού", subtitle: "Διαχείριση και προγραμματισμός ραντεβού." };
      case "products":
        return { title: "Αποθήκη", subtitle: "Διαχείριση προϊόντων και αποθέματος." };
      case "customers":
        return { title: "Πελάτες", subtitle: "Διαχείριση πελατών και ιστορικού επισκέψεων." };
      case "pets":
        return { title: "Κατοικίδια", subtitle: "Διαχείριση κατοικίδιων και ιατρικού ιστορικού." };
      case "prescriptions":
        return { title: "Συνταγές", subtitle: "Έκδοση και διαχείριση συνταγών." };
      case "export":
        return { title: "Πωλήσεις", subtitle: "Καταχώρηση πωλήσεων και ενημέρωση αποθέματος." };
      case "settings":
        return { title: "Ρυθμίσεις", subtitle: "Διαμόρφωση κλινικής και συστήματος." };
      default:
        return { title: "Επισκόπηση" };
    }
  }, [activePanel]);

  // ✅ Registry badge (severity)
  const registryBadge = useMemo(() => {
    const status = registryStatus || "UNKNOWN";

    // severity mapping
    let severity = "neutral";
    if (status === "LOGGED_IN") severity = "ok";
    else if (status === "NEEDS_LOGIN" || status === "SESSION_EXPIRED") severity = "warn";
    else if (status === "UNKNOWN") severity = "neutral";
    else severity = "info";

    const classesBySeverity = {
      ok: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/35 dark:text-emerald-200",
      warn: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/35 dark:text-amber-200",
      info: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/40 dark:bg-sky-950/35 dark:text-sky-200",
      neutral: "border-gray-200 bg-gray-50 text-gray-700 dark:border-win-border-light/50 dark:bg-win-surface/60 dark:text-gray-200",
    };

    const label =
      status === "LOGGED_IN"
        ? "Μητρώο: έτοιμο"
        : status === "NEEDS_LOGIN"
          ? "Μητρώο: απαιτεί σύνδεση"
          : status === "SESSION_EXPIRED"
            ? "Μητρώο: συνεδρία έληξε"
            : status === "NO_PAGE"
              ? "Μητρώο: δεν άνοιξε σελίδα"
              : status === "PRE_LOGIN"
                ? "Μητρώο: πριν τη σύνδεση"
                : "Μητρώο: άγνωστη κατάσταση";

    return {
      label,
      className: classesBySeverity[severity],
    };
  }, [registryStatus]);

  const isDashboard = activePanel === "dashboard";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-win-bg dark:text-gray-100">
      {/* 🔹 Header */}
      <HeaderBar
        onLogout={onLogout}
        onShowSettings={() => openPanel("settings")}
        onGoHome={() => setActivePanel("dashboard")}
        user={user}
        clinicName={settings?.clinicName}
        logo={settings?.logo}
        onShowProducts={() => openPanel("products")}
        onShowCustomers={() => openPanel("customers")}
        onShowPets={() => openPanel("pets")}
        onShowPrescriptions={() => openPanel("prescriptions")}
        onShowExportPanel={() => openPanel("export")}
      />

      {/* 🔹 Κύριο περιεχόμενο */}
      <main className="max-w-6xl mx-auto bg-white dark:bg-win-surface shadow-md rounded-xl p-3 sm:p-6 space-y-6 mt-6">
        {/* ✅ Page Header (σταθερό pattern) */}
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {pageInfo.title}
            </h1>
            {pageInfo.subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {pageInfo.subtitle}
              </p>
            )}
          </div>
          <RegistryStatus onStatusChange={handleRegistryStatusChange} />
        </header>

        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 p-3 rounded-2xl shadow focus:ring-2 focus:ring-red-300 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {errorMessage}
          </div>
        )}

        {/* 🔹 Dashboard */}
        {isDashboard && (
          <div className="space-y-6">
            <Dashboard
              appointments={appointments}
              pets={Array(petsCount).fill(null)}
              customersCount={customersCount}
              products={productsWithExpDate}
              onShowAppointments={(doctor) => {
                setAppointmentsDoctorFilter(doctor || null);
                openPanel("appointments");
              }}
              onNewAppointment={(doctor) => {
                cameFromDashboardRef.current = true;
                setAppointmentsDoctorFilter(doctor);
                setSelectedDoctor(doctor);
                setSelectedDate(dayjs().format("YYYY-MM-DD"));
                setEditingAppointment(null);
                openPanel("appointments");
              }}
              onEditAppointment={(appt) => {
                cameFromDashboardRef.current = true;
                setAppointmentsDoctorFilter(null);
                onEditAppointment(appt);
                openPanel("appointments");
              }}
              onDeleteAppointment={onDeleteAppointment}
              onJumpToDate={(date) => {
                setAppointmentsDoctorFilter(null);
                setSelectedDate(dayjs(date).format("YYYY-MM-DD"));
                openPanel("appointments");
              }}
              onShowProducts={() => openPanel("products")}
              onShowCustomers={() => openPanel("customers")}
              onShowPets={() => openPanel("pets")}
              onShowPrescriptions={() => openPanel("prescriptions")}
              onShowExportPanel={() => openPanel("export")}
              onEditProduct={(product) => {
                openPanel("products");
                setTimeout(() => {
                  const event = new CustomEvent("edit-product", { detail: product });
                  window.dispatchEvent(event);
                }, 0);
              }}
            />

          </div>
        )}

        {/* 🔹 Panels */}
        {activePanel === "export" && <ExportPage onClose={closePanel} />}
        {activePanel === "customers" && <CustomersPage onClose={closePanel} />}
        {activePanel === "pets" && <PetsPage onClose={closePanel} />}

        {activePanel === "appointments" && (
          <AppointmentsPage
            appointments={appointments}
            user={user}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            selectedDoctor={selectedDoctor}
            setSelectedDoctor={setSelectedDoctor}
            editingAppointment={editingAppointment}
            setEditingAppointment={setEditingAppointment}
            onSaveAppointment={onSaveAppointment}
            onDeleteAppointment={onDeleteAppointment}
            onEditAppointment={onEditAppointment}
            onClose={closePanel}
            doctorFilter={appointmentsDoctorFilter}
          />
        )}

        {activePanel === "products" && <ProductsPage onClose={closePanel} />}
        {activePanel === "prescriptions" && <PrescriptionsPage onClose={closePanel} />}

        {activePanel === "settings" && (
          <SettingsPage
            onClose={closePanel}
            settings={settings}
            setSettings={setSettings}
            user={user}
          />
        )}
      </main>
    </div>
  );
}

export default MainLayout;
