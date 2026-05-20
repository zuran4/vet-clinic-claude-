import React, { useEffect, useState } from "react";
import {
  PawPrint,
  User,
  Info,
  Clock,
  RefreshCcw,
  AlertTriangle,
  Save,
} from "lucide-react";
import { TabButton } from "../ui/TabButton";
import { Button } from "../ui/button";
import { Alert } from "../ui/Alert"; // ✅ νέο import για alert
import PetHistory from "./PetHistory";
import ChangeOwnerModal from "./ChangeOwnerModal";
import request from "../../api/apiClient.js"; // 👈 προσαρμόζεις αν το path είναι άλλο

const PetProfile = ({ petId }) => {
  const [pet, setPet] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [ownerChanged, setOwnerChanged] = useState(false);
  const [showChangeOwner, setShowChangeOwner] = useState(false);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        setLoading(true);

        // Χρήση apiClient:
        // - Production: VITE_API_BASE_URL (Render)
        // - Local: http://localhost:5000/api
        const data = await request(`/pets/${petId}`);

        setPet(data);
      } catch (err) {
        console.error("❌ Σφάλμα φόρτωσης κατοικιδίου:", err);
      } finally {
        setLoading(false);
      }
    };

    if (petId) fetchPet();
  }, [petId]);

  // 🔹 Αποθήκευση νέου ιδιοκτήτη
  const handleSaveOwner = async () => {
    try {
      const data = await request(`/pets/${pet._id}/updateOwner`, {
        method: "PUT",
        body: { newOwnerId: pet.owner._id },
      });

      setPet(data.pet);
      setOwnerChanged(false);
      alert("✅ Ο ιδιοκτήτης ενημερώθηκε!");
    } catch (err) {
      alert("❌ Σφάλμα: " + err.message);
    }
  };

  if (loading) return <p className="text-gray-500">Φόρτωση...</p>;
  if (!pet) return <p className="text-red-500">❌ Δεν βρέθηκε κατοικίδιο.</p>;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center mb-4 justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <PawPrint className="w-6 h-6 text-purple-600" />
          {pet.name}
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-4">
        <TabButton
          active={activeTab === "details"}
          onClick={() => setActiveTab("details")}
        >
          <Info className="w-4 h-4" />
          Στοιχεία
        </TabButton>
        <TabButton
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        >
          <Clock className="w-4 h-4" />
          Ιστορικό
        </TabButton>
      </div>

      {/* Περιεχόμενο */}
      {activeTab === "details" && (
        <div className="space-y-4">
          {/* Ιδιοκτήτης */}
          {pet.owner ? (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  {pet.owner.name} ({pet.owner.phone || "χωρίς τηλ."})
                </span>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => setShowChangeOwner(true)}
                  className="flex items-center gap-1"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Αλλαγή
                </Button>
              </div>
              {ownerChanged && (
                <div className="mt-3 space-y-2">
                  <Alert variant="warning" className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Ο ιδιοκτήτης έχει αλλάξει. Αποθήκευσε για να ενημερωθεί.
                  </Alert>
                  <Button
                    onClick={handleSaveOwner}
                    variant="primary"
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Αποθήκευση
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-500">Ιδιοκτήτης: Άγνωστος</p>
          )}

          {/* Υπόλοιπα στοιχεία */}
          <p>
            <span className="font-semibold">Είδος:</span> {pet.species}
          </p>
          <p>
            <span className="font-semibold">Φύλο:</span> {pet.gender}
          </p>
          <p>
            <span className="font-semibold">Ημ. γέννησης:</span>{" "}
            {pet.birthDate
              ? new Date(pet.birthDate).toLocaleDateString("el-GR")
              : "-"}
          </p>
          <p>
            <span className="font-semibold">Microchip:</span>{" "}
            {pet.microchip || "-"}
          </p>
          {pet.notes && (
            <p>
              <span className="font-semibold">Σημειώσεις:</span> {pet.notes}
            </p>
          )}
        </div>
      )}

      {activeTab === "history" && <PetHistory petId={pet._id} />}

      {/* 🔹 Modal αλλαγής ιδιοκτήτη */}
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
    </div>
  );
};

export default PetProfile;
