import React, { useCallback, useEffect, useRef, useState } from "react";
import Keyboard from "react-simple-keyboard";
import SimpleKeyboardLayouts from "simple-keyboard-layouts";
import "react-simple-keyboard/build/css/index.css";
import { X } from "lucide-react";

export const KIOSK_KEYBOARD_STORAGE_KEY = "kioskKeyboardEnabled";
export const KIOSK_KEYBOARD_TOGGLE_EVENT = "kioskKeyboard:toggled";
const LANG_STORAGE_KEY = "kioskKeyboardLang";

// Πλήκτρο εναλλαγής γλώσσας μέσα στη γραμμή του space (αντί για ξεχωριστό
// κουμπί στο header) — {globe} δεν γράφεται ποτέ ως χαρακτήρας, το πιάνει
// το onKeyPress. Η τελευταία γραμμή γίνεται ".com {globe} {space} @".
function withGlobeKey(layout) {
  const patchRow = (row) => row.replace(".com @ {space}", ".com {globe} {space} @");
  return {
    default: layout.default.map((row, i, arr) => (i === arr.length - 1 ? patchRow(row) : row)),
    shift: layout.shift.map((row, i, arr) => (i === arr.length - 1 ? patchRow(row) : row)),
  };
}

const kbLayouts = new SimpleKeyboardLayouts();
const GREEK_LAYOUT = withGlobeKey(kbLayouts.get("greek").layout);
const ENGLISH_LAYOUT = withGlobeKey(kbLayouts.get("english").layout);

const NUMERIC_LAYOUT = {
  default: ["1 2 3", "4 5 6", "7 8 9", "{bksp} 0 {enter}"],
};
const NUMERIC_DISPLAY = { "{bksp}": "⌫", "{enter}": "OK" };
const TEXT_DISPLAY = { "{bksp}": "⌫", "{enter}": "⏎" };

const BUTTON_THEME = [
  { class: "kiosk-key-fn", buttons: "{shift} {lock} {tab} {globe} {bksp}" },
  { class: "kiosk-key-icon", buttons: "{bksp} {enter}" },
  { class: "kiosk-key-primary", buttons: "{enter}" },
];

const TYPEABLE_INPUT_TYPES = ["text", "search", "email", "tel", "url", "password", "number"];

function isTypeableField(el) {
  if (!el) return false;
  if (el.tagName === "TEXTAREA") return !el.readOnly && !el.disabled;
  if (el.tagName !== "INPUT") return false;
  const type = (el.type || "text").toLowerCase();
  return TYPEABLE_INPUT_TYPES.includes(type) && !el.readOnly && !el.disabled;
}

function isNumericField(el) {
  return el.inputMode === "numeric" || el.inputMode === "decimal" || el.type === "number";
}

function setNativeValue(el, value) {
  const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

// Βρίσκει τον κοντινότερο scrollable πρόγονο (π.χ. modal με overflow-y-auto)
// αντί να υποθέτει ότι πάντα scrollάρει η σελίδα ολόκληρη.
function getScrollParent(node) {
  if (!node || node === document.body || node === document.documentElement) {
    return document.scrollingElement || document.documentElement;
  }
  const { overflowY } = window.getComputedStyle(node);
  if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
    return node;
  }
  return getScrollParent(node.parentElement);
}

// Το fixed πληκτρολόγιο σκεπάζει το κάτω μισό της οθόνης — αν το εστιασμένο
// πεδίο πέφτει από κάτω του, το ανεβάζουμε πάνω από αυτό (και σε modals).
function scrollFieldAboveKeyboard(field, keyboardEl) {
  if (!field || !keyboardEl) return;
  requestAnimationFrame(() => {
    const kbTop = keyboardEl.getBoundingClientRect().top;
    const fieldRect = field.getBoundingClientRect();
    const overlap = fieldRect.bottom - kbTop + 16;
    if (overlap <= 0) return;
    const scrollParent = getScrollParent(field.parentElement);
    scrollParent.scrollBy({ top: overlap, behavior: "smooth" });
  });
}

// Global, in-app on-screen keyboard — δουλεύει πάντα (ανεξάρτητα OS), ενεργό
// μόνο όταν το device-level setting "Οθόνη Αφής" είναι ενεργό (Ρυθμίσεις).
export default function OnScreenKeyboard() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(KIOSK_KEYBOARD_STORAGE_KEY) === "true");
  const [visible, setVisible] = useState(false);
  const [numeric, setNumeric] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_STORAGE_KEY) || "el");
  const [layoutName, setLayoutName] = useState("default");

  const activeElRef = useRef(null);
  const wrapperRef = useRef(null);
  const keyboardRef = useRef(null);

  useEffect(() => {
    const onToggle = () => setEnabled(localStorage.getItem(KIOSK_KEYBOARD_STORAGE_KEY) === "true");
    window.addEventListener(KIOSK_KEYBOARD_TOGGLE_EVENT, onToggle);
    return () => window.removeEventListener(KIOSK_KEYBOARD_TOGGLE_EVENT, onToggle);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }

    const onFocusIn = (e) => {
      if (wrapperRef.current?.contains(e.target)) return;
      if (!isTypeableField(e.target)) return;
      activeElRef.current = e.target;
      setNumeric(isNumericField(e.target));
      setLayoutName("default");
      setVisible(true);
    };

    const onFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (wrapperRef.current?.contains(active)) return;
        if (isTypeableField(active)) return;
        setVisible(false);
        activeElRef.current = null;
      }, 120);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [enabled]);

  // Συγχρονισμός της υπάρχουσας τιμής του πεδίου με το εσωτερικό state
  // του keyboard μόλις αυτό γίνει mount (μετά το πρώτο focus).
  useEffect(() => {
    if (visible && keyboardRef.current && activeElRef.current) {
      keyboardRef.current.setInput(activeElRef.current.value || "");
    }
    if (visible && activeElRef.current && wrapperRef.current) {
      scrollFieldAboveKeyboard(activeElRef.current, wrapperRef.current);
    }
  }, [visible, numeric]);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === "el" ? "en" : "el";
      localStorage.setItem(LANG_STORAGE_KEY, next);
      return next;
    });
    setLayoutName("default");
  }, []);

  const handleKeyPress = useCallback((button) => {
    if (button === "{shift}" || button === "{lock}") {
      setLayoutName((prev) => (prev === "default" ? "shift" : "default"));
      return;
    }
    if (button === "{globe}") {
      toggleLang();
      return;
    }
    if (button === "{enter}") {
      const el = activeElRef.current;
      if (el) {
        // Πραγματικό Enter keydown/keyup — ώστε onKeyDown handlers (π.χ.
        // "Enter για προσθήκη") να ενεργοποιούνται όπως με φυσικό πληκτρολόγιο.
        const keyInit = { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true };
        el.dispatchEvent(new KeyboardEvent("keydown", keyInit));
        el.dispatchEvent(new KeyboardEvent("keyup", keyInit));
        // Και πραγματικό submit της φόρμας (πχ. login/PIN) — ένα dispatched
        // keydown δεν προκαλεί ποτέ implicit form submission από μόνο του.
        const form = el.closest("form");
        if (form && typeof form.requestSubmit === "function") form.requestSubmit();
      }
      activeElRef.current?.blur();
      setVisible(false);
    }
  }, [toggleLang]);

  const handleChange = useCallback((input) => {
    if (activeElRef.current) setNativeValue(activeElRef.current, input);
  }, []);

  const handleClose = () => {
    activeElRef.current?.blur();
    setVisible(false);
  };

  if (!enabled || !visible) return null;

  const layoutObj = numeric ? NUMERIC_LAYOUT : (lang === "el" ? GREEK_LAYOUT : ENGLISH_LAYOUT);
  const display = numeric ? NUMERIC_DISPLAY : { ...TEXT_DISPLAY, "{globe}": `🌐 ${lang === "el" ? "ΕΛ" : "EN"}` };

  return (
    <div
      ref={wrapperRef}
      onMouseDown={(e) => e.preventDefault()}
      className={`fixed bottom-0 left-1/2 -translate-x-1/2 z-[9999] w-full ${numeric ? "max-w-[340px]" : "max-w-[900px]"} bg-white dark:bg-win-surface border border-gray-200 dark:border-win-border rounded-t-2xl shadow-2xl overflow-hidden`}
    >
      <div className="flex items-center justify-end px-3 py-1.5 bg-gray-50 dark:bg-win-elevated border-b border-gray-100 dark:border-win-border">
        <button
          type="button"
          onClick={handleClose}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-win-elevated2 transition-colors"
          aria-label="Κλείσιμο πληκτρολογίου"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <Keyboard
        keyboardRef={(r) => (keyboardRef.current = r)}
        layoutName={layoutName}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        layout={layoutObj}
        display={display}
        buttonTheme={BUTTON_THEME}
        theme={`hg-theme-default kiosk-keyboard${numeric ? " kiosk-keyboard-numeric" : ""}`}
        preventMouseDownDefault
      />
    </div>
  );
}
