export function getStockStatus(qty, cfg = { low: 5, ok: 20 }) {
  const q = Math.max(0, Math.trunc(Number(qty ?? 0)));
  if (q === 0) return { key: "out", label: "Εξαντλημένο" };
  if (q <= cfg.low) return { key: "low", label: "Χαμηλό" };
  if (q <= cfg.ok) return { key: "ok", label: "Εντάξει" };
  return { key: "high", label: "Υψηλό" };
}
