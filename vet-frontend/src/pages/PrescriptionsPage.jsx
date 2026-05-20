import React from "react";
import PageHeader from "../components/ui/PageHeader";
import PrescriptionList from "../components/prescriptions/PrescriptionList";
import { Pill } from "lucide-react"; // ✅ lucide icon

function PrescriptionsPage({ onClose }) {
  return (
    <div className="p-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            Συνταγές
          </span>
        }
        onClose={onClose}
      />

      <PrescriptionList />
    </div>
  );
}

export default PrescriptionsPage;
