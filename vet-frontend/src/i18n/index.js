import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import el from "./locales/el.json";
import en from "./locales/en.json";

i18n.use(initReactI18next).init({
  resources: {
    el: { translation: el },
    en: { translation: en }
  },
  lng: "el",          // προεπιλεγμένη γλώσσα
  fallbackLng: "en",  // αν λείπει μετάφραση
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
