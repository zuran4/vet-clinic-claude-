import React, { useCallback, useState } from "react";
import PetDetailsModal from "./PetDetailsModal.jsx";
import CustomerModal from "../customers/CustomerModal.jsx";
import PetModal from "../pets/PetModal.jsx";
import PetProfileModal from "../pets/PetProfileModal.jsx";
import SearchHistoryModal from "./parts/SearchHistoryModal.jsx";
import MicrochipSearchForm from "./parts/MicrochipSearchForm.jsx";
import RegistryLookupLoadingNotice from "./parts/RegistryLookupLoadingNotice.jsx";
import { Search, History, AlertCircle } from "lucide-react";
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

  const [showHistory, setShowHistory] = useState(false);
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

  return (
    <section className="w-full rounded-2xl overflow-hidden border border-teal-100 dark:border-teal-700/40 shadow-sm">

      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-400 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
            <Search className="h-4 w-4 text-white" />
          </span>
          <p className="text-sm font-semibold text-white leading-tight">
            Μητρώο Κατοικίδιων
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowHistory(true)}
          title="Τελευταίες Αναζητήσεις"
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <History className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="bg-white dark:bg-win-surface p-3 space-y-2">
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
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-600/50">
            <AlertCircle className="w-4 h-4 text-red-400 dark:text-red-300 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300">{error.message}</p>
          </div>
        )}

        {/* Loading */}
        <RegistryLookupLoadingNotice isLoading={isLoading} />
      </div>

      <PetDetailsModal
        open={isModalOpen}
        onClose={closeModal}
        data={cardData}
        onAction={handleAction}
      />

      {showHistory && (
        <SearchHistoryModal
          history={history}
          onSelectMicrochip={handleHistorySelect}
          formatDateTime={formatDateTime}
          onClose={() => setShowHistory(false)}
        />
      )}

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
            // Άνοιγμα προφίλ αμέσως μετά την αποθήκευση
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
          onClose={() => setSavedPetId(null)}
        />
      )}
    </section>
  );
}
