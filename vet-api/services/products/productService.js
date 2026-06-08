import Product from "../../models/Product.js";
import ApiError from "../../utils/apiError.js";
import logger from "../../utils/logger.js";
import mongoose from "mongoose";

import { getProductQuantity, applyFIFO } from "./stockService.js";

export async function listAll(search = "") {
  const matchStage = search
    ? { $match: { $or: [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ]}}
    : null;

  const pipeline = [
    ...(matchStage ? [matchStage] : []),
    { $sort: { name: 1 } },
    {
      $project: {
        _id: 1,
        name: 1,
        category: 1,
        barcode: 1,
        supplier: 1,
        unit: 1,
        threshold: 1,
        retailPrice: 1,
        expirationWarningDays: 1,
        batches: 1,
        createdAt: 1,
        updatedAt: 1,

        // πόσες παρτίδες έχει (για εμφάνιση expand στη λίστα)
        batchesCount: { $size: { $ifNull: ["$batches", []] } },

        // συνολική ποσότητα
        stockTotal: {
          $let: {
            vars: { bs: { $ifNull: ["$batches", []] } },
            in: {
              $cond: [
                { $gt: [{ $size: "$$bs" }, 0] },
                { $sum: { $map: { input: "$$bs", as: "b", in: { $ifNull: ["$$b.quantity", 0] } } } },
                { $ifNull: ["$quantity", 0] }
              ]
            }
          }
        }
      }
    },
    { $addFields: { quantity: "$stockTotal" } }
  ];

  const items = await Product.aggregate(pipeline).exec();
  return items;
}


export async function getById(id) {
  const [doc] = await Product.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $project: {
        name: 1,
        category: 1,
        barcode: 1,
        supplier: 1,
        unit: 1,
        threshold: 1,
        retailPrice: 1,
        expirationWarningDays: 1,
        notes: 1,
        createdAt: 1,
        updatedAt: 1,
        batches: 1, // κράτα το αν το χρειάζεσαι στο UI για expand
        stockTotal: {
          $let: {
            vars: { bs: { $ifNull: ["$batches", []] } },
            in: {
              $cond: [
                { $gt: [{ $size: "$$bs" }, 0] },
                { $sum: { $map: { input: "$$bs", as: "b", in: { $ifNull: ["$$b.quantity", 0] } } } },
                { $ifNull: ["$quantity", 0] }
              ]
            }
          }
        }
      }
    },
    { $addFields: { quantity: "$stockTotal" } },
    { $limit: 1 }
  ]).exec();

  if (!doc) throw new ApiError(404, "Το προϊόν δεν βρέθηκε");
  return doc;
}

export async function create(data) {
  const newProduct = new Product(data);
  const saved = await newProduct.save();
  logger.info(`✅ Δημιουργήθηκε νέο προϊόν: ${saved.name}`);
  return { ...saved.toObject(), quantity: getProductQuantity(saved) };
}

export async function update(id, data) {
  const updated = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!updated) throw new ApiError(404, "Το προϊόν δεν βρέθηκε");
  return { ...updated.toObject(), quantity: getProductQuantity(updated) };
}

export async function remove(id) {
  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Το προϊόν δεν βρέθηκε");
  logger.info(`🗑️ Διαγράφηκε προϊόν: ${deleted.name}`);
  return true;
}

/**
 * GET batches as array (κρατάμε shape για συμβατότητα με UI)
 */
export async function getBatches(id) {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, "Το προϊόν δεν βρέθηκε");
  return product.batches || [];
}

/**
 * Overwrite batches (παλιό flow). Παραμένει για συμβατότητα.
 * Το μοντέλο θα συγχρονίσει το quantity στο save.
 */
export async function setBatches(id, batches) {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, "Το προϊόν δεν βρέθηκε");
  product.batches = batches || [];
  await product.save();
  return { ...product.toObject(), quantity: getProductQuantity(product) };
}

/**
 * Εξαγωγή αποθέματος:
 * - Αν υπάρχουν batches -> ΠΑΝΤΑ applyFIFO σε batches
 * - Αλλιώς -> μειώνουμε το product.quantity
 * Το μοντέλο/Hook θα συγχρονίσει σωστά το τελικό quantity.
 */
export async function exportStock({ productId, quantity }) {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Το προϊόν δεν βρέθηκε");

  const total = getProductQuantity(product);
  if (total < quantity) throw new ApiError(409, "Δεν υπάρχει αρκετό απόθεμα");

  if (product.batches && product.batches.length > 0) {
    // FIFO κατανάλωση από παρτίδες για ΟΛΕΣ τις κατηγορίες όταν υπάρχουν batches
    applyFIFO(product, quantity);
  } else {
    // Χωρίς παρτίδες -> άμεση αφαίρεση ποσότητας
    product.quantity = (Number(product.quantity) || 0) - quantity;
  }

  await product.save();

  logger.info(`📤 Εξαγωγή ${quantity} από προϊόν: ${product.name}`);
  return { ...product.toObject(), quantity: getProductQuantity(product) };
}
