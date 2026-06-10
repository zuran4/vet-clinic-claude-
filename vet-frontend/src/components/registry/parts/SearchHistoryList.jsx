import React from "react";

export default function SearchHistoryList({ history, onSelectMicrochip, formatDateTime }) {
  if (!Array.isArray(history) || history.length === 0) return null;

  return (
    <ul className="space-y-1">
      {history.slice(0, 5).map((item) => (
        <li key={item.microchip}>
          <button
            type="button"
            onClick={() => onSelectMicrochip(item.microchip)}
            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors group"
          >
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-200 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                {item.microchip}
              </span>
              {(item.petName || item.species) && (
                <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {item.petName
                    ? `${item.petName}${item.species ? ` · ${item.species}` : ""}`
                    : item.species || ""}
                </span>
              )}
            </div>

            {item.lastSearchedAt && (
              <span className="whitespace-nowrap text-[11px] text-gray-300 dark:text-gray-600 group-hover:text-violet-400 dark:group-hover:text-violet-400 flex-shrink-0 transition-colors">
                {formatDateTime(item.lastSearchedAt)}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
