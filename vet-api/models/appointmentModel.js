import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  phone: String,
  animalName: { type: String, required: true },
  type: {
    type: [String],
    required: true,
    validate: { validator: (v) => Array.isArray(v) && v.length > 0, message: "Απαιτείται τουλάχιστον ένας τύπος ραντεβού." },
  },
  duration: { type: Number, required: true, default: 30 },
  notes: String,
  doctor: { type: String, default: "Ιατρείο" },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  time: { type: String, required: true }, // "HH:mm"
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
});

// ⚡ Index για γρήγορα same-day/same-doctor queries και ταξινόμηση ανά ώρα
appointmentSchema.index({ date: 1, doctor: 1, time: 1 });

export { appointmentSchema };
const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;
