// src/utils/dayjsConfig.js
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/el";

// enable plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// set Greek locale globally
dayjs.locale("el");

// helper: παίρνουμε την επιλεγμένη ζώνη ή default
export const getSavedTimeZone = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("timeZone") || "Europe/Athens";
  }
  return "Europe/Athens";
};

// optional: ορίζουμε default timezone στο dayjs (δεν είναι υποχρεωτικό)
dayjs.tz.setDefault(getSavedTimeZone());

export default dayjs;
