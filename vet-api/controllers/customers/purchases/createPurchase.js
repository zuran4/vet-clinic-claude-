// ===============================================
// 📄 createPurchase.js
// Περιγραφή: Καταχώρηση αγορών πελάτη και ενημέρωση αποθέματος προϊόντων
// ===============================================

import Customer from "../../../models/Customer.js";
import Product from "../../../models/Product.js";
import ApiError from "../../../utils/apiError.js";
import logger from "../../../utils/logger.js";
import { getProductQuantity, applyFIFO } from "../../../services/products/stockService.js";

// ===============================
// POST /api/customers/:id/purchases
// ===============================
export const createPurchase = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const { products } = req.body;

    // --------------------------------------------
    // 🔹 Έλεγχος λίστας προϊόντων
    // --------------------------------------------
    if (!Array.isArray(products) || products.length === 0) {
      logger.warn("⚠️ Καταχώριση αγοράς χωρίς προϊόντα");
      throw new ApiError(400, "Πρέπει να δοθούν προϊόντα για καταχώριση αγοράς");
    }

    // --------------------------------------------
    // 🔹 Εύρεση πελάτη
    // --------------------------------------------
    const customer = await Customer.findById(customerId);
    if (!customer) {
      logger.warn(`⚠️ Δεν βρέθηκε πελάτης για αγορά (id: ${customerId})`);
      throw new ApiError(404, "Ο πελάτης δεν βρέθηκε");
    }

    // --------------------------------------------
    // 🔹 Διαχείριση προϊόντων & αποθέματος
    // --------------------------------------------
    const purchaseItems = [];

    for (const item of products) {
      const { product: productId, quantity } = item;

      if (!productId || !quantity || quantity < 1) {
        throw new ApiError(400, "Μη έγκυρα προϊόντα/ποσότητες");
      }

      const product = await Product.findById(productId);
      if (!product) {
        throw new ApiError(404, `Προϊόν δεν βρέθηκε (id: ${productId})`);
      }

      const available = getProductQuantity(product);
      if (available < quantity) {
        throw new ApiError(409, `Ανεπαρκές απόθεμα για: ${product.name}`);
      }

      // 🔹 Ενημέρωση αποθέματος (FIFO ή απλό)
      // Σημ.: ο έλεγχος είναι στα batches, όχι στην κατηγορία — το pre("save")
      // hook του Product συγχρονίζει πάντα το quantity από τα batches όταν
      // υπάρχουν, οπότε η απευθείας μείωση του quantity θα ακυρωνόταν.
      if (product.batches?.length > 0) {
        applyFIFO(product, quantity);
      } else {
        product.quantity = (product.quantity || 0) - quantity;
        if (product.quantity < 0) product.quantity = 0;
      }

      await product.save();

      purchaseItems.push({
        product: product._id,
        name: product.name,
        quantity,
      });
    }

    // --------------------------------------------
    // 🔹 Αποθήκευση κάθε προϊόντος ως ξεχωριστή εγγραφή
    // --------------------------------------------
    customer.purchases = customer.purchases || [];
    const now = new Date();
    for (const item of purchaseItems) {
      customer.purchases.push({
        product: item.product,
        quantity: item.quantity,
        date: now,
      });
    }
    await customer.save();

    logger.info(`🛒 Καταχωρήθηκε αγορά για πελάτη ${customer.name}`);

    res.status(201).json({
      message: "✅ Οι αγορές καταχωρήθηκαν επιτυχώς",
    });
  } catch (err) {
    logger.error("❌ Σφάλμα κατά την καταχώριση αγοράς", { stack: err.stack });
    next(
      err instanceof ApiError
        ? err
        : new ApiError(500, "Σφάλμα κατά την καταχώριση αγοράς")
    );
  }
};
