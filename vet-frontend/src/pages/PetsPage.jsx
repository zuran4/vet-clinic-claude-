import React from "react";
import PageHeader from "../components/ui/PageHeader";
import PetList from "../components/pets//PetList";
import { PawPrint } from "lucide-react"; // ✅ lucide icon

function PetsPage({ onClose }) {
  return (
    <div className="p-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-primary" />
            Κατοικίδια
          </span>
        }
        onClose={onClose}
      />
      <PetList />
    </div>
  );
}

export default PetsPage;
