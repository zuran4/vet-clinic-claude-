import logger from "../utils/logger.js";

/**
 * ✅ Υπολογίζει τη διαθέσιμη ποσότητα ενός προϊόντος.
 * Αν είναι "Τροφή", χρησιμοποιεί τα batches.
 * Αν είναι άλλο είδος, επιστρέφει το quantity πεδίο.
 */
export function getProductQuantity(product) {
  if (!product) {
    logger.warn("⚠️ Κλήση getProductQuantity χωρίς προϊόν");
    return 0;
  }

  if (product.category === "Τροφή") {
    const total = Array.isArray(product.batches)
      ? product.batches.reduce((sum, b) => sum + (b.quantity || 0), 0)
      : 0;

    logger.info(`📦 Υπολογισμός ποσότητας (Τροφή): ${product.name} = ${total}`);
    return total;
  }

  logger.info(`📦 Υπολογισμός ποσότητας: ${product.name} = ${product.quantity || 0}`);
  return product.quantity || 0;
}

/**
 * ✅ Εφαρμόζει FIFO για προϊόντα τύπου "Τροφή" με batches.
 * Μειώνει τις ποσότητες παρτίδων με τη σωστή σειρά.
 */
export function applyFIFO(product, quantityToRemove) {
  if (!product || product.category !== "Τροφή" || !Array.isArray(product.batches)) {
    logger.warn("⚠️ Απόπειρα FIFO σε προϊόν χωρίς batches ή μη 'Τροφή'");
    return;
  }

  let remaining = quantityToRemove;
  logger.info(`🔄 Εφαρμογή FIFO για προϊόν: ${product.name}, ποσότητα: ${remaining}`);

  for (let batch of product.batches) {
    if (remaining <= 0) break;
    if (batch.quantity > 0) {
      const take = Math.min(batch.quantity, remaining);
      logger.info(
        `➡️ Παρτίδα ${batch.batchNumber || "(χωρίς αριθμό)"}: -${take} τεμάχια`
      );
      batch.quantity -= take;
      remaining -= take;
    }
  }

  if (remaining > 0) {
    logger.warn(
      `⚠️ Το FIFO ολοκληρώθηκε, αλλά λείπουν ${remaining} τεμάχια στο προϊόν ${product.name}`
    );
  } else {
    logger.info(`✅ FIFO ολοκληρώθηκε για ${product.name}`);
  }
}
