import mongoose from "mongoose";
import { normalizeGreek } from "../utils/greekNormalize.js";
import { toDisplayName } from "../utils/greekNames.js";

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
    // 🔎 Κανονικοποιημένη μορφή του name (χωρίς τόνους, ομόηχα ενοποιημένα)
    // — γεμίζει αυτόματα (pre-save / pre-findOneAndUpdate hook παρακάτω).
    // Χρησιμοποιείται ΜΟΝΟ για αναζήτηση, ποτέ δεν εμφανίζεται στο UI.
    nameNormalized: {
      type: String,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
      // unique: true, // προαιρετικό: ενεργοποίησέ το μόνο αν έχεις καθαρίσει διπλότυπα
    },
    // Πρώτη επίσκεψη στο κτηνιατρείο (για reporting/marketing) — ξεχωριστό
    // από το αν υπάρχει ήδη ΕΓΓΡΑΦΗ στο σύστημα (π.χ. μπορεί να καταχωρείται
    // τώρα ένας παλιός πελάτης που δεν ήταν ποτέ στο πρόγραμμα).
    isNewCustomer: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    afm: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },

    // ⚠️ Μόνιμη προειδοποίηση για τον πελάτη (π.χ. περίεργη συμπεριφορά) —
    // παραμένει ορατή σε κάθε μελλοντικό ραντεβού, ανεξάρτητα από τα γενικά notes.
    alert: {
      type: String,
      trim: true,
      maxlength: 500,
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

// 🔹 Συγχρονισμός nameNormalized σε κάθε save (create/save)
customerSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.name = toDisplayName(this.name);
    this.nameNormalized = normalizeGreek(this.name);
  }
  next();
});

// 🔹 Διόρθωση εμφάνισης + συγχρονισμός nameNormalized και σε
// findOneAndUpdate/findByIdAndUpdate (δεν περνάνε από το pre("save") hook παραπάνω)
customerSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() || {};
  const newName = update.name ?? update.$set?.name;
  if (newName != null) {
    const displayName = toDisplayName(newName);
    this.set({ name: displayName, nameNormalized: normalizeGreek(displayName) });
  }
  next();
});

export { customerSchema };
const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
