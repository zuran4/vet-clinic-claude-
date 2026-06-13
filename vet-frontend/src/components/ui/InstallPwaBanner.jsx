import React from "react";
import { Download, X, Share } from "lucide-react";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";

// 📲 Banner που προτείνει εγκατάσταση του Vetpro ως PWA στο κινητό
export default function InstallPwaBanner() {
  const { canInstall, isIos, promptInstall, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 safe-bottom sm:hidden">
      <div className="bg-white dark:bg-win-surface border border-gray-200 dark:border-win-border rounded-xl shadow-lg p-3 flex items-center gap-3">
        <img
          src="/logo192.png"
          alt="Vetpro"
          className="w-10 h-10 rounded-lg flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
            Εγκατάσταση εφαρμογής Vetpro
          </p>
          {isIos ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Πατήστε <Share className="inline w-3.5 h-3.5 -mt-0.5" /> και
              μετά "Προσθήκη στην Αρχική Οθόνη"
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Προσθήκη στην αρχική οθόνη για ταχύτερη πρόσβαση
            </p>
          )}
        </div>
        {!isIos && (
          <button
            onClick={promptInstall}
            className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark flex items-center gap-1 flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            Εγκατάσταση
          </button>
        )}
        <button
          onClick={dismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
          aria-label="Κλείσιμο"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
