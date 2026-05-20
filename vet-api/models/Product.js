import mongoose from "mongoose";

function sumBatches(batches = []) {
  return batches.reduce((sum, b) => sum + (Number(b?.quantity) || 0), 0);
}

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ["Φάρμακο", "Τροφή", "Παιχνίδι", "Αξεσουάρ", "Άλλο"],
      default: "Άλλο",
    },
    barcode: { type: String, unique: true, sparse: true },

    // Συνολική ποσότητα που εμφανίζουμε στη λίστα
    quantity: { type: Number, default: 0 },

    threshold: { type: Number, default: 5 },
    unit: { type: String },

    // Προαιρετικά σε επίπεδο προϊόντος
    expirationDate: { type: Date },
    expirationWarningDays: { type: Number, default: 30 },

    notes: { type: String },

    // 📦 Παρτίδες προϊόντος
    batches: [
      {
        batchNumber: { type: String },
        quantity: { type: Number, default: 0 },
        purchaseDate: { type: Date },
        expirationDate: { type: Date },
        invoiceNumber: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// 🔹 Virtual: υπολογισμένη ποσότητα από batches (fallback στο quantity)
productSchema.virtual("calculatedQuantity").get(function () {
  if (!this.batches || this.batches.length === 0) return this.quantity || 0;
  return sumBatches(this.batches);
});

// 🔹 Να εμφανίζονται τα virtuals
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

// 🔹 Sync quantity πριν από save (πιάνει create/save)
productSchema.pre("save", function (next) {
  if (Array.isArray(this.batches) && this.batches.length > 0) {
    this.quantity = sumBatches(this.batches);
  }
  next();
});

// 🔹 Sync quantity και μετά από findOneAndUpdate / $push
productSchema.post("findOneAndUpdate", async function (doc) {
  if (!doc) return;
  if (Array.isArray(doc.batches) && doc.batches.length > 0) {
    const newQty = sumBatches(doc.batches);
    if (doc.quantity !== newQty) {
      doc.quantity = newQty;
      await doc.save();
    }
  }
});

const Product = mongoose.model("Product", productSchema);
export default Product;
