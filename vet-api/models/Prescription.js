import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    // 🔗 Σύνδεση με Pet
    animalId: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true },

    // 📝 Κρατάμε και το όνομα για γρήγορη εμφάνιση (snapshot)
    animalName: { type: String, required: true },

    // 👤 Πελάτης (snapshot για συνταγή)
    clientName: { type: String, required: true },

    // 💊 Λίστα φαρμάκων
    medicines: {
      type: [String],
      required: true, // π.χ. ["Augmentin", "Prednisolone"]
    },

    dosage: { type: String },       // Δοσολογία
    notes: { type: String },        // Σημειώσεις
    instructions: { type: String }, // Οδηγίες

    doctor: { type: String }, // Γιατρός (μελλοντικά ref σε User)

    // 📅 Ημερομηνία συνταγής
    date: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true } // createdAt, updatedAt αυτόματα
);

export { prescriptionSchema };
const Prescription = mongoose.model("Prescription", prescriptionSchema);
export default Prescription;
