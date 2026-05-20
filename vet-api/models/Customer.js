import mongoose from "mongoose";

// 🧩 Υπομοντέλο για αγορές
const purchaseSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, default: 1 },
    date: { type: Date, default: Date.now },
  },
  { _id: true } // δημιουργεί _id σε κάθε εγγραφή του purchases[]
);

// 🧩 Κύριο schema πελάτη
const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
      // unique: true, // προαιρετικό: ενεργοποίησέ το μόνο αν έχεις καθαρίσει διπλότυπα
    },
    email: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },

    // Ρυθμίσεις ειδοποιήσεων πελάτη
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      reminders: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
    },

    // Ιστορικό αγορών
    purchases: [purchaseSchema],
  },
  {
    timestamps: true, // αυτόματα createdAt & updatedAt
  }
);

// 🔎 Indexes για ταχύτερα queries & search
customerSchema.index({ name: 1, phone: 1 });

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
