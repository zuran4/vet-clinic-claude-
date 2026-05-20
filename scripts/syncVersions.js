/**
 * 🔄 VET Project – Documentation Version Sync Script
 * Ενημερώνει αυτόματα όλα τα markdown (.md) αρχεία στο φάκελο /docs/
 * αλλάζοντας την έκδοση (Version) και την ημερομηνία (Date).
 */

import fs from "fs";
import path from "path";

// 📂 Φάκελος με τα markdown αρχεία
const docsDir = path.resolve("./docs");

// 🧩 Έλεγχος αν υπάρχει ο φάκελος
if (!fs.existsSync(docsDir)) {
  console.error("❌ Δεν βρέθηκε φάκελος /docs στη ρίζα του project!");
  process.exit(1);
}

// 📜 Εύρεση όλων των .md αρχείων
const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".md"));

if (files.length === 0) {
  console.log("⚠️ Δεν βρέθηκαν αρχεία .md για ενημέρωση.");
  process.exit(0);
}

// 🔢 Καθορισμός νέας έκδοσης & ημερομηνίας
const newVersion = "1.2";
const today = new Date().toISOString().split("T")[0];

console.log(`🚀 Ενημέρωση αρχείων τεκμηρίωσης σε Version ${newVersion} (${today})`);
console.log("------------------------------------------------------");

// 🔁 Ενημέρωση όλων των αρχείων
files.forEach((file) => {
  const filePath = path.join(docsDir, file);
  let content = fs.readFileSync(filePath, "utf8");

  // Αντικατάσταση όλων των εμφανίσεων Version και Date
  const newContent = content
    .replace(/Version:\\s*([0-9.]+)/g, `Version: ${newVersion}`)
    .replace(/Date:\\s*[0-9-]+/g, `Date: ${today}`);

  // Αποθήκευση αλλαγών
  fs.writeFileSync(filePath, newContent, "utf8");

  console.log(`✅ Updated ${file}`);
});

console.log("------------------------------------------------------");
console.log(`🎯 Όλα τα markdown αρχεία ενημερώθηκαν επιτυχώς!`);
