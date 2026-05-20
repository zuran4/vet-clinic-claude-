import React, { useMemo } from "react";
import {
  Package,
  Users,
  Pill,
  Upload,
  PawPrint,
  ChevronRight,
} from "lucide-react";

import RegistryMicrochipSearchBlock from "../registry/RegistryMicrochipSearchBlock.jsx";
import TodayTimeline from "./TodayTimeline.jsx";

const Dashboard = ({
  appointments = [],
  pets = [],
  products = [],
  onShowAppointments,
  onShowProducts,
  onShowCustomers,
  onShowPets,
  onShowPrescriptions,
  onShowExportPanel,
  onEditProduct,
}) => {

  // ✅ Enterprise-friendly: "quick actions" config
  const quickActions = useMemo(
    () => [
      {
        key: "products",
        title: "Αποθήκη",
        description: `Προϊόντα: ${products.length}`,
        icon: Package,
        onClick: onShowProducts,
      },
      {
        key: "customers",
        title: "Πελάτες",
        description: "Διαχείριση πελατών και ιστορικού",
        icon: Users,
        onClick: onShowCustomers,
      },
      {
        key: "pets",
        title: "Κατοικίδια",
        description: `Καταχωρήσεις: ${pets.length}`,
        icon: PawPrint,
        onClick: onShowPets,
      },
      {
        key: "prescriptions",
        title: "Συνταγές",
        description: "Έκδοση και ιστορικό συνταγών",
        icon: Pill,
        onClick: onShowPrescriptions,
      },
      {
        key: "export",
        title: "Εξαγωγή",
        description: "Εισαγωγή/ενημέρωση προϊόντων",
        icon: Upload,
        onClick: onShowExportPanel,
      },
    ],
    [
      onShowProducts,
      onShowCustomers,
      onShowPets,
      onShowPrescriptions,
      onShowExportPanel,
      products.length,
      pets.length,
    ]
  );

  return (
    <div className="space-y-6">
      {/* Today's Timeline */}
      <TodayTimeline
        appointments={appointments}
        onShowAppointments={onShowAppointments}
      />

      {/* Quick Actions */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Γρήγορες ενέργειες
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.key}
                type="button"
                onClick={a.onClick}
                className={[
                  "group w-full text-left rounded-2xl border bg-white p-4 shadow-sm transition",
                  "border-gray-200 hover:border-gray-300 hover:shadow-md",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-300",
                  "dark:bg-gray-900/30 dark:border-gray-700 dark:hover:border-gray-600 dark:focus:ring-indigo-500/40",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {a.title}
                        </div>
                      </div>

                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-300 truncate">
                        {a.description}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 dark:text-gray-600 dark:group-hover:text-gray-500" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Registry section */}
      <section className="pt-2">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Μητρώο κατοικιδίων
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300">
                Αναζήτηση microchip και εμφάνιση στοιχείων από το εθνικό μητρώο.
              </div>
            </div>
          </div>
        </div>

        <RegistryMicrochipSearchBlock />
      </section>
    </div>
  );
};

export default Dashboard;
