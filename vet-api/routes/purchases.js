import express from "express";

import requirePermission from "../middlewares/auth/requirePermission.js";
import logger from "../utils/logger.js";

const router = express.Router();

router.post("/", requirePermission("purchases:write"), async (req, res) => {
  try {
    const { Product, Customer, Purchase } = req.models;
    const { customerId, items } = req.body;

    if (!customerId || !items || items.length === 0) {
      return res.status(400).json({ error: "Λείπουν στοιχεία αγοράς" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: "Ο πελάτης δεν βρέθηκε" });
    }

    const updatedProducts = [];

    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: "Προϊόν δεν βρέθηκε" });
      }

      if (product.quantity < item.quantity) {
        logger.warn(`⚠️ Απόπειρα αγοράς με ανεπαρκές απόθεμα: ${product.name} (ζητήθηκαν ${item.quantity}, διαθέσιμα ${product.quantity})`, { requestId: req.requestId, clinicId: req.clinicId });
        return res.status(400).json({ error: `Μη επαρκές απόθεμα για ${product.name}` });
      }

      product.quantity -= item.quantity;
      await product.save();

      updatedProducts.push({ product: product._id, name: product.name, quantity: item.quantity });
    }

    const purchase = new Purchase({ customer: customer._id, items: updatedProducts });
    await purchase.save();

    res.json({ message: "Η αγορά καταχωρήθηκε", purchase });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Σφάλμα στον server" });
  }
});

export default router;
