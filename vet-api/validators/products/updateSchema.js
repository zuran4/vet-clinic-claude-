import Joi from "joi";

const batchSchema = Joi.object({
  batchNumber: Joi.string().trim().allow(""),
  quantity: Joi.number().integer().min(0).default(0),
  purchaseDate: Joi.date().optional(),
  expirationDate: Joi.date().optional(),
  invoiceNumber: Joi.string().trim().allow(""),
});

export default Joi.object({
  name: Joi.string().trim().min(2),
  category: Joi.string().valid("Φάρμακο", "Τροφή", "Αξεσουάρ", "Παιχνίδι", "Άλλο"),
  barcode: Joi.string().trim().empty("").optional(),
  quantity: Joi.number().integer().min(0),
  threshold: Joi.number().integer().min(0),
  unit: Joi.string().trim().allow(""),
  expirationDate: Joi.date().optional(),
  expirationWarningDays: Joi.number().integer().min(0),
  retailPrice: Joi.number().min(0).allow(null),
  notes: Joi.string().trim().allow(""),
  supplier: Joi.string().trim().allow(""),
  batches: Joi.array().items(batchSchema),
  manualReorder: Joi.boolean(),
}).min(1);
