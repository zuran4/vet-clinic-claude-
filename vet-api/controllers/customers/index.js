// ===============================================
// 📄 controllers/customers/index.js
// Περιγραφή: Κεντρικό export για όλα τα customer controllers
// ===============================================

// 🧩 Customer βασικές λειτουργίες
export { getAllCustomers } from "./getAllCustomers.js";
export { getCustomerById } from "./getCustomerById.js";
export { createCustomer } from "./createCustomer.js";
export { updateCustomer } from "./updateCustomer.js";
export { deleteCustomer } from "./deleteCustomer.js";

// 🔎 Search (re-export default as named)
export { searchCustomers } from "./searchCustomers.js";

// 🛒 Purchases (υποφάκελος)
export { createPurchase } from "./purchases/createPurchase.js";
export { getCustomerPurchases } from "./purchases/getPurchases.js";
export { deleteCustomerPurchase } from "./purchases/deletePurchase.js";
