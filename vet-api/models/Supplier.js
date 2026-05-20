import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Όνομα προμηθευτή
    phone: { type: String },                // Τηλέφωνο
    email: { type: String },                // Email
    address: { type: String },              // Διεύθυνση
    notes: { type: String },                // Σημειώσεις
  },
  { timestamps: true }
);

const Supplier = mongoose.model("Supplier", supplierSchema);
export default Supplier;
