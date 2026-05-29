import React, { useState } from "react";
import { RefreshCw, ChevronDown, ChevronRight, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { fetchMedicalEvents } from "../../api/registryApi.js";

const SECTION_LABELS = {
  timeline:        "Όλα τα Γεγονότα (Χρονολόγιο)",
  vaccinations:    "Εμβολιασμοί",
  antiparasitic:   "Αντιπαρασιτικές αγωγές",
  sterilization:   "Στείρωση",
  microchip:       "Σήμανση / Καταγραφή",
  acquisition:     "Απόκτηση",
  birth:           "Γέννηση",
  diagnostics:     "Διαγνωστικές εξετάσεις",
  diseases:        "Νοσήματα",
  hereditary:      "Κληρονομικές παθήσεις",
  genetic:         "Γενετικό Υλικό",
  clinical:        "Κλινική Εξέταση",
  treatments:      "Θεραπείες / Αγωγές",
  surgeries:       "Επεμβάσεις",
  hospitalization: "Νοσηλεία / Παρακολούθηση",
  passport:        "Διαβατήριο",
  ownership:       "Ιδιοκτησία / Μεταβίβαση",
  other:           "Άλλα",
};

const SectionTable = ({ rows }) => {
  if (!rows || rows.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic py-2 px-1">Δεν βρέθηκαν εγγραφές.</p>
    );
  }

  const columns = Object.keys(rows[0]).filter(k => k !== "__index");

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-sky-50 text-sky-700">
            {columns.map(col => (
              <th key={col} className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {columns.map(col => (
                <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                  {row[col] || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Section = ({ sectionKey, rows }) => {
  const [open, setOpen] = useState(sectionKey === "vaccinations");
  const label = SECTION_LABELS[sectionKey] || sectionKey;
  const count = rows?.length ?? 0;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-4 h-4 text-sky-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          count > 0 ? "bg-sky-100 text-sky-600" : "bg-gray-100 text-gray-400"
        }`}>
          {count}
        </span>
      </button>
      {open && (
        <div className="border-t border-gray-100">
          <SectionTable rows={rows} />
        </div>
      )}
    </div>
  );
};

const MedicalEventsTab = ({ microchip }) => {
  const [state, setState] = useState("idle"); // idle | loading | success | error | no_microchip | not_logged_in
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const load = async () => {
    setState("loading");
    setErrorMsg("");
    try {
      const result = await fetchMedicalEvents(microchip);
      if (!result.ok) {
        if (result.ok === false && result.error?.code === "WORKER_NOT_LOGGED_IN") {
          setState("not_logged_in");
        } else {
          setErrorMsg(result.error?.message || "Αποτυχία ανάκτησης δεδομένων.");
          setState("error");
        }
        return;
      }
      setData(result.data || {});
      setState("success");
    } catch (err) {
      if (err?.code === "WORKER_NOT_LOGGED_IN") {
        setState("not_logged_in");
      } else {
        setErrorMsg(err?.message || "Σφάλμα σύνδεσης.");
        setState("error");
      }
    }
  };

  if (!microchip) {
    return (
      <div className="p-6 text-center text-sm text-gray-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        Δεν υπάρχει microchip καταχωρημένο για αυτό το κατοικίδιο.
      </div>
    );
  }

  if (state === "idle") {
    return (
      <div className="p-6 text-center">
        <Wifi className="w-10 h-10 mx-auto mb-3 text-sky-300" />
        <p className="text-sm text-gray-500 mb-4">
          Φόρτωση δεδομένων ιατρικού φακέλου από το Εθνικό Μητρώο Ζώων Συντροφιάς.
        </p>
        <p className="text-xs text-gray-400 mb-4">Microchip: <span className="font-mono font-semibold">{microchip}</span></p>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Φόρτωση από Μητρώο
        </button>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="p-6 text-center">
        <RefreshCw className="w-8 h-8 mx-auto mb-3 text-sky-400 animate-spin" />
        <p className="text-sm text-gray-500">Γίνεται scraping από pet.gov.gr...</p>
        <p className="text-xs text-gray-400 mt-1">Μπορεί να πάρει 30-60 δευτερόλεπτα.</p>
      </div>
    );
  }

  if (state === "not_logged_in") {
    return (
      <div className="p-6 text-center">
        <WifiOff className="w-8 h-8 mx-auto mb-3 text-amber-400" />
        <p className="text-sm font-medium text-gray-700 mb-1">Ο Registry Worker δεν είναι συνδεδεμένος</p>
        <p className="text-xs text-gray-400 mb-4">Πήγαινε στη σελίδα Μητρώο και ξεκίνα τον worker.</p>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors">
          <RefreshCw className="w-4 h-4" /> Δοκίμασε ξανά
        </button>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-400" />
        <p className="text-sm font-medium text-red-600 mb-1">Σφάλμα</p>
        <p className="text-xs text-gray-400 mb-4">{errorMsg}</p>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition-colors">
          <RefreshCw className="w-4 h-4" /> Δοκίμασε ξανά
        </button>
      </div>
    );
  }

  // success
  const sectionKeys = Object.keys(SECTION_LABELS).filter(k => k !== "timeline");
  const totalRecords = data?.timeline?.length ?? 0;

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">
          {totalRecords} εγγραφές συνολικά
        </p>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-600 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Ανανέωση
        </button>
      </div>

      {/* Timeline πρώτα */}
      <Section key="timeline" sectionKey="timeline" rows={data?.timeline ?? []} />
      {/* Ανά κατηγορία — μόνο αν έχουν δεδομένα */}
      {sectionKeys.filter(k => (data?.[k]?.length ?? 0) > 0).map(key => (
        <Section key={key} sectionKey={key} rows={data?.[key] ?? []} />
      ))}
    </div>
  );
};

export default MedicalEventsTab;
