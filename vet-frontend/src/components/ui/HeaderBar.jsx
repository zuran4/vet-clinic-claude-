import React, { useEffect, useState } from "react";
import { LogOut, Settings } from "lucide-react";
import logoFallback from "../../assets/logo.svg";
import { Button } from "./button";
import dayjs, { getSavedTimeZone } from "../../utils/dayjsConfig";
import "dayjs/locale/el";
import { useTranslation } from "react-i18next";

function HeaderBar({ onLogout, onShowSettings, onGoHome, user, clinicName, logo }) {
  const { t } = useTranslation();
  const [timeZone, setTimeZone] = useState(getSavedTimeZone());
  const [now, setNow] = useState(dayjs().tz(timeZone));

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

        {/* Δεξιά: User + Κουμπιά */}
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
        </div>

      </div>
    </div>
  );
}

export default HeaderBar;
