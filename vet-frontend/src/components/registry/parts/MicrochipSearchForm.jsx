import React from "react";
import { Loader2, Search, Clock } from "lucide-react";

export default function MicrochipSearchForm({
  microchip,
  onChangeMicrochip,
  onSubmit,
  isLoading,
  existingSearch,
  formatDateTime,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            id="registry-microchip"
            type="text"
            value={microchip}
            onChange={(e) => onChangeMicrochip(e.target.value)}
            placeholder="Αριθμός microchip..."
            className="block w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-win-elevated pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-win-elevated focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Αναζήτηση"}
        </button>
      </div>

      {existingSearch && (
        <p className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
          <Clock className="h-3 w-3" />
          Έχει ξανααναζητηθεί{" "}
          {existingSearch.lastSearchedAt ? `στις ${formatDateTime(existingSearch.lastSearchedAt)}` : "στο παρελθόν"}
        </p>
      )}
    </form>
  );
}
