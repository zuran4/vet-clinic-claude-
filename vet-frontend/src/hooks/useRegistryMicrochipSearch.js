import { useEffect, useMemo, useRef, useState } from "react";
import { lookupMicrochip, getRegistryHistory, addRegistryHistoryEntry } from "../api/registryApi.js";

const EMPTY_CARD_DATA = {
  microchip: null,
  markingDate: null,
  passportNumber: null,
  petName: null,
  sex: null,
  age: null,
  breed: null,
  species: null,
  isSmallPet: null,
  color: null,
  managedBy: null,

  ownerName: null,
  ownerPhone: null,
  ownerEmail: null,
  ownerAddress: null,
  ownerCity: null,
  ownerAfm: null,

  sterilizationData: null,
  isSterilized: null,
  isVaccinated: null,
  lastVacDate: null,
  vacBrand: null,
  vacType: null,
  vaccinations: [],
};

function buildBaseCardData(microchip) {
  return { ...EMPTY_CARD_DATA, microchip: microchip || null };
}

function normalizeError(err) {
  return {
    message: err?.message || "Αποτυχία αναζήτησης στο μητρώο",
    requestId: err?.requestId || null,
    code: err?.code || null,
  };
}

function normalizeOkFalse(data) {
  return {
    message: "Το μητρώο επέστρεψε ok=false",
    requestId: data?.requestId || null,
    code: "REGISTRY_OK_FALSE",
  };
}

function buildCardDataFromApi(data, fallbackMicrochip) {
  const booklet = data?.bookletData || {};
  const owner = data?.owner || {};

  const sterilizationData = data?.sterilizationData ?? null;
  const isSterilized = data?.isSterilized ?? sterilizationData?.isSterilized ?? null;
  const isVaccinated = data?.isVaccinated ?? null;

  const vaccinationData = data?.vaccinationData ?? null;

  return {
    microchip: data?.microchip || fallbackMicrochip || null,
    markingDate: booklet.markingDate ?? booklet.chipDate ?? null,
    passportNumber: booklet.passportNumber ?? null,
    petName: booklet.petName ?? booklet.name ?? null,
    sex: booklet.sex ?? null,
    age: booklet.age ?? booklet.petAge ?? null,
    breed: booklet.breed ?? null,
    species: booklet.species ?? null,
    isSmallPet: booklet.isSmallPet ?? booklet.smallPet ?? null,
    color: booklet.color ?? booklet.coatColor ?? null,
    managedBy: booklet.managedBy ?? booklet.managedByName ?? null,

    ownerName: owner.fullName ?? null,
    ownerPhone: owner.phone ?? null,
    ownerEmail: owner.email ?? null,
    ownerAddress: owner.address ?? null,
    ownerCity: owner.city ?? null,
    ownerAfm: owner.afm ?? null,

    sterilizationData,
    isSterilized,
    isVaccinated,
    lastVacDate: vaccinationData?.lastVacDate ?? null,
    vacBrand:    vaccinationData?.vacBrand    ?? null,
    vacType:     vaccinationData?.vacType     ?? null,
    vaccinations: vaccinationData?.vaccinations ?? [],
  };
}

export function useRegistryMicrochipSearch() {
  const [microchip, setMicrochip] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [isLoading, setIsLoading] = useState(false);

  // Enterprise error object
  const [error, setError] = useState(null); // { message, requestId, code } | null

  const [cardData, setCardData] = useState({ ...EMPTY_CARD_DATA });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [history, setHistory] = useState([]);

  // Cache: microchip -> cardData
  const cacheRef = useRef(new Map());

  // Guard για “μόνο το τελευταίο request wins”
  const reqSeqRef = useRef(0);

  useEffect(() => {
    getRegistryHistory()
      .then((loaded) => setHistory(loaded))
      .catch(() => {});
  }, []);

  async function saveToHistory(nextData) {
    if (!nextData?.microchip) return;

    const entry = {
      microchip: nextData.microchip,
      petName: nextData.petName || "",
      species: nextData.species || "",
      lastSearchedAt: new Date().toISOString(),
    };

    // Optimistic update ώστε να φαίνεται άμεσα στο UI
    setHistory((prev) => [entry, ...prev.filter((x) => x.microchip !== entry.microchip)]);

    try {
      const updated = await addRegistryHistoryEntry(entry);
      setHistory(updated);
    } catch {}
  }

  async function performLookup(trimmedMicrochip, { openModalOnSuccess = true } = {}) {
    const key = String(trimmedMicrochip || "").trim();
    if (!key) return;

    // ✅ Dedupe: αν το έχουμε cached, μην ξαναχτυπάς API
    const cached = cacheRef.current.get(key);
    if (cached) {
      setError(null);
      setStatus("success");
      setIsLoading(false);
      setCardData(cached);
      if (openModalOnSuccess) setIsModalOpen(true);
      // Αποθήκευση snapshot και από cache (για νέα pets με ίδιο microchip)
      const token = localStorage.getItem("token");
      fetch(`/api/pets/snapshot/${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ snapshot: cached }),
      }).catch(() => {});
      return;
    }

    // Start new request
    const reqId = ++reqSeqRef.current;

    setIsLoading(true);
    setStatus("loading");
    setError(null);

    // κλείνουμε modal στην αρχή για να μην βλέπει stale data
    setIsModalOpen(false);

    // base data (ώστε UI να έχει microchip αμέσως)
    setCardData(buildBaseCardData(key));

    try {
      const data = await lookupMicrochip(key, {
        includeSnippets: false,
        includeBooklet: true,
        includeRaw: false,
      });

      // Αν ξεκίνησε νεότερο request, αγνοούμε αυτό
      if (reqId !== reqSeqRef.current) return;

      if (data?.ok === false) {
        setError(normalizeOkFalse(data));
        setStatus("error");
        return;
      }

      const nextData = buildCardDataFromApi(data, key);

      setCardData(nextData);
      cacheRef.current.set(key, nextData); // ✅ cache

      saveToHistory(nextData);

      // Αποθήκευση registry snapshot στη βάση (fire & forget)
      const token = localStorage.getItem("token");
      fetch(`/api/pets/snapshot/${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ snapshot: nextData }),
      }).catch(() => {});

      setStatus("success");
      if (openModalOnSuccess && (nextData.microchip || nextData.petName)) {
        setIsModalOpen(true);
      }
    } catch (err) {
      if (reqId !== reqSeqRef.current) return;
      setError(normalizeError(err));
      setStatus("error");
    } finally {
      if (reqId !== reqSeqRef.current) return;
      setIsLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = microchip.trim();
    if (!trimmed) return;
    await performLookup(trimmed, { openModalOnSuccess: true });
  }

  async function handleHistorySelect(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return;
    setMicrochip(trimmed);
    await performLookup(trimmed, { openModalOnSuccess: true });
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  const trimmedInput = microchip.trim();

  const existingSearch = useMemo(() => {
    if (!trimmedInput || history.length === 0) return null;
    return history.find((item) => item.microchip === trimmedInput) || null;
  }, [trimmedInput, history]);

  return {
    microchip,
    setMicrochip,

    // existing behavior
    isLoading,
    error,
    cardData,
    isModalOpen,
    history,
    existingSearch,

    // handlers
    handleSubmit,
    handleHistorySelect,
    closeModal,

    // extra enterprise state (δεν σπάει τίποτα αν δεν το χρησιμοποιήσεις)
    status,
  };
}
