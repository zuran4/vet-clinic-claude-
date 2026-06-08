// src/components/registry/RegistryLookup.jsx
import React, { useMemo, useState, useCallback, useRef } from "react";
import { lookupMicrochip, fetchMedicalEvents } from "../../api/registryApi.js";
import { addPetHistoryEntry } from "../../api/petsApi.js";
import MicrochipResultCard from "./MicrochipResultCard.jsx";
import PetDetailsModal from "./PetDetailsModal.jsx";
import CustomerModal from "../customers/CustomerModal.jsx";
import PetModal from "../pets/PetModal.jsx";
import PetProfileModal from "../pets/PetProfileModal.jsx";
import { Loader2 } from "lucide-react";

function parseGreekDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export default function RegistryLookup({
  onLookupStart = () => {},
  onLookupFinish = () => {},
}) {
  const [microchip, setMicrochip] = useState("");
  const [loading, setLoading] = useState(false);

  // Enterprise-friendly error state
  const [error, setError] = useState(null); // { message, requestId, code }
  const [result, setResult] = useState(null);

  // 🔹 State για το popup
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [petModalData, setPetModalData] = useState(null);

  // 🔹 State για customer modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerInitialData, setCustomerInitialData] = useState(null);
  const [chipDataForPet, setChipDataForPet] = useState(null);

  // 🔹 State για pet modal (μετά τη δημιουργία πελάτη)
  const [showPetModal, setShowPetModal] = useState(false);
  const [petFormInitialData, setPetFormInitialData] = useState(null);
  const [petOwner, setPetOwner] = useState(null);

  // 🔹 State για pet profile modal (ανοίγει αμέσως μετά αποθήκευση κατοικιδίου)
  const [savedPetId, setSavedPetId] = useState(null);

  // 🔹 Medical confirm dialog
  const [medicalConfirm, setMedicalConfirm]       = useState(null); // { petId, microchip }
  const [savingMedical, setSavingMedical]          = useState(false);
  const [medicalSavedCount, setMedicalSavedCount] = useState(null);
  // state (όχι ref) ώστε να επιβιώνει ανεξάρτητα από re-renders
  const [pendingMicrochip, setPendingMicrochip]   = useState(null);

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
      setPetModalOpen(false);
      setShowCustomerModal(true);
    }
  }, []);

  const handleSaveMedical = useCallback(async () => {
    if (!medicalConfirm) return;
    setSavingMedical(true);
    try {
      const res = await fetchMedicalEvents(medicalConfirm.microchip);
      const timeline = res?.data?.timeline;
      if (!Array.isArray(timeline) || timeline.length === 0) {
        setMedicalSavedCount(0);
        setMedicalConfirm(null);
        return;
      }
      let saved = 0;
      for (const row of timeline) {
        try {
          const reason = row["Γεγονός"] || row["Γεγονος"] || Object.values(row)[0] || "";
          const dateStr = row["Ημερομηνία"] || row["Ημερομηνια"] || "";
          const registeredBy = row["Καταχωρίσθηκε από"] || row["Καταχωρίσθηκε απο"] || "";
          if (!reason) continue;
          await addPetHistoryEntry(medicalConfirm.petId, {
            reason: `[Μητρώο] ${reason}`,
            result: registeredBy ? `Καταχωρίσθηκε από: ${registeredBy}` : "",
            date: parseGreekDate(dateStr) || undefined,
          });
          saved++;
        } catch {}
      }
      setMedicalSavedCount(saved);
    } catch {
      setMedicalSavedCount(0);
    } finally {
      setSavingMedical(false);
      setMedicalConfirm(null);
    }
  }, [medicalConfirm]);

  const isDev = useMemo(() => {
    try {
      return Boolean(import.meta?.env?.DEV);
    } catch {
      return false;
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmed = microchip.trim();
    if (!trimmed) {
      setError({ message: "Συμπλήρωσε αριθμό microchip.", requestId: null, code: "VALIDATION_ERROR" });
      setResult(null);
      return;
    }

    onLookupStart(trimmed);

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setPetModalData(null);
      setPetModalOpen(false);

      // 🔹 Κλήση backend
      // Κρατάμε includeBooklet=true γιατί το UI κάνει mapping από bookletData.
      const data = await lookupMicrochip(trimmed, {
        includeSnippets: false,
        includeBooklet: true,
        includeRaw: false,
      });

      setResult(data);

      // 🔹 Εξαγωγή booklet + owner για mapping
      const booklet = data.bookletData || {};
      const owner = data.owner || {};

      // 🔹 Sterilization data (μπορεί να έρχεται είτε top-level είτε μέσα στο booklet)
      const sterilization =
        data.sterilizationData ??
        booklet.sterilizationData ??
        booklet.sterilization ??
        null;

      // 🔹 Payload που περιμένει το PetDetailsModal
      const modalPayload = {
        microchip: data.microchip,
        markingDate: booklet.markingDate ?? booklet.chipDate ?? null,
        passportNumber: booklet.passportNumber ?? null,
        petName: booklet.petName ?? booklet.name ?? null,
        sex: booklet.sex ?? null,
        age: booklet.petAge ?? booklet.age ?? null,
        breed: booklet.breed ?? null,
        species: booklet.species ?? null,
        isSmallPet: booklet.isSmallPet ?? booklet.smallPet ?? null,
        color: booklet.color ?? booklet.coatColor ?? null,
        managedBy: booklet.managedBy ?? booklet.managedByName ?? null,

        sterilizationData: sterilization,
        isSterilized: sterilization?.isSterilized ?? data.isSterilized ?? null,

        isVaccinated: data.isVaccinated ?? data.vaccinationData?.isVaccinated ?? null,
        lastVacDate: data.vaccinationData?.lastVacDate ?? null,
        vacBrand: data.vaccinationData?.vacBrand ?? null,
        vacType: data.vaccinationData?.vacType ?? null,

        // 🔹 Ιδιοκτήτης
        ownerName: owner.fullName ?? null,
        ownerPhone: owner.phone ?? null,
        ownerEmail: owner.email ?? null,
        ownerAddress: owner.address ?? null,
        ownerCity: owner.city ?? null,
        ownerAfm: owner.afm ?? null,
      };

      if (isDev) {
        // Dev-only: debugging χωρίς να “ρυπαίνει” production console
        // eslint-disable-next-line no-console
        console.log("[RegistryLookup] modalPayload", modalPayload);
      }

      setPetModalData(modalPayload);
      setPetModalOpen(true);
    } catch (err) {
      if (isDev) {
        // eslint-disable-next-line no-console
        console.error("❌ Registry lookup error:", err);
      }

      setError({
        message: err?.message || "Αποτυχία αναζήτησης στο μητρώο.",
        requestId: err?.requestId || null,
        code: err?.code || null,
      });
    } finally {
      setLoading(false);
      onLookupFinish();
    }
  };

  return (
    <>
      <section className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Αναζήτηση στο Εθνικό Μητρώο Ζώων
        </h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
        >
          <input
            type="text"
            value={microchip}
            onChange={(e) => setMicrochip(e.target.value)}
            placeholder="Αριθμός microchip"
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading ? "true" : "false"}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Αναζήτηση…</span>
              </span>
            ) : (
              "Αναζήτηση"
            )}
          </button>
        </form>

        {/* Μήνυμα λάθους */}
        {error?.message && (
          <div className="text-xs text-red-600 dark:text-red-400 space-y-1">
            <div>{error.message}</div>
            {error.requestId && (
              <div className="text-[11px] text-red-500/90">
                requestId: <span className="font-mono">{error.requestId}</span>
              </div>
            )}
          </div>
        )}

        {/* Loading block */}
        {loading && (
          <div className="mt-4 rounded-xl border-2 border-blue-500 bg-blue-50 px-4 py-4 flex items-start gap-3">
            <Loader2 className="h-6 w-6 mt-0.5 animate-spin text-blue-600" />
            <div className="space-y-1 text-sm text-blue-900">
              <div className="font-bold uppercase tracking-wide">
                Γίνεται αναζήτηση στο μητρώο
              </div>
              <div>
                Παρακαλώ περίμενε μέχρι να ολοκληρωθεί η αναζήτηση.
              </div>
            </div>
          </div>
        )}

        {/* Αποτελέσματα */}
        {!loading && result && (
          <div className="space-y-3 mt-2">
            {/* Προαιρετικό dev-only Raw JSON */}
            {isDev && (
              <details className="mt-1">
                <summary className="cursor-pointer text-[11px] text-gray-500">
                  Raw JSON (dev)
                </summary>
                <pre className="mt-1 max-h-40 overflow-auto bg-gray-50 dark:bg-gray-900 p-2 rounded text-[11px]">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            )}

            {/* Δομημένη κάρτα με ζώο + ιδιοκτήτη */}
            {(() => {
              const booklet = result.bookletData || {};
              const owner = result.owner || {};

              return (
                <MicrochipResultCard
                  microchip={result.microchip}
                  markingDate={booklet.markingDate ?? booklet.chipDate}
                  passportNumber={booklet.passportNumber ?? null}
                  petName={booklet.petName ?? booklet.name}
                  sex={booklet.sex}
                  age={booklet.petAge ?? booklet.age}
                  breed={booklet.breed}
                  species={booklet.species}
                  isSmallPet={booklet.isSmallPet ?? booklet.smallPet}
                  color={booklet.color ?? booklet.coatColor}
                  managedBy={booklet.managedBy ?? booklet.managedByName}
                  // ιδιοκτήτης
                  ownerFullName={owner.fullName}
                  ownerPhone={owner.phone}
                  ownerEmail={owner.email}
                  ownerAddress={owner.address}
                  ownerCity={owner.city}
                  ownerAfm={owner.afm}
                  error={!result.ok ? "Το μητρώο επέστρεψε ok=false" : undefined}
                />
              );
            })()}
          </div>
        )}
      </section>

      {/* Popup κάρτας κατοικιδίου */}
      <PetDetailsModal
        open={petModalOpen && !!petModalData}
        onClose={() => setPetModalOpen(false)}
        data={petModalData || {}}
        onAction={handleAction}
      />

      {showCustomerModal && (
        <CustomerModal
          initialData={customerInitialData}
          onSaved={(savedCustomer) => {
            setShowCustomerModal(false);
            setCustomerInitialData(null);
            if (chipDataForPet) {
              const owner = {
                _id:   savedCustomer._id || savedCustomer.id,
                name:  savedCustomer.name,
                phone: savedCustomer.phone || "",
              };
              setPendingMicrochip(chipDataForPet?.microchip || null);
              setPetFormInitialData({ ...mapChipToPet(chipDataForPet), owner });
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
          initialData={petFormInitialData}
          owner={petOwner}
          onSaved={(savedPet) => {
            setShowPetModal(false);
            setPetFormInitialData(null);
            setPetOwner(null);

            const petId = savedPet?._id || savedPet?.id;
            const microchip = pendingMicrochip;
            setPendingMicrochip(null);

            // Χρησιμοποιούμε setTimeout για να εμφανιστεί το dialog
            // αφού κλείσει το PetModal
            if (petId && microchip) {
              setTimeout(() => {
                setMedicalSavedCount(null);
                setMedicalConfirm({ petId, microchip });
              }, 200);
            }
          }}
          onCancel={() => {
            setShowPetModal(false);
            setPetFormInitialData(null);
            setPetOwner(null);
          }}
        />
      )}
      {/* ── Confirmation: Αποθήκευση Ιατρικού Φακέλου ── */}
      {(medicalConfirm || savingMedical || medicalSavedCount !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center space-y-4">

            {savingMedical ? (
              <>
                <div className="w-12 h-12 mx-auto rounded-full bg-sky-50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                </div>
                <p className="text-sm font-medium text-gray-700">Φόρτωση από Μητρώο...</p>
                <p className="text-xs text-gray-400">Μπορεί να πάρει 30-60 δευτερόλεπτα.</p>
              </>
            ) : medicalSavedCount !== null ? (
              <>
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-2xl">✅</div>
                <p className="text-sm font-semibold text-gray-800">
                  {medicalSavedCount > 0
                    ? `Αποθηκεύτηκαν ${medicalSavedCount} εγγραφές ιατρικού ιστορικού!`
                    : "Δεν βρέθηκαν εγγραφές στο Μητρώο."}
                </p>
                <button
                  onClick={() => setMedicalSavedCount(null)}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition-colors"
                >
                  Κλείσιμο
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 flex items-center justify-center text-2xl">🏥</div>
                <p className="text-base font-semibold text-gray-800">Αποθήκευση Ιατρικού Φακέλου</p>
                <p className="text-sm text-gray-500">
                  Θέλετε να φορτωθούν και να αποθηκευτούν τα γεγονότα ιατρικού ιστορικού από το Εθνικό Μητρώο;
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setMedicalConfirm(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Όχι
                  </button>
                  <button
                    onClick={handleSaveMedical}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                  >
                    Ναι, αποθήκευση
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
