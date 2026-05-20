# 🩺 VET API Documentation

## Βασικές Πληροφορίες

- **Base URL (dev):** `http://localhost:5000`
- **Auth:** JWT Bearer token (`Authorization: Bearer <token>`)
- **Rate limit:** 120 requests/min ανά IP
- **Request ID:** Κάθε response περιέχει `X-Request-Id` header

---

## Auth — `/api/auth`

| Method | Endpoint | Περιγραφή |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login με PIN, επιστρέφει JWT token |
| GET | `/api/auth/me` | Στοιχεία τρέχοντος user |
| POST | `/api/auth/logout` | Logout |

**User Roles:** `admin`, `assistant`

---

## Appointments — `/api/appointments`

| Method | Endpoint | Περιγραφή |
|--------|----------|-------------|
| GET | `/api/appointments` | Λίστα ραντεβού |
| POST | `/api/appointments` | Νέο ραντεβού |
| PUT | `/api/appointments/:id` | Ενημέρωση |
| DELETE | `/api/appointments/:id` | Διαγραφή |

**Appointment fields:** `clientName`, `phone`, `animalName`, `type`, `duration` (default 30min), `date` (YYYY-MM-DD), `time` (HH:mm), `doctor`, `notes`, `owner` (ref Customer)

---

## Customers — `/api/customers`

| Method | Endpoint | Περιγραφή |
|--------|----------|-------------|
| GET | `/api/customers` | Λίστα πελατών |
| POST | `/api/customers` | Νέος πελάτης |
| GET | `/api/customers/:id` | Λεπτομέρειες πελάτη |
| PUT | `/api/customers/:id` | Ενημέρωση |
| DELETE | `/api/customers/:id` | Διαγραφή |

**Customer fields:** `name`, `phone`, `email`, `address`, `notes`, `notifications` (email/sms/reminders/promotions), `purchases[]`

---

## Pets — `/api/pets`

| Method | Endpoint | Περιγραφή |
|--------|----------|-------------|
| GET | `/api/pets` | Λίστα ζώων |
| POST | `/api/pets` | Νέο ζώο |
| GET | `/api/pets/:id` | Λεπτομέρειες ζώου |
| PUT | `/api/pets/:id` | Ενημέρωση |
| DELETE | `/api/pets/:id` | Διαγραφή |

**Pet fields:** `name`, `species` (Σκύλος/Γάτα/Άλλο), `gender`, `birthDate`, `microchip` (unique), `neutered`, `vaccinated`, `notes`, `history[]`, `owner` (ref Customer)

---

## Products — `/api/products`

| Method | Endpoint | Περιγραφή |
|--------|----------|-------------|
| GET | `/api/products` | Λίστα προιόντων |
| POST | `/api/products` | Νέο προϊόν |
| PUT | `/api/products/:id` | Ενημέρωση |
| DELETE | `/api/products/:id` | Διαγραφή |

**Product fields:** `name`, `category` (Φάρμακο/Τροφή/Παιχνίδι/Αξεσουάρ/Άλλο), `barcode`, `quantity`, `threshold`, `unit`, `expirationDate`, `batches[]`

**Virtual:** `calculatedQuantity` αυτόματα υπολογίζεται από batches.

---

## Prescriptions — `/api/prescriptions`

| Method | Endpoint | Περιγραφή |
|--------|----------|-------------|
| GET | `/api/prescriptions` | Λίστα συνταγών |
| POST | `/api/prescriptions` | Νέα συνταγή |
| DELETE | `/api/prescriptions/:id` | Διαγραφή |

**Prescription fields:** `animalId`, `animalName`, `clientName`, `medicines[]`, `dosage`, `notes`, `instructions`, `doctor`, `date`

---

## Registry — `/api/registry`

| Method | Endpoint | Περιγραφή |
|--------|----------|-------------|
| POST | `/api/registry/lookup` | Microchip lookup μέσω pet.gov.gr |
| GET | `/api/registry/status` | Status του registry worker |

---

## Settings — `/api/settings`

| Method | Endpoint | Περιγραφή |
|--------|----------|-------------|
| GET | `/api/settings` | Λήψη ρυθμίσεων |
| PUT | `/api/settings` | Αποθήκευση ρυθμίσεων |

---

## Health Check

| Method | Endpoint | Περιγραφή |
|--------|----------|-------------|
| GET | `/` | Γενικός έλεγχος λειτουργίας |
| GET | `/health` | Απλός health check (`{ ok: true }`) |

---

## Error Response Format

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Περιγραφή σφάλματος",
    "requestId": "uuid"
  },
  "meta": {
    "path": "/api/...",
    "method": "POST"
  }
}
```

**Κοινοί κωδικοί:**
- `RATE_LIMITED` — 429
- `NOT_FOUND` — 404
- `UNAUTHORIZED` — 401 ... (content truncated for brevity)