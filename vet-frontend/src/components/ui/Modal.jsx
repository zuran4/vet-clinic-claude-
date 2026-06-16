import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

const Modal = ({ isOpen, onClose, children, preventBackdropClose = false }) => {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={preventBackdropClose ? undefined : onClose}
    >
      <div
        className="relative bg-white dark:bg-win-surface rounded-2xl shadow-xl p-4 sm:p-6 w-full sm:max-w-[800px] max-h-[90dvh] sm:max-h-[90vh] overflow-y-auto safe-bottom scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-purple-400 hover:scrollbar-thumb-purple-500 scrollbar-track-gray-100 dark:scrollbar-track-win-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          className="absolute top-3 right-3 min-w-[44px] min-h-[44px] p-2"
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
