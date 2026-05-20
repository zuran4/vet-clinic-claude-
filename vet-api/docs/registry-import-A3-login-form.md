# A3 — Πραγματικό login στο pet.gov.gr με Playwright

Στόχος A3:

- Να κάνουμε κανονικό login στο `pet.gov.gr` με Playwright.
- Να συμπληρώνεται αυτόματα η φόρμα (username / password).
- Να πατιέται το κουμπί "Είσοδος".
- Να ελέγξουμε αν το login πέτυχε (να μην μείνουμε στη σελίδα `/login`).

Σε αυτό το βήμα το A3 χωρίζεται σε μικρά υπο-βήματα:

1. Ρύθμιση `.env` (υπενθύμιση για REGISTRY_*).
2. Επιλογή selectors για username / password / κουμπί.
3. Ενημέρωση του `services/registryScraper.js` ώστε:
   - να συμπληρώνει username και password,
   - να κάνει click στο κουμπί login,
   - να ελέγχει αν έκανε login.
4. Τρέξιμο του `scripts/registry-login-test.mjs` για έλεγχο.

Τα επόμενα υπο-βήματα θα τα κάνουμε ένα-ένα, με ξεχωριστές οδηγίες.