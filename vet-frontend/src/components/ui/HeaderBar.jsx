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
    <div className="bg-gradient-to-r from-indigo-50 via-white to-violet-50 border-b border-indigo-100 shadow-sm mb-6">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">

        {/* Αριστερά: Logo + Όνομα */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-3 hover:opacity-75 transition-opacity bg-transparent border-0 p-0 cursor-pointer"
        >
          <img
            src={logo || logoFallback}
            alt={clinicName || "Κτηνιατρείο"}
            className="w-9 h-9 object-contain rounded-xl"
          />
          <span className="text-xl font-bold text-indigo-600 tracking-tight">
            {clinicName || "Vet Clinic"}
          </span>
        </button>

        {/* Κέντρο: Ημερομηνία & Ώρα */}
        <div className="text-center flex-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
            {now.locale("el").format("dddd D MMMM YYYY")}
          </p>
          <p className="text-2xl font-bold text-indigo-600 tracking-wide leading-tight">
            {now.format("HH:mm:ss")}
            <span className="ml-2 text-xs font-normal text-gray-400">({timeZone})</span>
          </p>
        </div>

        {/* Δεξιά: User + Κουμπιά */}
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm font-medium text-gray-600 hidden sm:block">
              {user.name}
            </span>
          )}

          <Button
            onClick={onShowSettings}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {t("settings")}
          </Button>

          <Button
            onClick={onLogout}
            variant="danger"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {t("logout")}
          </Button>
        </div>

      </div>
    </div>
  );
}

export default HeaderBar;
