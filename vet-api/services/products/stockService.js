/** Υπολογίζει το διαθέσιμο απόθεμα. Αν υπάρχουν batches, αθροίζει qty, αλλιώς παίρνει το quantity πεδίο. */
export function getProductQuantity(product) {
  if (product?.batches?.length > 0) {
    return product.batches.reduce((sum, b) => sum + Number(b.qty || 0), 0);
  }
  return Number(product.quantity || 0);
}

/** Εφαρμογή FIFO στα batches με βάση expiry (παλαιότερη ημερομηνία πρώτα, undefined στο τέλος). */
export function applyFIFO(product, takeQty) {
  let remaining = takeQty;

  product.batches.sort((a, b) => {
    const ea = a.expiry ? new Date(a.expiry).getTime() : Infinity;
    const eb = b.expiry ? new Date(b.expiry).getTime() : Infinity;
    return ea - eb;
  });

  for (const batch of product.batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.qty, remaining);
    batch.qty -= take;
    remaining -= take;
  }

  product.batches = product.batches.filter(b => b.qty > 0);

  if (remaining > 0) {
    const err = new Error("Insufficient stock after FIFO");
    err.code = 409;
    throw err;
  }
}
