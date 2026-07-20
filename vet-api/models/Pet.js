import mongoose from "mongoose";

const petSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
    index: true, // ✅ για πιο γρήγορα queries ανά ιδιοκτήτη
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true, // ✅ για γρήγορη αναζήτηση με όνομα
  },
  species: {
    type: String,
    required: true,
    enum: ["Σκύλος", "Γάτα", "Κουνέλι", "Πτηνό", "Άλλο"],
    default: "Σκύλος",
  },
  gender: {
    type: String,
    enum: ["Αρσενικό", "Θηλυκό"],
    required: true,
  },
  birthDate: {
    type: Date,
  },
  microchip: {
    type: String,
    trim: true,
    unique: true, // ✅ κάθε microchip πρέπει να είναι μοναδικό
    sparse: true, // επιτρέπει κενές τιμές
  },
  neutered: {
    type: Boolean,
    default: false,
  },
  vaccinated: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    trim: true,
  },

  // ⚠️ Μόνιμη προειδοποίηση για το κατοικίδιο (π.χ. δαγκώνει) — παραμένει
  // ορατή σε κάθε μελλοντικό ραντεβού, ανεξάρτητα από τα γενικά notes.
  alert: {
    type: String,
    trim: true,
    maxlength: 500,
  },

  // ✅ Ιστορικό ενεργειών
  history: [
    {
      date: { type: Date, default: Date.now },
      category: { type: String, enum: ["Ιατρείο", "Grooming"], default: "Ιατρείο" },
      reason: { type: String, required: true },
      result: { type: String },
      weight: { type: Number },       // kg
      temperature: { type: Number },  // °C
      heartRate: { type: Number },    // bpm
      diagnosis: { type: String },
      treatment: { type: String },
      nextVisit: { type: Date },
      vet: { type: String },
    },
  ],

  // ✅ Συνημμένα αρχεία (έγγραφα, φωτογραφίες, εξετάσεις κλπ)
  files: [
    {
      name: { type: String, required: true, trim: true },
      url: { type: String, required: true },
      filename: { type: String, required: true },
      mimeType: { type: String },
      size: { type: Number },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],

  registrySnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  registrySnapshotAt: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Index για αναζήτηση με όνομα + ιδιοκτήτη
petSchema.index({ name: 1, owner: 1 });

export { petSchema };
const Pet = mongoose.model("Pet", petSchema);
export default Pet;
