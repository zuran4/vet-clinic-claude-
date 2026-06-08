import React, { useCallback, useEffect, useMemo, useState } from "react";
import PetDetailsModal from "./PetDetailsModal.jsx";
import CustomerModal from "../customers/CustomerModal.jsx";
import PetModal from "../pets/PetModal.jsx";
import PetProfileModal from "../pets/PetProfileModal.jsx";
import SearchHistoryList from "./parts/SearchHistoryList.jsx";
import MicrochipSearchForm from "./parts/MicrochipSearchForm.jsx";
import RegistryLookupLoadingNotice from "./parts/RegistryLookupLoadingNotice.jsx";
import { Search, History, RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { formatDateTime } from "./utils/dateFormat";
import { useRegistryMicrochipSearch } from "../../hooks/useRegistryMicrochipSearch.js";

export default function RegistryMicrochipSearchBlock() {
  const {
    microchip,
    setMicrochip,
    isLoading,
    error,
    cardData,
    isModalOpen,
    history,
    existingSearch,
    handleSubmit,
    handleHistorySelect,
    closeModal,
  } = useRegistryMicrochipSearch();

  const [workerRunning, setWorkerRunning] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerInitialData, setCustomerInitialData] = useState(null);
  const [chipDataForPet, setChipDataForPet] = useState(null);

  // State για pet modal (ανοίγει αφού αποθηκευτεί ο πελάτης)
  const [showPetModal, setShowPetModal] = useState(false);
  const [petInitialData, setPetInitialData] = useState(null);
  const [petOwner, setPetOwner] = useState(null);

  // State για pet profile modal (ανοίγει αφού αποθηκευτεί το κατοικίδιο)
  const [savedPetId, setSavedPetId] = useState(null);

  // Chip data → pet form fields
  const mapChipToPet = useCallback((d) => {
    const strip = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const normalizeSpecies = (s) => {
      if (!s) return "";
      const l = strip(s);
      if (l.includes("σκυλ")) return "Σκύλος";
      if (l.includes("γατ")) return "Γάτα";
      if (l.includes("κουν")) return "Κουνέλι";
      if (l.includes("πτην") || l.includes("πουλ")) return "Πτηνό";
      return "Άλλο";
    };
    const normalizeGender = (g) => {
      if (!g) return "";
      const l = strip(g);
      if (l.includes("αρσ")) return "Αρσενικό";
      if (l.includes("θηλ")) return "Θηλυκό";
      return "";
    };
    return {
      name:       d?.petName    || "",
      species:    normalizeSpecies(d?.species),
      gender:     normalizeGender(d?.sex),
      microchip:  d?.microchip  || "",
      neutered:   Boolean(d?.sterilizationData?.isSterilized ?? d?.isSterilized),
      vaccinated: Boolean(d?.isVaccinated),
    };
  }, []);

  const handleAction = useCallback(({ type, data }) => {
    if (type === "createCustomer") {
      setCustomerInitialData({
        name:    data?.ownerName    || "",
        phone:   data?.ownerPhone   || "",
        email:   data?.ownerEmail   || "",
        address: data?.ownerAddress || "",
        city:    data?.ownerCity    || "",
        afm:     data?.ownerAfm     || "",
        notes:   "",
      });
      setChipDataForPet(data);
      closeModal();
      setShowCustomerModal(true);
    }
  }, [closeModal]);

  const fetchWorkerState = useCallback(async () => {
    try {
      const res = await fetch("/api/registry/worker/state");
      const json = await res.json().catch(() => null);
      setWorkerRunning(Boolean(json?.running));
    } catch {
      setWorkerRunning(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkerState();
    const interval = setInterval(fetchWorkerState, 15000);
    return () => clearInterval(interval);
  }, [fetchWorkerState]);

  const lastResult = useMemo(() => {
    if (!cardData) return null;
    return {
      chip: cardData?.microchip || microchip || "—",
      pet: cardData?.petName || "—",
      owner: cardData?.ownerName || "—",
      at: existingSearch?.createdAt ? formatDateTime(existingSearch.createdAt) : null,
    };
  }, [cardData, microchip, existingSearch]);

  return (
    <section className="w-full rounded-2xl overflow-hidden border border-violet-100 shadow-sm">

      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-violet-500 to-indigo-400 px-5 pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
              <Search className="h-4 w-4 text-white" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">
                Μητρώο Κατοικίδιων
              </p>
              <p className="text-[11px] text-white/70 mt-0.5">
                Αναζήτηση microchip από το εθνικό μητρώο
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Worker status */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
              workerRunning === null
                ? "bg-white/10 text-white/60"
                : workerRunning
                ? "bg-white/20 text-white"
                : "bg-red-400/30 text-white"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                workerRunning === null ? "bg-white/40" :
                workerRunning ? "bg-green-300" : "bg-red-300"
              }`} />
              {workerRunning === null ? "Έλεγχος..." : workerRunning ? "Worker ενεργός" : "Worker offline"}
            </span>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchWorkerState}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Ανανέωση"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            {/* History count */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-[11px] text-white/80">
              <History className="h-3 w-3" />
              {history?.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white p-5 space-y-4">
        {/* Search Form */}
        <MicrochipSearchForm
          microchip={microchip}
          onChangeMicrochip={setMicrochip}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          existingSearch={existingSearch}
          formatDateTime={formatDateTime}
        />

        {/* Error */}
        {error?.message && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-100">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-700">{error.message}</p>
          </div>
        )}

        {/* Loading */}
        <RegistryLookupLoadingNotice isLoading={isLoading} />

        {/* Last Result */}
        {lastResult && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-violet-50 border border-violet-100">
            <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="text-xs font-mono text-violet-500">{lastResult.chip}</span>
                <span className="text-xs font-semibold text-gray-800">{lastResult.pet}</span>
                <span className="text-xs text-gray-500">{lastResult.owner}</span>
              </div>
            </div>
            {lastResult.at && (
              <div className="flex items-center gap-1 text-[11px] text-gray-400 flex-shrink-0">
                <Clock className="w-3 h-3" />
                {lastResult.at}
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history?.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Τελευταίες Αναζητήσεις
            </p>
            <SearchHistoryList
              history={history}
              onSelectMicrochip={handleHistorySelect}
              formatDateTime={formatDateTime}
            />
          </div>
        )}
      </div>

      <PetDetailsModal
        open={isModalOpen}
        onClose={closeModal}
        data={cardData}
        onAction={handleAction}
      />

      {showCustomerModal && (
        <CustomerModal
          initialData={customerInitialData}
          onSaved={(savedCustomer) => {
            setShowCustomerModal(false);
            setCustomerInitialData(null);
            if (chipDataForPet) {
              // Normalize owner — Mongoose μπορεί να επιστρέφει id ή _id
              const owner = {
                _id:   savedCustomer._id || savedCustomer.id,
                name:  savedCustomer.name,
                phone: savedCustomer.phone || "",
              };
              setPetInitialData({ ...mapChipToPet(chipDataForPet), owner });
              setPetOwner(owner);
              setChipDataForPet(null);
              setShowPetModal(true);
            }
          }}
          onCancel={() => {
            setShowCustomerModal(false);
            setCustomerInitialData(null);
            setChipDataForPet(null);
          }}
        />
      )}

      {showPetModal && (
        <PetModal
          initialData={petInitialData}
          owner={petOwner}
          onSaved={(saved) => {
            setShowPetModal(false);
            setPetInitialData(null);
            setPetOwner(null);
            // Άνοιγμα ιατρικού φακέλου αμέσως μετά την αποθήκευση
            if (saved?._id) setSavedPetId(saved._id);
          }}
          onCancel={() => {
            setShowPetModal(false);
            setPetInitialData(null);
            setPetOwner(null);
          }}
        />
      )}

      {savedPetId && (
        <PetProfileModal
          petId={savedPetId}
          initialTab="medical"
          onClose={() => setSavedPetId(null)}
        />
      )}
    </section>
  );
}
