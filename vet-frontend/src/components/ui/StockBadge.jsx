import React from "react";
import { getStockStatus } from "@/utils/stock.js";

/**
 * Badge ποσότητας με χρώμα ανά στάθμη.
 * Δέχεται optional `config` (π.χ. { low: 10, ok: 30 }) για overrides.
 */
export default function StockBadge({ qty, config }) {
  const { key, label } = getStockStatus(qty, config);

  const styles = {
    out:  "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    low:  "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    ok:   "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
    high: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  };

  const cls = styles[key] ?? styles.ok;
  const qtyInt = Math.max(0, Math.trunc(Number(qty ?? 0)));

  return (
    <span
      className={[
        "inline-flex items-center rounded-2xl px-2.5 py-0.5",
        "text-xs font-medium tracking-tight",
        "ring-1 ring-black/5 dark:ring-white/10",
        "select-none tabular-nums",
        cls,
      ].join(" ")}
      title={`${label} • Ποσότητα: ${qtyInt}`}
      aria-label={`${label}, ποσότητα ${qtyInt}`}
    >
      {label}
      <span className="ml-1 opacity-90">{qtyInt}</span>
    </span>
  );
}
