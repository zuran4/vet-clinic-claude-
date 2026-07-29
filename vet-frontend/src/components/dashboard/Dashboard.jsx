import React, { useMemo } from "react";
import {
  Package, Users, Pill, ShoppingCart, PawPrint, ChevronRight, LayoutGrid,
} from "lucide-react";

import RegistryMicrochipSearchBlock from "../registry/RegistryMicrochipSearchBlock.jsx";
import TodayTimeline from "./TodayTimeline.jsx";

const Dashboard = ({
  appointments = [],
  pets = [],
  products = [],
  customersCount = 0,
  onNewAppointment,
  onEditAppointment,
  onDeleteAppointment,
  onJumpToDate,
  onShowProducts,
  onShowCustomers,
  onShowPets,
  onShowPrescriptions,
  onShowExportPanel,
}) => {
  const quickActions = useMemo(
    () => [
      {
        key: "products",
        title: "Αποθήκη",
        description: `Προϊόντα: ${products.length}`,
        icon: Package,
        onClick: onShowProducts,
        iconBg: "bg-orange-100 dark:bg-orange-900/40",
        iconColor: "text-orange-500 dark:text-orange-400",
        accent: "group-hover:border-orange-200 dark:group-hover:border-orange-700/50",
        ring: "group-hover:bg-orange-50 dark:group-hover:bg-orange-900/10",
      },
      {
        key: "customers",
        title: "Πελάτες",
        description: `Πελάτες: ${customersCount}`,
        icon: Users,
        onClick: onShowCustomers,
        iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
        iconColor: "text-indigo-500 dark:text-indigo-400",
        accent: "group-hover:border-indigo-200 dark:group-hover:border-indigo-700/50",
        ring: "group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/10",
      },
      {
        key: "pets",
        title: "Κατοικίδια",
        description: `Καταχωρήσεις: ${pets.length}`,
        icon: PawPrint,
        onClick: onShowPets,
        iconBg: "bg-sky-100 dark:bg-sky-900/40",
        iconColor: "text-sky-500 dark:text-sky-400",
        accent: "group-hover:border-sky-200 dark:group-hover:border-sky-700/50",
        ring: "group-hover:bg-sky-50 dark:group-hover:bg-sky-900/10",
      },
      {
        key: "prescriptions",
        title: "Συνταγές",
        description: "Έκδοση και ιστορικό συνταγών",
        icon: Pill,
        onClick: onShowPrescriptions,
        iconBg: "bg-violet-100 dark:bg-violet-900/40",
        iconColor: "text-violet-500 dark:text-violet-400",
        accent: "group-hover:border-violet-200 dark:group-hover:border-violet-700/50",
        ring: "group-hover:bg-violet-50 dark:group-hover:bg-violet-900/10",
      },
      {
        key: "export",
        title: "Πωλήσεις",
        description: "Καταχώρηση πωλήσεων",
        icon: ShoppingCart,
        onClick: onShowExportPanel,
        iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
        iconColor: "text-emerald-500 dark:text-emerald-400",
        accent: "group-hover:border-emerald-200 dark:group-hover:border-emerald-700/50",
        ring: "group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/10",
      },
    ],
    [onShowProducts, onShowCustomers, onShowPets, onShowPrescriptions, onShowExportPanel, products.length, pets.length, customersCount]
  );

  return (
    <div className="space-y-6">
      {/* Today's Timeline */}
      <TodayTimeline
        appointments={appointments}
        onNewAppointment={onNewAppointment}
        onEditAppointment={onEditAppointment}
        onDeleteAppointment={onDeleteAppointment}
        onJumpToDate={onJumpToDate}
      />

      {/* Quick Actions — desktop only */}
      <section className="hidden sm:block">
        <div className="bg-white dark:bg-win-bg/30 border border-gray-200 dark:border-win-border rounded-2xl shadow-sm overflow-hidden">

          {/* Section Header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-800 dark:to-slate-700 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <LayoutGrid className="w-4.5 h-4.5 text-white" style={{ width: "18px", height: "18px" }} />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Γρήγορες Ενέργειες</p>
                <p className="text-white/50 text-xs mt-0.5">Άμεση πρόσβαση στις κύριες λειτουργίες</p>
              </div>
            </div>
            <span className="text-xs text-white/40 font-medium">{quickActions.length} ενότητες</span>
          </div>

          {/* Cards Grid */}
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={a.onClick}
                  className={[
                    "group w-full text-left rounded-2xl border border-gray-100 dark:border-win-border p-4 shadow-sm transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-300",
                    a.accent, a.ring,
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${a.iconBg}`}>
                        <Icon className={`w-5 h-5 ${a.iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{a.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{a.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-200 dark:text-gray-700 group-hover:text-gray-400 dark:group-hover:text-gray-500 flex-shrink-0 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Registry section */}
      <section className="pt-2">
        <RegistryMicrochipSearchBlock />
      </section>
    </div>
  );
};

export default Dashboard;
