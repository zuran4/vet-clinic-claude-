import mongoose from "mongoose";

// Αποθηκεύεται στο vetAdmin DB — ένα record ανά κλινική
const tenantSchema = new mongoose.Schema(
  {
    clinicId:   { type: String, required: true, unique: true, trim: true, lowercase: true },
    clinicName: { type: String, required: true, trim: true },
    dbName:     { type: String, required: true },  // π.χ. "vetClinic_papadopoulos"
    isActive:   { type: Boolean, default: true, index: true },
    ownerEmail: { type: String, trim: true, default: "" },
    ownerPhone: { type: String, trim: true, default: "" },
    plan:       { type: String, enum: ["trial", "basic", "pro"], default: "trial" },
    trialEndsAt: { type: Date, default: null },

    // Κάθε κλινική τρέχει τον δικό της registry-worker process (Playwright,
    // login στο gov.gr) σε ξεχωριστό port — πλήρης απομόνωση session/ταυτότητας
    // μεταξύ κλινικών. Ανατίθεται αυτόματα στο provisioning.
    registryWorkerPort: { type: Number, default: null, unique: true, sparse: true },

    // Επιχειρηματικά/τιμολόγησης στοιχεία
    companyName: { type: String, trim: true, default: "" },
    vatNumber:   { type: String, trim: true, default: "" },
    taxOffice:   { type: String, trim: true, default: "" },
    address:     { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// Χρησιμοποιείται μόνο από admin connection — δεν γίνεται register στο default mongoose
export { tenantSchema };
export default tenantSchema;
