import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    // Τι να θυμίσουμε
    note: {
      type: String,
      default: "",
    },

    // Ονόματα προϊόντων (για το email)
    productNames: {
      type: [String],
      default: [],
    },

    // Πότε να σταλεί
    reminderDate: {
      type: Date,
      required: true,
    },

    // Έχει σταλεί;
    sent: {
      type: Boolean,
      default: false,
    },

    sentAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index για γρήγορη εύρεση ανεξάρτητων reminders
reminderSchema.index({ reminderDate: 1, sent: 1 });

export { reminderSchema };
const Reminder = mongoose.model("Reminder", reminderSchema);
export default Reminder;
