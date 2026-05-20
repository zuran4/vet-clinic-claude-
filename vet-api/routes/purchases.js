import express from "express";

import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Purchase from "../models/Purchase.js"; // 🆕 νέο μοντέλο

const router = express.Router();

// POST /api/purchases
router.post("/", async (req, res) => {
  try {
    const { customerId, items } = req.body; 
    // items = [ { productId, quantity } ]

    if (!customerId || !items || items.length === 0) {
      return res.status(400).json({ error: "Λείπουν στοιχεία αγοράς" });
    }

    // Βρίσκουμε τον πελάτη
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
        return res
          .status(400)
          .json({ error: `Μη επαρκές απόθεμα για ${product.name}` });
      }

      // ✅ Αφαιρούμε από το σωστό πεδίο
      product.quantity -= item.quantity;
      await product.save();

      updatedProducts.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
      });
    }

    // Δημιουργούμε καταγραφή αγοράς
    const purchase = new Purchase({
      customer: customer._id,
      items: updatedProducts,
    });
    await purchase.save();

    res.json({ message: "Η αγορά καταχωρήθηκε", purchase });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Σφάλμα στον server" });
  }
});

export default router;
