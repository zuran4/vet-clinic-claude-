import dayjs from "dayjs";

// ✅ Υπολογισμός συνολικού αποθέματος από batches
export const getTotalBatchQuantity = (product) => {
  if (Array.isArray(product.batches) && product.batches.length > 0) {
    return product.batches.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
  }
  return Number(product.quantity) || 0;
};

// ✅ Πιο κοντινή ημερομηνία λήξης
export const getNearestBatchExpiration = (product) => {
  if (Array.isArray(product.batches) && product.batches.length > 0) {
    const sorted = [...product.batches]
      .filter((b) => b.expirationDate)
      .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
    return sorted[0]?.expirationDate || null;
  }
  return product.expirationDate || null;
};

// ✅ Αν έχει ληγμένη παρτίδα
export const hasExpiredBatch = (product) => {
  const batches = Array.isArray(product.batches) ? product.batches : [];
  const now = dayjs();
  return batches.some(
    (b) => b.expirationDate && dayjs(b.expirationDate).isBefore(now, "day")
  );
};

// ✅ Αν έχει παρτίδα που λήγει σύντομα
export const hasExpiringSoonBatch = (product, days) => {
  const batches = Array.isArray(product.batches) ? product.batches : [];
  const now = dayjs();
  return batches.some(
    (b) =>
      b.expirationDate &&
      dayjs(b.expirationDate).isBefore(now.add(days, "day"), "day") &&
      !dayjs(b.expirationDate).isBefore(now, "day")
  );
};

// ✅ Χρώμα γραμμής πίνακα
export const getRowColor = (product) => {
  const totalQty = getTotalBatchQuantity(product);
  const threshold = Number(product.threshold) || 0;
  const nearestExpiry = getNearestBatchExpiration(product);
  const now = dayjs();

  const isLowStock = totalQty < threshold;
  const isOut = totalQty === 0;
  const isExpired = nearestExpiry && dayjs(nearestExpiry).isBefore(now, "day");

  if (isOut) return "bg-gray-100";
  if (!product.barcode) return "bg-purple-100";
  if (isExpired) return "bg-rose-100";
  if (isLowStock) return "bg-red-100";
  return "bg-green-100";
};

// ✅ Tooltip
export const getRowTooltip = (product) => {
  const totalQty = getTotalBatchQuantity(product);
  const threshold = Number(product.threshold) || 0;
  const nearestExpiry = getNearestBatchExpiration(product);
  const now = dayjs();

  if (totalQty === 0) return "Εκτός αποθέματος";
  if (!product.barcode) return "Δεν έχει barcode";
  if (nearestExpiry && dayjs(nearestExpiry).isBefore(now, "day")) return "Έχει λήξει";
  if (totalQty < threshold) return "Χαμηλό απόθεμα";
  if (nearestExpiry && dayjs(nearestExpiry).isBefore(now.add(30, "day"), "day"))
    return "Λήγει σύντομα";

  return "Κανονική κατάσταση";
};

// ✅ Διαβάζει μέρες προειδοποίησης από το προϊόν
export const getExpiryWarningDays = (product) => {
  const raw =
    product?.expiryWarningDays ??
    product?.expirationWarningDays ??
    product?.expiryNotifyDays;

  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 30; // default 30
};

// ✅ Μετατροπή ημερομηνίας σε ISO (π.χ. "20/06/2025" → "2025-06-20")
export const toISODate = (val) => {
  if (!val) return null;
  const s = String(val).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }
  return s.slice(0, 10);
};

// ✅ Καθάρισμα παρτίδων πριν αποστολή στο backend
export const cleanBatches = (list) => {
  return (list || [])
    .filter(
      (b) =>
        b &&
        (b.batchNumber ||
          b.expirationDate ||
          b.expiryDate ||
          b.quantity === 0 ||
          b.quantity > 0)
    )
    .map((b) => {
      const quantity = Number(b.quantity ?? b.qty ?? 0);
      const expirationDate = toISODate(b.expirationDate || b.expiryDate);
      const purchaseDate = b.purchaseDate ? toISODate(b.purchaseDate) : null;
      const invoiceNumber = (b.invoiceNumber ?? "").trim() || undefined;

      return {
        _id: b._id,
        batchNumber: (b.batchNumber ?? "").trim() || undefined,
        quantity: Number.isNaN(quantity) ? 0 : quantity,
        expirationDate,
        purchaseDate,
        invoiceNumber,
      };
    })
    .filter((b) => b.quantity >= 0);
};
