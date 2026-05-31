import React, { useEffect, useState } from "react";
import { PawPrint, User, Info, Clock, RefreshCcw, Cpu, Calendar, StickyNote, Phone, HeartPulse, ClipboardList } from "lucide-react";
import PetHistory from "./PetHistory";
import MedicalEventsTab from "./MedicalEventsTab";
import ChangeOwnerModal from "./ChangeOwnerModal";
import PetDetailsModal from "../registry/PetDetailsModal.jsx";
import request from "../../api/apiClient.js";
import dayjs from "dayjs";

const SPECIES_STYLE = {
  "Σκύλος": "bg-sky-100 text-sky-700",
  "Γάτα":   "bg-violet-100 text-violet-700",
  "Πτηνό":  "bg-amber-100 text-amber-700",
  "Κουνέλι":"bg-pink-100 text-pink-700",
};
const GENDER_STYLE = {
  "Αρσενικό": "bg-sky-50 text-sky-700",
  "Θηλυκό":   "bg-rose-50 text-rose-600",
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
    <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-3.5 h-3.5 text-sky-500" />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 font-medium mt-0.5">{value || "—"}</p>
    </div>
  </div>
);

const PetProfile = ({ petId, initialTab }) => {
  const [pet, setPet] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab || "details");
  const [loading, setLoading] = useState(false);
  const [showChangeOwner, setShowChangeOwner] = useState(false);
  const [ownerChanged, setOwnerChanged] = useState(false);
  const [showRegistryCard, setShowRegistryCard] = useState(false);

  useEffect(() => {
    if (!petId) return;
    const fetchPet = async () => {
      try {
        setLoading(true);
        const data = await request(`/pets/${petId}`);
        setPet(data);
      } catch (err) {
        console.error("❌", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPet();
  }, [petId]);

  const handleSaveOwner = async () => {
    try {
      const data = await request(`/pets/${pet._id}/updateOwner`, {
        method: "PUT",
        body: { newOwnerId: pet.owner._id },
      });
      setPet(data.pet);
      setOwnerChanged(false);
    } catch (err) {
      alert("❌ Σφάλμα: " + err.message);
    }
  };

  if (loading) return (
    <div className="p-10 text-center text-sm text-gray-400">Φόρτωση...</div>
  );
  if (!pet) return (
    <div className="p-10 text-center text-sm text-red-500">Δεν βρέθηκε κατοικίδιο.</div>
  );

  return (
    <div className="p-5 space-y-4">

      {/* Pet identity card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center flex-shrink-0">
          <PawPrint className="w-7 h-7 text-sky-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-gray-800">{pet.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {pet.species && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${SPECIES_STYLE[pet.species] ?? "bg-gray-100 text-gray-600"}`}>
                {pet.species}
              </span>
            )}
            {pet.gender && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${GENDER_STYLE[pet.gender] ?? "bg-gray-100 text-gray-600"}`}>
                {pet.gender}
              </span>
            )}
          </div>
        </div>
        {pet.registrySnapshot && (
          <button
            onClick={() => setShowRegistryCard(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors flex-shrink-0"
          >
            <ClipboardList className="w-4 h-4" /> Κάρτα
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1">
        {[
          { key: "details", label: "Στοιχεία", icon: Info },
          { key: "history", label: "Ιστορικό", icon: Clock },
          { key: "medical", label: "Ιατρικός Φάκελος", icon: HeartPulse },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-xl transition-all ${
              activeTab === key
                ? "bg-sky-500 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Στοιχεία Tab */}
      {activeTab === "details" && (
        <div className="space-y-3">

          {/* Ιδιοκτήτης */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ιδιοκτήτης</p>
            {pet.owner ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-indigo-500">
                      {pet.owner.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{pet.owner.name}</p>
                    {pet.owner.phone && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />{pet.owner.phone}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowChangeOwner(true)}
                  className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors flex-shrink-0"
                >
                  <RefreshCcw className="w-3.5 h-3.5" /> Αλλαγή
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Δεν έχει οριστεί ιδιοκτήτης</p>
            )}
            {ownerChanged && (
              <button
                onClick={handleSaveOwner}
                className="mt-3 w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition-colors"
              >
                Αποθήκευση αλλαγής
              </button>
            )}
          </div>

          {/* Λοιπά στοιχεία */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-2">
            <InfoRow icon={Calendar} label="Ημ. Γέννησης"
              value={pet.birthDate ? dayjs(pet.birthDate).format("DD/MM/YYYY") : null} />
            <InfoRow icon={Cpu} label="Microchip" value={pet.microchip} />
            {pet.notes && <InfoRow icon={StickyNote} label="Σημειώσεις" value={pet.notes} />}
          </div>
        </div>
      )}

      {/* Ιστορικό Tab */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <PetHistory petId={pet._id} />
        </div>
      )}

      {/* Ιατρικός Φάκελος Tab */}
      {activeTab === "medical" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <MedicalEventsTab microchip={pet.microchip} petId={pet._id} />
        </div>
      )}

      {showChangeOwner && (
        <ChangeOwnerModal
          isOpen={showChangeOwner}
          onClose={() => setShowChangeOwner(false)}
          onSelect={(newOwner) => {
            setPet({ ...pet, owner: newOwner });
            setOwnerChanged(true);
          }}
        />
      )}

      <PetDetailsModal
        open={showRegistryCard}
        onClose={() => setShowRegistryCard(false)}
        data={pet.registrySnapshot}
      />
    </div>
  );
};

export default PetProfile;
