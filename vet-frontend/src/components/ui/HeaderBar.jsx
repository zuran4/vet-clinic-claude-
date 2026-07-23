import React, { useEffect, useRef, useState } from "react";
import { LogOut, Settings, Menu, Package, Users, PawPrint, Pill, ShoppingCart, ChevronRight } from "lucide-react";
import logoFallback from "../../assets/logo.svg";
import { Button } from "./button";
import dayjs, { getSavedTimeZone } from "../../utils/dayjsConfig";
import "dayjs/locale/el";
import { useTranslation } from "react-i18next";

function HeaderBar({
  onLogout,
  onShowSettings,
  onGoHome,
  user,
  clinicName,
  logo,
  onShowProducts,
  onShowCustomers,
  onShowPets,
  onShowPrescriptions,
  onShowExportPanel,
}) {
  const { t } = useTranslation();
  const [timeZone, setTimeZone] = useState(getSavedTimeZone());
  const [now, setNow] = useState(dayjs().tz(timeZone));
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleTzChange = (e) => {
      const tz = e.detail?.timeZone || getSavedTimeZone();
      dayjs.tz.setDefault(tz);
      setTimeZone(tz);
    };
    window.addEventListener("settings:timezoneChanged", handleTzChange);
    return () => window.removeEventListener("settings:timezoneChanged", handleTzChange);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs().tz(timeZone)), 1000);
    return () => clearInterval(timer);
  }, [timeZone]);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const menuItems = [
    { key: "products",      label: "Αποθήκη",    icon: Package,  onClick: onShowProducts,     iconBg: "bg-orange-100 dark:bg-orange-900/40",    iconColor: "text-orange-500 dark:text-orange-400" },
    { key: "customers",     label: "Πελάτες",    icon: Users,    onClick: onShowCustomers,    iconBg: "bg-indigo-100 dark:bg-indigo-900/40",    iconColor: "text-indigo-500 dark:text-indigo-400" },
    { key: "pets",          label: "Κατοικίδια", icon: PawPrint, onClick: onShowPets,         iconBg: "bg-sky-100 dark:bg-sky-900/40",          iconColor: "text-sky-500 dark:text-sky-400" },
    { key: "prescriptions", label: "Συνταγές",   icon: Pill,     onClick: onShowPrescriptions,iconBg: "bg-violet-100 dark:bg-violet-900/40",    iconColor: "text-violet-500 dark:text-violet-400" },
    { key: "export",        label: "Πωλήσεις",   icon: ShoppingCart, onClick: onShowExportPanel, iconBg: "bg-emerald-100 dark:bg-emerald-900/40",  iconColor: "text-emerald-500 dark:text-emerald-400" },
  ];

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-white to-violet-50 dark:from-win-bg dark:via-win-bg dark:to-win-bg border-b border-indigo-100 dark:border-win-border shadow-sm mb-6">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4">

        {/* Αριστερά: Logo + Όνομα */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 sm:gap-3 hover:opacity-75 transition-opacity bg-transparent border-0 p-0 cursor-pointer min-w-0"
        >
          <img
            src={logo || logoFallback}
            alt={clinicName || "Κτηνιατρείο"}
            className="w-9 h-9 object-contain rounded-xl flex-shrink-0"
          />
          <span className="text-lg sm:text-xl font-bold text-indigo-600 tracking-tight truncate">
            {clinicName || "Vet Clinic"}
          </span>
        </button>

        {/* Κέντρο: Ημερομηνία & Ώρα */}
        <div className="text-center flex-1 hidden sm:block">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {now.locale("el").format("dddd D MMMM YYYY")}
          </p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-wide leading-tight">
            {now.format("HH:mm:ss")}
            <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">({timeZone})</span>
          </p>
        </div>

        {/* Δεξιά: User + Κουμπιά + Registry status (στοιχισμένο τέρμα δεξιά) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {user && (
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:block">
              {user.name}
            </span>
          )}

          <Button
            onClick={onShowSettings}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">{t("settings")}</span>
          </Button>

          <Button
            onClick={onLogout}
            variant="danger"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t("logout")}</span>
          </Button>

          {/* Μενού γρήγορων ενεργειών — μόνο σε mobile, στο desktop υπάρχουν στο dashboard */}
          <div className="relative sm:hidden" ref={menuRef}>
            <Button
              onClick={() => setShowMenu((v) => !v)}
              variant="ghost"
              className="px-2"
              title="Γρήγορες ενέργειες"
            >
              <Menu className="w-4 h-4" />
            </Button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-win-surface border border-gray-100 dark:border-win-border rounded-2xl shadow-xl z-50 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 flex items-center gap-2.5">
                  <img src={logo || logoFallback} alt="" className="w-7 h-7 rounded-lg object-contain bg-white/20 p-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{clinicName || "Vet Clinic"}</p>
                    <p className="text-white/60 text-xs">Πλοήγηση</p>
                  </div>
                </div>
                {/* Items */}
                <div className="py-2">
                  {menuItems.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => { setShowMenu(false); item.onClick?.(); }}
                        className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-win-elevated active:bg-gray-100 dark:active:bg-win-elevated2 transition-colors"
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                          <Icon className={`w-4.5 h-4.5 ${item.iconColor}`} style={{width:"18px",height:"18px"}} />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex-1">{item.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
                {/* Footer: logout */}
                <div className="border-t border-gray-100 dark:border-win-border px-3 py-2">
                  <button
                    type="button"
                    onClick={() => { setShowMenu(false); onLogout?.(); }}
                    className="w-full text-left px-3 py-2.5 flex items-center gap-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                      <LogOut className="w-4.5 h-4.5 text-red-500 dark:text-red-400" style={{width:"18px",height:"18px"}} />
                    </div>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400 flex-1">Αποσύνδεση</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default HeaderBar;
