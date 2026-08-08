// models/Message.js
//
// Ενιαία "αλληλογραφία" (Messages section) — γενικό σχήμα ανά κανάλι
// (channel), ώστε να μπορούν να προστεθούν WhatsApp/SMS/Messenger αργότερα
// χωρίς αλλαγή στο schema. Προς το παρόν μόνο channel="email".
//
// Δεν υπάρχει ξεχωριστό "Conversation" μοντέλο — τα μηνύματα ομαδοποιούνται
// δυναμικά στο query, ανά (channel, counterpart).
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ["email", "whatsapp"],
      required: true,
      index: true,
    },

    // Η "άλλη πλευρά" της συνομιλίας (π.χ. email address του πελάτη/αποστολέα).
    // Χρησιμοποιείται για ομαδοποίηση σε threads.
    counterpart: { type: String, required: true, trim: true, lowercase: true, index: true },
    counterpartName: { type: String, default: "" },

    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },

    direction: { type: String, enum: ["inbound", "outbound"], required: true },

    subject: { type: String, default: "" },
    text: { type: String, default: "" },
    html: { type: String, default: "" },

    // Email threading headers (Message-ID/In-Reply-To) — ώστε οι απαντήσεις
    // μας να εμφανίζονται σωστά ως thread στο mail client του παραλήπτη.
    messageId: { type: String, default: "" },
    inReplyTo: { type: String, default: "" },

    // Εσωτερική κατάσταση "διαβασμένο" — ΔΕΝ αγγίζει το πραγματικό mailbox
    // (δεν κάνουμε ποτέ mark-as-read εκεί), μόνο για το UI του Vetty.
    read: { type: Boolean, default: false },

    receivedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

messageSchema.index({ channel: 1, counterpart: 1, receivedAt: -1 });
// Αποτρέπει διπλοεγγραφή του ίδιου εισερχόμενου email σε επόμενο IMAP poll.
messageSchema.index(
  { channel: 1, messageId: 1 },
  { unique: true, partialFilterExpression: { messageId: { $type: "string", $ne: "" } } }
);

export { messageSchema };
const Message = mongoose.model("Message", messageSchema);
export default Message;
