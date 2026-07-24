# Changelog

Αυτόματο ιστορικό αλλαγών του project. Κάθε entry γράφεται αυτόματα μετά από push στο main.

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
