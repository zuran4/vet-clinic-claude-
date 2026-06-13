import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/el";
import "./index.css";

import LoginForm from "./components/ui/LoginForm";
import InstallPwaBanner from "./components/ui/InstallPwaBanner";
import MainLayout from "./layout/MainLayout";

import { useAuth } from "./hooks/useAuth";
import { useAppointmentsData } from "./hooks/useAppointmentsData";
import { useProductsData } from "./hooks/useProductsData";
import { useRefetchOnFocus } from "./hooks/useRefetchOnFocus";
import { useRealtimeSync } from "./hooks/useRealtimeSync";

dayjs.locale("el");

function App() {
  const { user, authLoading, login, logout, getAuthHeaders } = useAuth();
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState("Ιατρείο");
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    appointments,
    fetchAppointments,
    saveAppointment,
    deleteAppointment,
  } = useAppointmentsData(setErrorMessage);

  const { products, fetchProducts } = useProductsData();

  useEffect(() => {
    if (user) {
      fetchAppointments();
      fetchProducts();
    }
  }, [user, selectedDate, fetchAppointments, fetchProducts]);

  // 🔹 Ξανά-φόρτωση ραντεβού/προϊόντων όταν η εφαρμογή επανέρχεται σε προσκήνιο
  useRefetchOnFocus(() => {
    if (user) {
      fetchAppointments();
      fetchProducts();
    }
  });

  // 🔹 Real-time ενημέρωση όταν αλλάζουν δεδομένα από άλλη συσκευή
  useRealtimeSync({
    appointments: () => user && fetchAppointments(),
    products: () => user && fetchProducts(),
  });

  const handleSaveAppointment = async (details, appointmentId = null) => {
    // Το date, time και doctor έρχονται από τη φόρμα μέσα στο details
    // Διατηρούμε selectedDoctor/selectedTime ως fallback μόνο
    const newAppt = {
      doctor: selectedDoctor,
      time: selectedTime,
      ...details, // details.date, details.time, details.doctor από τη φόρμα
    };
    await saveAppointment(newAppt, appointmentId);
    setSelectedTime(null);
    setEditingAppointment(null);
  };

  const handleEditAppointment = (appt) => {
    setSelectedTime(appt.time);
    setSelectedDoctor(appt.doctor || "Ιατρείο");
    setEditingAppointment(appt);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-win-bg flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400 text-lg">Φόρτωση...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-win-bg flex items-center justify-center p-4">
        <LoginForm onLogin={login} />
        <InstallPwaBanner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-win-bg p-2 sm:p-6 safe-top safe-bottom">
      <InstallPwaBanner />
      <MainLayout
        user={user}
        onLogout={logout}
        appointments={appointments}
        products={products}
        onSaveAppointment={handleSaveAppointment}
        onDeleteAppointment={deleteAppointment}
        onEditAppointment={handleEditAppointment}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedTime={selectedTime}
        setSelectedTime={setSelectedTime}
        selectedDoctor={selectedDoctor}
        setSelectedDoctor={setSelectedDoctor}
        editingAppointment={editingAppointment}
        setEditingAppointment={setEditingAppointment}
        errorMessage={errorMessage}
      />
    </div>
  );
}

export default App;
