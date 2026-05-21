export function getProductQuantity(product) {
  if (product?.batches?.length > 0) {
    return product.batches.reduce((sum, b) => sum + Number(b.quantity || 0), 0);
  }
  return Number(product?.quantity || 0);
}

export function applyFIFO(product, takeQty) {
  let remaining = takeQty;

  product.batches.sort((a, b) => {
    const ea = a.expirationDate ? new Date(a.expirationDate).getTime() : Infinity;
    const eb = b.expirationDate ? new Date(b.expirationDate).getTime() : Infinity;
    return ea - eb;
  });

  for (const batch of product.batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantity, remaining);
    batch.quantity -= take;
    remaining -= take;
  }

  product.batches = product.batches.filter(b => b.quantity > 0);

  if (remaining > 0) {
    const err = new Error("Insufficient stock after FIFO");
    err.code = 409;
    throw err;
  }
}
