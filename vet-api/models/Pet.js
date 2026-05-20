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
    enum: ["Σκύλος", "Γάτα", "Άλλο"],
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

  // ✅ Ιστορικό ενεργειών
  history: [
    {
      date: { type: Date, default: Date.now },
      reason: { type: String, required: true }, // λόγος επίσκεψης
      result: { type: String }, // τι έγινε / διάγνωση / αποτέλεσμα
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Index για αναζήτηση με όνομα + ιδιοκτήτη
petSchema.index({ name: 1, owner: 1 });

const Pet = mongoose.model("Pet", petSchema);
export default Pet;
