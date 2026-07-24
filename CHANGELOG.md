# Changelog

Αυτόματο ιστορικό αλλαγών του project. Κάθε entry γράφεται αυτόματα μετά από push στο main.

## v1.4.0 — 2026-07-24 (63a0f76)

### Προσθήκη πεδίου μεγέθους συσκευασίας προϊόντων

**🔧 Τεχνική περιγραφή**

- Νέο πεδίο `packageSize` στο μοντέλο `Product` (String, default "") για διάκριση variants (π.χ. "400g", "2kg", "500ml")
- Ενημέρωση `createSchema.js`/`updateSchema.js` (Joi) ώστε να δέχονται το `packageSize`
- Προσθήκη του `packageSize` στα `ALLOWED` πεδία του import προϊόντων (`importProducts.js`)
- Ενημέρωση `productService.js`: αναζήτηση (`$regex`) και `$project` σε `listAll`/`getById` να περιλαμβάνουν `packageSize`
- Frontend: εμφάνιση/επεξεργασία `packageSize` σε `ProductInfoSection`, `ProductList` (πίνακας, mobile view, CSV export, φιλτράρισμα), `ProductExport` (καλάθι & αναζήτηση), `QuickStockModal`
- Βελτιώσεις στο `BarcodeScannerModal.jsx`: warm-up του native `BarcodeDetector` για αποφυγή αποτυχίας στο πρώτο άνοιγμα, και explicit stop των video tracks (`forceStopVideoTracks`) για να μην μένει αναμμένη η κάμερα σε iOS Safari

**🌱 Σε απλά λόγια**

Προστέθηκε η δυνατότητα να καταγράφεται το μέγεθος συσκευασίας ενός προϊόντος (π.χ. 400g, 2kg, 500ml), ώστε να ξεχωρίζουν εύκολα παρόμοια προϊόντα διαφορετικού μεγέθους σε όλες τις οθόνες (λίστα, εξαγωγή, γρήγορη προσθήκη αποθέματος). Επίσης διορθώθηκε πρόβλημα με το σκάνερ barcode που κάποιες φορές δεν διάβαζε σωστά την πρώτη φορά ή άφηνε την κάμερα ανοιχτή σε iPhone.

---

## v1.3.0 — 2026-07-24 (f99748e)

### Αυτόματη δημιουργία changelog με AI μετά από push

**🔧 Τεχνική περιγραφή**

- Προστέθηκε GitHub Actions workflow `.github/workflows/changelog.yml` που εκτελείται σε κάθε push στο `main` (εκτός αν το commit message περιέχει `[skip ci]`)
- Νέο script `scripts/generate-changelog.mjs` που:
  - Ανακτά commit messages και git diff του push (`getCommitMessages`, `getDiff`)
  - Καλεί το Anthropic Claude API (`askClaude`) στέλνοντας prompt με τα παραπάνω, ζητώντας JSON response με πεδία `bump`, `title`, `technical`, `simple`
  - Ανεβάζει το version στο `package.json` βάσει semantic versioning (`bumpVersion`)
  - Δημιουργεί/ενημερώνει το `CHANGELOG.md` με νέο entry (τεχνική + απλή περιγραφή)
- Το workflow κάνει commit & push τις αλλαγές (`CHANGELOG.md`, `package.json`) με μήνυμα `docs: update changelog [skip ci]` για αποφυγή infinite loop
- Απαιτείται το secret `ANTHROPIC_API_KEY` στο repository

**🌱 Σε απλά λόγια**

Από εδώ και πέρα, κάθε φορά που γίνεται μια αλλαγή στο κύριο κώδικα του προγράμματος, ένας αυτόματος "βοηθός" (τεχνητή νοημοσύνη) θα γράφει μόνος του μια περιγραφή της αλλαγής σε ένα αρχείο ιστορικού (CHANGELOG), τόσο σε τεχνική γλώσσα όσο και σε απλά ελληνικά για όποιον δεν έχει τεχνικές γνώσεις. Έτσι όλοι μπορούν εύκολα να καταλαβαίνουν τι άλλαξε και πότε, χωρίς να χρειάζεται κάποιος να το γράφει χειροκίνητα.

---
