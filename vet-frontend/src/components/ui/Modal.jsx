import React from "react";
import { X } from "lucide-react";
import { Button } from "./button";

const Modal = ({ isOpen, onClose, children, preventBackdropClose = false }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={preventBackdropClose ? undefined : onClose}
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-[95vw] md:max-w-[800px] max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-purple-400 hover:scrollbar-thumb-purple-500 scrollbar-track-gray-100 dark:scrollbar-track-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          className="absolute top-3 right-3 p-2"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" />
        </Button>

        {children}
      </div>
    </div>
  );
};

export default Modal;
