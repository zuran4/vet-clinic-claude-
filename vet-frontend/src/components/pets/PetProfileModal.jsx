import React from "react";
import Modal from "../ui/Modal";
import PetProfile from "./PetProfile";

const PetProfileModal = ({ petId, onClose }) => {
  if (!petId) return null;

  return (
    <Modal isOpen={true} onClose={onClose}>
      <PetProfile petId={petId} onBack={onClose} />
    </Modal>
  );
};

export default PetProfileModal;
