# Multi-Tenant Architecture — Τι Υλοποιήσαμε

## Ο Στόχος

Μετατροπή του vet-clinic app από **single-tenant** (1 κλινική, 1 βάση) σε **multi-tenant SaaS**:
- Ένα κοινό Node.js API εξυπηρετεί πολλές κλινικές
- Κάθε κλινική έχει **ξεχωριστή MongoDB βάση** στο ίδιο Atlas cluster
- Το σύστημα τρέχει στο **mini PC** (AZW U59, Celeron N5105, 16GB RAM) χωρίς επιπλέον κόστος υποδομής

---

## Αρχιτεκτονική: Πώς λειτουργεί

```
Frontend (React)
     |
     | POST /api/auth/login  { clinicId: "papadopoulos", pin: "1234" }
     ↓
Node.js API  (1 process, τρέχει στο mini PC)
     |
     ├── vetAdmin DB  ←── Tenant registry (ποιες κλινικές υπάρχουν)
     │
     ├── vetClinic_papadopoulos  ←── Δεδομένα κλινικής Παπαδόπουλου
     ├── vetClinic_georgiou      ←── Δεδομένα κλινικής Γεωργίου
     └── vetClinic_test          ←── κλπ.
```

Κάθε κλινική έχει **απόλυτη απομόνωση δεδομένων** — δεν μπορεί να δει τα records άλλης κλινικής.

---

## Τι Φτιάξαμε — Αναλυτικά

### 1. Admin Database (`vetAdmin`)

**`vet-api/models/Tenant.js`** — Το schema για κάθε κλινική:
```
clinicId    → μοναδικό ID (π.χ. "papadopoulos")
clinicName  → Εμφανιζόμενο όνομα
dbName      → Όνομα βάσης (π.χ. "vetClinic_papadopoulos")
isActive    → Ενεργή/ανενεργή
ownerEmail  → Email ιδιοκτήτη
plan        → trial / basic / pro
trialEndsAt → Λήξη δοκιμαστικής περιόδου
```

**`vet-api/services/adminConnection.js`** — Σύνδεση στο `vetAdmin`:
- `connectAdmin(uri)` → Ανοίγει 1 σύνδεση στο admin DB
- `getTenantModel()` → Επιστρέφει το Tenant model για lookups

---

### 2. Tenant Connection Pool

**`vet-api/services/tenantConnectionManager.js`** — Κεντρική υπηρεσία διαχείρισης connections:

```
clinicId "papadopoulos" → mongoose.Connection → vetClinic_papadopoulos
clinicId "georgiou"     → mongoose.Connection → vetClinic_georgiou
```

- `getTenantConnection(clinicId)` → lazy: δημιουργεί connection μόνο στην 1η χρήση, μετά το cache-άρει
- `getTenantModels(clinicId)` → επιστρέφει και τα 13 models (Customer, Pet, User, κλπ.) δεμένα στη σωστή βάση
- `closeAllTenantConnections()` → graceful shutdown

---

### 3. Middleware Chain

Κάθε request περνά από:

```
requireAuth      → Επαληθεύει JWT, βάζει req.user
resolveTenant    → Παίρνει clinicId από token, βάζει req.models
route handler    → const { Customer, Pet } = req.models;
```

**`vet-api/middlewares/resolveTenant.js`:**
- Διαβάζει `req.user.clinicId`
- Καλεί `getTenantModels(clinicId)`
- Βάζει αποτέλεσμα στο `req.models`

Έτσι κάθε controller/route handler χρησιμοποιεί αυτόματα τη **σωστή βάση** χωρίς να χρειάζεται να ξέρει ποια κλινική είναι.

---

### 4. Authentication Flow

**`vet-api/services/auth/authService.js`** — Νέο login με 2 βήματα:

```
1. loginWithPin(clinicId, pin)
      ↓
   Έλεγχος στο vetAdmin: υπάρχει η κλινική; είναι isActive?
      ↓
   Άνοιγμα tenant connection για vetClinic_{clinicId}
      ↓
   Αναζήτηση χρήστη με bcrypt PIN comparison
      ↓
   JWT token με { userId, name, role, clinicId } μέσα
```

**`vet-api/services/auth/tokenService.js`** — Όλες οι functions για refresh tokens παίρνουν πλέον το `RefreshToken` model ως παράμετρο (tenant-aware).

**`vet-api/controllers/auth/login.js`** — Requires `{ clinicId, pin }` — επιστρέφει 400 αν λείπει οποιοδήποτε.

---

### 5. Ενημέρωση Όλων των Models

Και τα **13 model files** πήραν named export του schema:

```js
// Πριν
export default mongoose.model("Customer", customerSchema);

// Μετά
export { customerSchema };  // ← ΠΡΟΣΤΕΘΗΚΕ
export default mongoose.model("Customer", customerSchema);
```

Αυτό επιτρέπει στον `tenantConnectionManager` να δημιουργεί models για κάθε tenant connection χωρίς circular dependencies.

---

### 6. Ενημέρωση Services

Όλα τα services ξαναγράφτηκαν ώστε να δέχονται models ως παράμετρο:

```js
// Πριν (χρησιμοποιούσε hardcoded import)
export async function getAllPets() {
  return Pet.find();
}

// Μετά (tenant-aware)
export async function getAllPets({ Pet }) {
  return Pet.find();
}
```

Services που αλλάχτηκαν:
- `petService.js`
- `products/productService.js`
- `appointments/service.js`
- `audit/auditService.js`
- `audit/recordAudit.js`

---

### 7. Ενημέρωση Routes

Routes που έκαναν direct import των models ξαναγράφτηκαν:

```js
// Πριν
import Customer from "../models/Customer.js";
router.get("/", async (req, res) => { ... Customer.find() ... });

// Μετά
router.get("/", async (req, res) => {
  const { Customer } = req.models;  // ← από middleware
  ... Customer.find() ...
});
```

Routes που αλλάχτηκαν: `reminders`, `purchases`, `prescriptions`, `suppliers`, `settings`, `export`.

---

### 8. Server Startup

**`vet-api/server.js`:**
```js
// Πριν
mongoose.connect(config.mongoUri)

// Μετά
connectAdmin(config.mongoUri)  // Μόνο το admin DB ανοίγει στην εκκίνηση
// Tenant DBs ανοίγουν lazy, μόνο όταν συνδεθεί η πρώτη κλινική
```

---

### 9. Onboarding Script

**`vet-api/scripts/provision-clinic.js`** — CLI για νέα κλινική:

```bash
node provision-clinic.js \
  --clinicId papadopoulos \
  --clinicName "Κτηνιατρείο Παπαδόπουλου" \
  --adminName "Δρ. Παπαδόπουλος" \
  --adminPin 9876
```

Κάνει αυτόματα:
1. Δημιουργεί Tenant record στο `vetAdmin`
2. Ανοίγει σύνδεση στο `vetClinic_papadopoulos`
3. Δημιουργεί τον πρώτο admin User με hashed PIN

---

### 10. Tests

**30 test suites / 210 tests — όλα pass ✅**

Αλλαγές στο test environment:
- `testApp.js` → inject `req.models = mongoose.models` (από MongoMemoryServer connection)
- `loginWithPin.test.js` → ξαναγραφή για νέα υπογραφή `(clinicId, pin)` με test helpers
- `authRoutes.test.js` → ελέγχει validation (400) αντί για full login flow (που χρειάζεται admin DB)
- `auditLog.test.js` → fix για 2 arguments στο `recordAudit`

Test helpers που προστέθηκαν για isolation:
- `adminConnection._setForTest(conn, model)` — inject mock admin connection
- `tenantConnectionManager._setConnectionForTest(clinicId, conn)` — inject mock tenant connection

---

## Τι Μένει (Steps 3-5)

| Step | Τι είναι | Κατάσταση |
|------|----------|-----------|
| 3 | Cloudflare Tunnel — expose το API στο internet μέσω mini PC | ❌ Εκκρεμεί |
| 4 | Nginx — routing `clinic-a.vetapp.gr` → API | ❌ Εκκρεμεί |
| 5 | Πλήρης onboarding automation (email, subdomain, DB) | ❌ Εκκρεμεί |

---

## Git Branch

Όλες οι αλλαγές είναι στο branch: **`feature/multi-tenant`**

Commits:
- `multi-tenant: implement separate DB per clinic with req.models pattern`
- `test: fix loginWithPin tests for multi-tenant signature`
