# Registry Worker (Playwright) Runbook

## Σκοπός
Ο Registry Worker είναι ένας ανεξάρτητος Node process που κρατάει **persistent Playwright browser context** και εκθέτει ένα μικρό HTTP API για:
- session/status έλεγχο
- microchip lookup
- diagnostics endpoints (προαιρετικά)

Χρησιμοποιείται από το `vet-api` ως “worker service” ώστε το API να μην τρέχει Playwright μέσα στο ίδιο process.

---

## High-level ροή
1. Εκκίνηση worker.
2. Launch persistent Chromium profile (userDataDir).
3. Εκκίνηση HTTP server (port 5051 default).
4. Startup sequence:
   - goto base URL
   - PRE_LOGIN → click “Ιδιώτης Κτηνίατρος” (αν υπάρχει)
   - SESSION_EXPIRED → reconnect
   - NEEDS_LOGIN → autoLoginIfNeeded (αν υπάρχουν credentials)
5. Ο worker παραμένει ενεργός και εξυπηρετεί `/lookup` requests.
6. Graceful shutdown σε SIGINT/SIGTERM: κλείσιμο server και browser context.

---

## Προαπαιτούμενα
- Node.js (προτείνεται LTS)
- Playwright εγκατεστημένο στο `vet-api` (και οι browsers του)
- Πρόσβαση στο `PET_BOOKLET_BASE_URL` από το host (Render/VPS/local)

---

## Environment Variables

### Υποχρεωτικά
- `PET_BOOKLET_BASE_URL`
  - π.χ. `https://pet.gov.gr/emzs-backoffice/`
  - Αν λείπει ή είναι invalid URL, ο worker πρέπει να αποτυγχάνει νωρίς (fail fast).

### Προτεινόμενα (λειτουργία)
- `REGISTRY_WORKER_HEADLESS`
  - `true/false` ή `1/0` ή `yes/no`
  - default: `true`

- `REGISTRY_WORKER_USER_DATA_DIR`
  - Path ή folder name για persistent profile
  - default: `playwright-registry-worker`

- `REGISTRY_WORKER_PORT`
  - Μόνο για local/dev
  - default: `5051`

### Render/Cloud
- `PORT`
  - Σε Render environments χρησιμοποιείται συνήθως ως service port.
  - Προσοχή να μη συγκρουστεί με το `vet-api` port.

### Credentials (αν κάνεις auto-login)
- `PET_USERNAME`
- `PET_PASSWORD`

### Debug/Diagnostics
- `REGISTRY_WORKER_DEBUG=1`
  - Επιτρέπει `textSnippet/htmlSnippet` σε `/lookup` και βοηθά σε troubleshooting.
  - Να είναι `0`/unset σε production εκτός αν υπάρχει ανάγκη.

- `LOGIN_DEBUG=true`
  - Περισσότερα logs μόνο για το login flow.

---

## Εκκίνηση (Local)

### 1) Από το `vet-api`
```bash
node scripts/registry-worker.mjs
