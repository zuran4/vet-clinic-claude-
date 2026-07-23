import React from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import { useModalScrollLock } from "../../hooks/useModalScrollLock.js";

const Modal = ({ isOpen, onClose, children, preventBackdropClose = false, noPadding = false }) => {
  const scrollRef = useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      style={{ touchAction: "none" }}
      onClick={preventBackdropClose ? undefined : onClose}
    >
      {/* Outer: rounded + overflow-hidden για σωστό clip */}
      <div
        className="relative bg-white dark:bg-win-surface rounded-2xl shadow-xl w-full sm:max-w-[800px] max-h-[90dvh] sm:max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inner: scrollable — μόνο κάθετο pan, χωρίς rubber-band προς τα έξω */}
        <div
          ref={scrollRef}
          className={`overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-purple-400 hover:scrollbar-thumb-purple-500 scrollbar-track-gray-100 dark:scrollbar-track-win-elevated ${noPadding ? "" : "p-4 sm:p-6"}`}
          style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
        >
          {!noPadding && (
            <Button
              variant="ghost"
              className="absolute top-3 right-3 min-w-[44px] min-h-[44px] p-2"
              onClick={onClose}
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" />
            </Button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
