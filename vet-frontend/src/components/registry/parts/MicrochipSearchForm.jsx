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
    <form
      onSubmit={onSubmit}
      className="grid gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 sm:grid-cols-[minmax(0,1.6fr)_auto] sm:px-4 sm:py-4"
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="registry-microchip"
          className="text-[11px] font-medium uppercase tracking-wide text-slate-500"
        >
          Αριθμός microchip
        </label>

        <div className="relative">
          <input
            id="registry-microchip"
            type="text"
            value={microchip}
            onChange={(e) => onChangeMicrochip(e.target.value)}
            placeholder="Πληκτρολόγησε microchip..."
            className="block w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 pr-9 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Διακριτική ένδειξη ότι έχει ξανααναζητηθεί & πότε */}
        {existingSearch && (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>
              Έχει ξανααναζητηθεί{" "}
              {existingSearch.lastSearchedAt
                ? `στις ${formatDateTime(existingSearch.lastSearchedAt)}`
                : "στο παρελθόν"}
              .
            </span>
          </p>
        )}
      </div>

      <div className="flex items-end sm:justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400 sm:w-auto"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Αναζήτηση…</span>
            </span>
          ) : (
            "Αναζήτηση"
          )}
        </button>
      </div>
    </form>
  );
}
