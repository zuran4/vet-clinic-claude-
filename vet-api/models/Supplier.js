import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true }, // Επωνυμία προμηθευτή
    contact: { type: String },                 // Υπεύθυνος επικοινωνίας
    phone:   { type: String },                 // Τηλέφωνο
    email:   { type: String },                 // Email
    website: { type: String },                 // Ιστότοπος
    address: { type: String },                 // Διεύθυνση
    notes:   { type: String },                 // Σημειώσεις
  },
  { timestamps: true }
);

export { supplierSchema };
const Supplier = mongoose.model("Supplier", supplierSchema);
export default Supplier;
