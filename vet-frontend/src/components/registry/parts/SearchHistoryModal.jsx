import React from "react";
import { X, History } from "lucide-react";
import SearchHistoryList from "./SearchHistoryList.jsx";
import { useModalScrollLock } from "../../../hooks/useModalScrollLock.js";

export default function SearchHistoryModal({ history, onSelectMicrochip, formatDateTime, onClose }) {
  const scrollRef = useModalScrollLock(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" style={{ touchAction: "none" }} onClick={onClose}>
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-win-surface max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-teal-500 to-cyan-400 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 text-white">
            <History className="w-4 h-4" />
            <span className="font-semibold text-sm">Τελευταίες Αναζητήσεις</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="overflow-y-auto p-2"
          style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
        >
          {history?.length > 0 ? (
            <SearchHistoryList
              history={history}
              onSelectMicrochip={(chip) => { onSelectMicrochip(chip); onClose(); }}
              formatDateTime={formatDateTime}
            />
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">
              Δεν υπάρχουν προηγούμενες αναζητήσεις.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
