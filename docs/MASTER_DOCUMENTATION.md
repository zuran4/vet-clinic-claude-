# Vetty — Master Documentation
> Πλήρης τεχνική τεκμηρίωση του συστήματος διαχείρισης κτηνιατρικής κλινικής  
> Full technical documentation of the veterinary clinic management system  
> **Version:** 1.0.0 | **Last updated:** 2026-06-23

---

## Table of Contents / Πίνακας Περιεχομένων

1. [System Overview](#1-system-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Authentication & RBAC](#5-authentication--rbac)
6. [Database Models](#6-database-models)
7. [API Reference](#7-api-reference)
8. [Backend Architecture](#8-backend-architecture)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Real-time (Socket.io)](#10-real-time-socketio)
11. [Background Jobs & Queues](#11-background-jobs--queues)
12. [Registry Integration (pet.gov.gr)](#12-registry-integration-petgovgr)
13. [Environment Variables](#13-environment-variables)
14. [CI/CD & Deployment](#14-cicd--deployment)
15. [Testing Strategy](#15-testing-strategy)
16. [Development Setup](#16-development-setup)

---

## 1. System Overview

**Vetty** is a production-ready, full-stack veterinary clinic management system.  
Είναι ένα ολοκληρωμένο σύστημα διαχείρισης κτηνιατρικής κλινικής, έτοιμο για παραγωγή.

### What it does / Τι κάνει

| Feature | Description (EN) | Περιγραφή (EL) |
|---------|-----------------|----------------|
| **Appointments** | Calendar-based scheduling with overlap detection | Ημερολόγιο ραντεβού με ανίχνευση σύγκρουσης |
| **Customers** | Owner records, search, bulk import CSV | Αρχείο ιδιοκτητών, αναζήτηση, μαζική εισαγωγή |
| **Pets** | Patient records, medical history, microchip | Αρχείο ζώων, ιστορικό, μικροτσίπ |
| **Prescriptions** | Digital prescriptions linked to pets | Ψηφιακές συνταγές συνδεδεμένες με ζώα |
| **Products / Stock** | Inventory with batch/lot tracking & expiry | Αποθήκη με παρτίδες και ημ. λήξης |
| **Suppliers** | Supplier management & purchase history | Διαχείριση προμηθευτών |
| **Registry** | Live lookup on pet.gov.gr via Playwright | Ζωντανή αναζήτηση στο κτηματολόγιο |
| **Audit Log** | Immutable trail of all CREATE/UPDATE/DELETE | Αμετάβλητο ιστορικό ενεργειών |
| **Notifications** | Email (Nodemailer) + SMS (Twilio) reminders | Ειδοποιήσεις email & SMS |
| **Real-time** | Socket.io live updates across all clients | Ζωντανή ενημέρωση σε όλα τα clients |

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│                                                                       │
│   ┌─────────────────────┐      ┌──────────────────────┐             │
│   │  vet-frontend        │      │  landing (Next.js)   │             │
│   │  React 18 + Vite    │      │  Marketing page       │             │
│   │  Port: 5173         │      │  Port: 3000           │             │
│   └──────────┬──────────┘      └──────────────────────┘             │
└──────────────┼──────────────────────────────────────────────────────┘
               │ HTTP/WS (proxy /api → :5000)
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER (vet-api)                          │
│                                                                       │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │  Express 4.21  |  Port: 5000  |  Node.js 22 ESM             │  │
│   │                                                               │  │
│   │  Middleware Stack (in order):                                 │  │
│   │  helmet → cors → requestId → express.json → rateLimit →      │  │
│   │  requireAuth → auditLog → [route handlers] → errorHandler    │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│   PM2 Processes:                                                      │
│   ┌─────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│   │  vet-api    │  │  registry-worker  │  │  synthetic-user-cron  │  │
│   │  server.js  │  │  Playwright/HTTP  │  │  runs every 6h        │  │
│   │             │  │  Port: 5051       │  │                       │  │
│   └──────┬──────┘  └────────┬─────────┘  └───────────────────────┘  │
└──────────┼──────────────────┼────────────────────────────────────────┘
           │                  │
           ▼                  ▼
┌──────────────────┐  ┌───────────────────┐  ┌────────────────────────┐
│  MongoDB         │  │  pet.gov.gr        │  │  External Services     │
│  Port: 27017     │  │  (Greek Registry)  │  │  Gmail SMTP            │
│  Mongoose 8.16   │  │                    │  │  Twilio SMS            │
└──────────────────┘  └───────────────────┘  │  Sentry Error Track    │
                                              │  Redis (BullMQ)        │
                                              └────────────────────────┘
```

### Request Lifecycle / Κύκλος Ζωής Αιτήματος

```
Client Request
     │
     ├─ helmet()           — Ασφαλή HTTP headers (X-Frame-Options, HSTS κλπ)
     ├─ cors()             — Έλεγχος επιτρεπόμενων origins
     ├─ attachRequestId    — Μοναδικό UUID για κάθε αίτημα (x-request-id)
     ├─ express.json()     — Parse JSON body (limit: 1mb)
     ├─ rateLimit()        — 120 req/min global, 10 req/15min για login
     ├─ /api/health        — Ξεπερνά τον auth guard (unauthenticated)
     ├─ requireAuth()      — Επαλήθευση JWT, attach req.user
     ├─ auditLog()         — Automatic logging CREATE/UPDATE/DELETE
     ├─ Route Handler      — Business logic
     ├─ Sentry middleware  — Capture unhandled errors
     └─ errorHandler()     — Unified error response format
```

---

## 3. Tech Stack

### Backend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Runtime | Node.js | 22+ | JavaScript runtime |
| Framework | Express | 4.21 | HTTP server & routing |
| Database | MongoDB + Mongoose | 8.0 / 8.16 | Document database & ODM |
| Auth | jsonwebtoken + bcryptjs | 9.0 / 2.4 | JWT tokens + PIN hashing |
| Validation | Joi | 18.0 | Request body schema validation |
| Real-time | Socket.io | 4.8 | WebSocket bidirectional events |
| Email | Nodemailer | 9.0 | SMTP email sending |
| SMS | Twilio SDK | 5.10 | SMS notifications |
| Queues | BullMQ | 5.61 | Redis-backed background jobs |
| Cron | node-cron | 4.2 | Scheduled recurring tasks |
| Browser automation | Playwright | 1.56 | Registry scraping (pet.gov.gr) |
| Security | Helmet + express-rate-limit | 8.1 / 8.2 | HTTP security & rate limiting |
| Logging | Winston | 3.18 | Structured application logging |
| Error tracking | @sentry/node | 10.56 | Production error monitoring |
| Process manager | PM2 | — | Production process lifecycle |

### Frontend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | React | 18.2 | UI component library |
| Build tool | Vite | 7.1 | Dev server & bundler |
| Styling | Tailwind CSS | 3.4 | Utility-first CSS |
| Calendar | @fullcalendar | — | Appointment calendar UI |
| HTTP | Axios | — | API communication |
| WebSockets | socket.io-client | — | Real-time sync |
| i18n | i18next + react-i18next | — | Greek/English translations |
| Icons | lucide-react | — | Icon set |
| Notifications | react-hot-toast | — | Toast messages |
| Error tracking | @sentry/react | — | Frontend error monitoring |
| PWA | Service Worker | — | Offline support + install prompt |

### Landing Page

| Technology | Purpose |
|-----------|---------|
| Next.js 14.2 (App Router) | Marketing / landing page |
| Tailwind CSS + TypeScript | Styling & type safety |

---

## 4. Project Structure

```
vet-clinic-claude-/
│
├── vet-api/                        # Node.js + Express backend
│   ├── server.js                   # Entry point — Express app + Socket.io + MongoDB
│   ├── instrument.js               # Sentry initialization (imported before server)
│   ├── ecosystem.config.cjs        # PM2 process definitions
│   ├── Dockerfile                  # Container image for vet-api
│   │
│   ├── config/
│   │   ├── index.js                # All env vars with fail-fast validation
│   │   ├── redis.js                # Redis connection (BullMQ)
│   │   └── roles.js                # RBAC: permissions per role
│   │
│   ├── models/                     # Mongoose schemas (see §6)
│   │   ├── User.js
│   │   ├── Customer.js
│   │   ├── Pet.js
│   │   ├── appointmentModel.js
│   │   ├── Prescription.js
│   │   ├── Product.js
│   │   ├── Purchase.js
│   │   ├── Supplier.js
│   │   ├── Reminder.js
│   │   ├── AuditLog.js
│   │   ├── Settings.js
│   │   ├── RefreshToken.js
│   │   └── RegistrySearchHistory.js
│   │
│   ├── routes/                     # Express routers (see §7)
│   │   ├── authRoutes.js           → /api/auth
│   │   ├── appointments/index.js   → /api/appointments
│   │   ├── customers/index.js      → /api/customers
│   │   ├── pets/index.js           → /api/pets
│   │   ├── products/index.js       → /api/products
│   │   ├── prescriptionRoutes.js   → /api/prescriptions
│   │   ├── supplierRoutes.js       → /api/suppliers
│   │   ├── purchases.js            → /api/purchases
│   │   ├── reminders.js            → /api/reminders
│   │   ├── registry/index.js       → /api/registry
│   │   ├── audit/index.js          → /api/audit
│   │   ├── export.js               → /api/export
│   │   ├── settings.js             → /api/settings
│   │   ├── uploadRoutes.js         → /api/uploads
│   │   └── health.js               → /api/health
│   │
│   ├── controllers/                # Request handlers
│   ├── services/                   # Business logic (auth, email, products, etc.)
│   ├── middlewares/                # Express middleware (auth, audit, error, etc.)
│   ├── validators/                 # Joi schemas for input validation
│   ├── jobs/                       # Cron jobs (reminders, vaccinations, expiry)
│   ├── queues/                     # BullMQ queues & workers
│   ├── utils/                      # Helpers (logger, jwt, apiError, etc.)
│   ├── scripts/                    # CLI scripts (addUser, backup, seed, synthetic)
│   └── __tests__/                  # Integration & unit tests (Jest + Supertest)
│
├── vet-frontend/                   # React 18 + Vite SPA
│   ├── src/
│   │   ├── App.jsx                 # Root component, routing, global state
│   │   ├── main.jsx                # React DOM entry, Sentry, i18n, service worker
│   │   ├── pages/                  # Top-level page components
│   │   ├── components/             # Feature components (appointments, pets, etc.)
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── api/                    # Axios API client & per-resource modules
│   │   ├── layout/                 # MainLayout with sidebar navigation
│   │   ├── i18n/                   # Greek & English translations
│   │   ├── config/                 # API URL & keyboard shortcuts config
│   │   └── utils/                  # Frontend utilities
│   └── public/                     # Static assets, service worker, PWA manifest
│
├── landing/                        # Next.js 14 marketing page (port 3000)
├── .github/workflows/              # GitHub Actions CI/CD
├── docker-compose.yml              # Docker orchestration
├── docs/                           # Documentation files
├── up.bat / down.bat               # Windows convenience scripts
└── scripts/syncVersions.js         # Updates version in all docs/*.md
```

---

## 5. Authentication & RBAC

### Authentication Flow / Ροή Αυθεντικοποίησης

Το σύστημα χρησιμοποιεί **PIN-based login** (όχι password). Κάθε χρήστης έχει ένα αριθμητικό PIN που αποθηκεύεται ως bcrypt hash.

```
1. User enters PIN
       │
       ▼
2. POST /api/auth/login
   { pin: "1234" }
       │
       ▼
3. Find user by name, compare PIN with bcryptjs.compare()
       │
       ▼
4. Generate:
   ├── Access Token  (JWT, expires: 15 min)
   └── Refresh Token (JWT, stored in RefreshToken collection, expires: 7 days)
       │
       ▼
5. Response: { ok: true, token, user: { id, name, role, permissions } }
       │
       ▼
6. Frontend stores token in memory (not localStorage)
       │
       ▼
7. Every request: Authorization: Bearer <token>
       │
       ▼
8. requireAuth middleware verifies JWT → attaches req.user
       │
       ▼
9. Token expires → POST /api/auth/refresh with refresh token
```

### Token Details

| Token | Storage | Expiry | Notes |
|-------|---------|--------|-------|
| Access Token | Frontend memory | 15 minutes | Sent in `Authorization: Bearer` header |
| Refresh Token | MongoDB (RefreshToken collection) | 7 days | Used to get new access token |

### PIN Security Notes / Ασφάλεια PIN

- Bcrypt hashing with salt — ίδιο PIN ≠ ίδιο hash (salt randomness)
- `pinHash` field is **NOT** unique in the DB για αυτόν τον λόγο
- Login rate limit: **10 αποτυχίες** per 15 min per IP (skipSuccessfulRequests: true)
- PIN change: `POST /api/auth/change-pin` — requires old PIN verification

### Roles & Permissions (RBAC)

Ορίζονται στο [vet-api/config/roles.js](../vet-api/config/roles.js). Convention: `"resource:action"`. Wildcard `"*"` = πλήρης πρόσβαση.

| Role | Permissions |
|------|------------|
| **admin** | `*` (everything) |
| **vet** | appointments:r/w/d, customers:r, pets:r/w/d, pets.history:r/w/d, prescriptions:r/w, products:r, reminders:r/w, suppliers:r, settings:r |
| **secretary** | appointments:r/w/d, customers:r/w, reminders:r/w/d, purchases:w, products:r, suppliers:r, pets:r, settings:r |
| **groomer** | appointments:r/w, customers:r, pets:r, settings:r |
| **assistant** | Same as secretary (legacy role, kept for backwards compat) |

### Middleware Chain for Protected Routes

```javascript
// requireAuth — checks JWT, attaches req.user = { userId, role, name }
// requirePermission("resource:action") — checks role permissions
// requireRole("admin") — checks exact role (used for registry worker management)
```

---

## 6. Database Models

Όλα τα models χρησιμοποιούν **Mongoose** με MongoDB. Παρακάτω είναι τα πλήρη schemas.

---

### 6.1 User

**Collection:** `users`  
**File:** [vet-api/models/User.js](../vet-api/models/User.js)

Αντιπροσωπεύει μέλος του προσωπικού της κλινικής.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | String | ✅ | Trim |
| `role` | String (enum) | — | `admin`, `vet`, `secretary`, `groomer`, `assistant`. Default: `secretary` |
| `pinHash` | String | ✅ | bcrypt hash of the PIN. NOT unique (bcrypt salt). Indexed. |
| `isActive` | Boolean | — | Default: `true`. Soft disable. Indexed. |
| `createdAt` | Date | — | Auto (timestamps) |
| `updatedAt` | Date | — | Auto (timestamps) |

**Indexes:** `role`, `pinHash`, `isActive`

---

### 6.2 Customer

**Collection:** `customers`  
**File:** [vet-api/models/Customer.js](../vet-api/models/Customer.js)

Αντιπροσωπεύει ιδιοκτήτη κατοικιδίου (πελάτη).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | String | ✅ | Trim. Indexed. |
| `phone` | String | ✅ | Trim. Indexed. |
| `email` | String | — | Trim |
| `address` | String | — | Trim |
| `city` | String | — | Trim |
| `afm` | String | — | ΑΦΜ (Tax ID). Trim. |
| `notes` | String | — | Trim |
| `notifications.email` | Boolean | — | Default: `true` |
| `notifications.sms` | Boolean | — | Default: `false` |
| `notifications.reminders` | Boolean | — | Default: `true` |
| `notifications.promotions` | Boolean | — | Default: `false` |
| `purchases` | Array[purchaseSchema] | — | Embedded purchase history |
| `createdAt` | Date | — | Auto (timestamps) |
| `updatedAt` | Date | — | Auto (timestamps) |

**Embedded: purchaseSchema**

| Field | Type | Notes |
|-------|------|-------|
| `product` | ObjectId → Product | |
| `quantity` | Number | Default: 1 |
| `date` | Date | Default: now |

**Indexes:** `name`, `phone`, compound `{ name: 1, phone: 1 }`

---

### 6.3 Pet

**Collection:** `pets`  
**File:** [vet-api/models/Pet.js](../vet-api/models/Pet.js)

Αντιπροσωπεύει κατοικίδιο ζώο (ασθενή).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `owner` | ObjectId → Customer | ✅ | Indexed |
| `name` | String | ✅ | Trim. Indexed. |
| `species` | String (enum) | ✅ | `Σκύλος`, `Γάτα`, `Κουνέλι`, `Πτηνό`, `Άλλο`. Default: `Σκύλος` |
| `gender` | String (enum) | ✅ | `Αρσενικό`, `Θηλυκό` |
| `birthDate` | Date | — | |
| `microchip` | String | — | Unique (sparse — allows null). Trim. |
| `neutered` | Boolean | — | Default: `false` |
| `vaccinated` | Boolean | — | Default: `false` |
| `notes` | String | — | Trim |
| `history` | Array[historyEntry] | — | Embedded medical history |
| `registrySnapshot` | Mixed | — | Last data snapshot from pet.gov.gr |
| `registrySnapshotAt` | Date | — | When snapshot was taken |
| `createdAt` | Date | — | Default: now |

**Embedded: historyEntry**

| Field | Type | Notes |
|-------|------|-------|
| `date` | Date | Default: now |
| `reason` | String | Required. E.g. "Εμβολιασμός", "Εξέταση" |
| `result` | String | |
| `weight` | Number | kg |
| `temperature` | Number | °C |
| `heartRate` | Number | bpm |
| `diagnosis` | String | |
| `treatment` | String | |
| `nextVisit` | Date | |
| `vet` | String | Doctor name |

**Indexes:** `owner`, `name`, compound `{ name: 1, owner: 1 }`, unique sparse `microchip`

---

### 6.4 Appointment

**Collection:** `appointments`  
**File:** [vet-api/models/appointmentModel.js](../vet-api/models/appointmentModel.js)

Αντιπροσωπεύει ραντεβού κλινικής.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `clientName` | String | ✅ | |
| `phone` | String | — | |
| `animalName` | String | ✅ | |
| `type` | String | ✅ | Appointment type (e.g. "Εξέταση", "Grooming") |
| `duration` | Number | ✅ | Minutes. Default: 30 |
| `notes` | String | — | |
| `doctor` | String | — | Default: `"Ιατρείο"` |
| `date` | String | ✅ | Format: `"YYYY-MM-DD"` |
| `time` | String | ✅ | Format: `"HH:mm"` |
| `owner` | ObjectId → Customer | — | Optional link to Customer |

**Compound Index:** `{ date: 1, doctor: 1, time: 1 }` — for fast same-day/same-doctor queries and overlap detection.

---

### 6.5 Prescription

**Collection:** `prescriptions`  
**File:** [vet-api/models/Prescription.js](../vet-api/models/Prescription.js)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `animalId` | ObjectId → Pet | ✅ | |
| `animalName` | String | ✅ | Denormalized snapshot |
| `clientName` | String | ✅ | Denormalized snapshot |
| `medicines` | Array[String] | ✅ | E.g. `["Augmentin", "Prednisolone"]` |
| `dosage` | String | — | |
| `notes` | String | — | |
| `instructions` | String | — | |
| `doctor` | String | — | (Future: ref to User) |
| `date` | Date | ✅ | Default: now |
| `createdAt` | Date | — | Auto (timestamps) |
| `updatedAt` | Date | — | Auto (timestamps) |

---

### 6.6 Product

**Collection:** `products`  
**File:** [vet-api/models/Product.js](../vet-api/models/Product.js)

Αντιπροσωπεύει προϊόν/φάρμακο στην αποθήκη.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | String | ✅ | |
| `category` | String (enum) | — | `Φάρμακο`, `Τροφή`, `Παιχνίδι`, `Αξεσουάρ`, `Άλλο`. Default: `Άλλο` |
| `barcode` | String | — | Unique (sparse) |
| `quantity` | Number | — | **Auto-calculated** from batches via pre-save hook. Default: 0 |
| `threshold` | Number | — | Low-stock alert threshold. Default: 5 |
| `unit` | String | — | E.g. "τεμ.", "ml" |
| `expirationDate` | Date | — | Product-level expiry |
| `expirationWarningDays` | Number | — | Days before expiry to warn. Default: 30 |
| `retailPrice` | Number | — | Selling price |
| `notes` | String | — | |
| `supplier` | String | — | Supplier name |
| `batches` | Array[batchSchema] | — | Stock lots |
| `createdAt` | Date | — | Auto (timestamps) |
| `updatedAt` | Date | — | Auto (timestamps) |

**Embedded: batchSchema**

| Field | Type | Notes |
|-------|------|-------|
| `batchNumber` | String | Lot number |
| `quantity` | Number | Units in this batch |
| `purchaseDate` | Date | |
| `expirationDate` | Date | Batch-level expiry |
| `invoiceNumber` | String | |

**Virtual:** `calculatedQuantity` — sum of all batch quantities (included in JSON output).

**Pre-save Hook:** Automatically sets `quantity = sum(batches[].quantity)` before every save.

**Post findOneAndUpdate Hook:** Re-syncs `quantity` after update operations.

---

### 6.7 Reminder

**Collection:** `reminders`  
**File:** [vet-api/models/Reminder.js](../vet-api/models/Reminder.js)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `customer` | ObjectId → Customer | ✅ | |
| `note` | String | — | What to remind |
| `productNames` | Array[String] | — | Product names for email body |
| `reminderDate` | Date | ✅ | When to send |
| `sent` | Boolean | — | Default: `false` |
| `sentAt` | Date | — | When it was sent |
| `createdAt` | Date | — | Auto (timestamps) |

**Compound Index:** `{ reminderDate: 1, sent: 1 }` — for efficient pending reminder queries.

---

### 6.8 AuditLog

**Collection:** `auditlogs`  
**File:** [vet-api/models/AuditLog.js](../vet-api/models/AuditLog.js)

Append-only audit trail. **Never modified after creation.**

| Field | Type | Notes |
|-------|------|-------|
| `action` | String | `CREATE` \| `UPDATE` \| `DELETE` \| `LOGIN_SUCCESS` \| `LOGIN_FAILURE`. Indexed. |
| `resource` | String | E.g. `"customers"`, `"appointments"`. Indexed. |
| `resourceId` | String | MongoDB ObjectId of the affected document |
| `method` | String | HTTP method |
| `path` | String | Request path |
| `statusCode` | Number | HTTP status code |
| `userId` | String | Indexed |
| `userName` | String | |
| `userRole` | String | |
| `requestId` | String | UUID for request tracing |
| `ip` | String | Client IP |
| `createdAt` | Date | Auto. Indexed (desc). |

**TTL Index:** Records auto-expire after **90 days** (`expireAfterSeconds: 7,776,000`).

---

### 6.9 Settings

**Collection:** `settings`  
**File:** [vet-api/models/Settings.js](../vet-api/models/Settings.js)

Single document per clinic (singleton pattern). Queried with `Settings.findOne()`.

| Field | Type | Notes |
|-------|------|-------|
| `clinicName` | String | Default: `"Άγιος Στέφανος"` |
| `logo` | String | File path to uploaded logo |
| `language` | String enum | `"el"` or `"en"`. Default: `"el"` |
| `timezone` | String | Default: `"Europe/Athens"` |
| `darkMode` | Boolean | Default: `false` |
| `emailConfig` | Object | SMTP: host, port, user, password, fromName, fromEmail |
| `staff` | Array | `[{ name, role: "Κτηνίατρος" \| "Βοηθός Κτηνιάτρου" \| "Groomer" }]` |
| `phone` | String | Clinic phone |
| `address` | String | Clinic address |
| `afm` | String | Clinic tax ID |
| `notifications` | Object | `{ appointmentReminder, vaccineReminder, birthdayReminder }` |
| `registryWorkerHeadless` | Boolean | Run Playwright headless? Default: `true` |
| `clinicWorkingHours` | Object | Per-day schedule (Mon–Sun). Each day: `{ enabled, intervals: [{ start, end }] }` |
| `groomingWorkingHours` | Object | Same structure as clinicWorkingHours |

---

### 6.10 Other Models

| Model | Collection | Purpose |
|-------|-----------|---------|
| `RefreshToken` | `refreshtokens` | Stores JWT refresh tokens for revocation |
| `Purchase` | `purchases` | Purchase records from suppliers |
| `Supplier` | `suppliers` | Supplier information |
| `RegistrySearchHistory` | `registrysearchhistories` | History of pet.gov.gr microchip lookups |

---

## 7. API Reference

**Base URL:** `http://localhost:5000/api`  
**Auth:** All endpoints except `/auth/*` and `/health` require `Authorization: Bearer <token>`.

**Standard Error Response:**
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "requestId": "uuid"
  },
  "meta": { "path": "/api/...", "method": "GET" }
}
```

---

### 7.1 Auth — `/api/auth`

| Method | Path | Auth | Permission | Description |
|--------|------|------|-----------|-------------|
| POST | `/login` | ❌ | — | Login with PIN. Rate limited: 10 failures/15min/IP. |
| POST | `/refresh` | ❌ | — | Exchange refresh token for new access token |
| POST | `/logout` | ❌ | — | Invalidate refresh token |
| GET | `/me` | ✅ | any | Get current user profile |
| POST | `/change-pin` | ✅ | any | Change current user's PIN |

**POST /login — Body:**
```json
{ "name": "Dr. Papadopoulos", "pin": "1234" }
```
**POST /login — Response:**
```json
{
  "ok": true,
  "token": "<access_jwt>",
  "refreshToken": "<refresh_jwt>",
  "user": { "id": "...", "name": "...", "role": "vet", "permissions": ["appointments:read", ...] }
}
```

---

### 7.2 Appointments — `/api/appointments`

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/` | `appointments:read` | Get all appointments |
| GET | `/search?q=...` | `appointments:read` | Search appointments |
| POST | `/` | `appointments:write` | Create appointment (validates body + checks overlap) |
| PUT | `/:id` | `appointments:write` | Update appointment (validates body + checks overlap) |
| DELETE | `/:id` | `appointments:delete` | Delete appointment |

**POST/PUT Body:**
```json
{
  "clientName": "Γιώργος Παπαδόπουλος",
  "phone": "6912345678",
  "animalName": "Rex",
  "type": "Εξέταση",
  "duration": 30,
  "notes": "Ετήσιος έλεγχος",
  "doctor": "Δρ. Νίκος",
  "date": "2026-06-25",
  "time": "10:00",
  "owner": "64abc123..."
}
```

**Overlap Detection:** Before creating/updating, `checkOverlap` middleware queries for any appointment on the same `date`, `doctor`, and overlapping time window. Returns `409` if conflict found.

---

### 7.3 Customers — `/api/customers`

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/` | `customers:read` | Get all customers (supports `?search=...`) |
| GET | `/:id` | `customers:read` | Get customer by ID |
| POST | `/` | `customers:write` | Create customer |
| POST | `/import` | `customers:write` | Bulk import from CSV/Excel |
| PUT | `/:id` | `customers:write` | Update customer |
| DELETE | `/:id` | `customers:delete` | Delete customer |
| POST | `/:id/purchases` | `purchases:write` | Add purchase to customer |
| GET | `/:id/purchases` | `customers:read` | Get customer's purchase history |

---

### 7.4 Pets — `/api/pets`

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/` | `pets:read` | Get all pets |
| GET | `/count` | `pets:read` | Get total pet count |
| GET | `/by-owner/:ownerId` | `pets:read` | Get pets by owner |
| GET | `/:id` | `pets:read` | Get pet by ID |
| POST | `/` | `pets:write` | Create pet |
| PUT | `/:id` | `pets:write` | Update pet |
| DELETE | `/:id` | `pets:delete` | Delete pet |
| PATCH | `/snapshot/:microchip` | `pets:write` | Update registry snapshot from pet.gov.gr |
| PUT | `/:id/owner` | `pets:write` | Change pet owner |
| GET | `/:id/history` | `pets.history:read` | Get medical history entries |
| POST | `/:id/history` | `pets.history:write` | Add history entry |
| PUT | `/:id/history/:entryId` | `pets.history:write` | Update history entry |
| DELETE | `/:id/history/:entryId` | `pets.history:delete` | Delete history entry |

---

### 7.5 Products — `/api/products`

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/` | `products:read` | Get all products |
| GET | `/:id` | `products:read` | Get product by ID |
| POST | `/` | `products:write` | Create product |
| POST | `/import` | `products:write` | Bulk import products |
| PUT | `/:id` | `products:write` | Update product |
| DELETE | `/:id` | `products:delete` | Delete product |
| GET | `/:id/batches` | `products:read` | Get stock batches |
| PUT | `/:id/batches` | `products:write` | Update stock batches |
| GET | `/export` | `products:read` | Export stock to CSV/Excel |

---

### 7.6 Prescriptions — `/api/prescriptions`

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/` | `prescriptions:read` | Get all prescriptions (sorted newest first) |
| GET | `/by-animal/:animalId` | `prescriptions:read` | Get prescriptions for specific pet |
| POST | `/` | `prescriptions:write` | Create prescription |

**POST Body:**
```json
{
  "animalId": "64abc...",
  "animalName": "Rex",
  "clientName": "Παπαδόπουλος",
  "medicines": ["Augmentin 500mg", "Prednisolone 5mg"],
  "dosage": "2x/day for 7 days",
  "instructions": "Με φαγητό",
  "doctor": "Δρ. Νίκος"
}
```

---

### 7.7 Suppliers — `/api/suppliers`

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/` | `suppliers:read` | Get all suppliers |
| GET | `/:id` | `suppliers:read` | Get supplier by ID |
| POST | `/` | `products:write` | Create supplier |
| PUT | `/:id` | `products:write` | Update supplier |
| DELETE | `/:id` | `products:write` | Delete supplier |
| POST | `/import` | `products:write` | Bulk import suppliers |

---

### 7.8 Purchases — `/api/purchases`

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/` | `products:read` | Get all purchases |
| POST | `/` | `purchases:write` | Create purchase record |
| PUT | `/:id` | `purchases:write` | Update purchase |
| DELETE | `/:id` | `purchases:write` | Delete purchase |

---

### 7.9 Reminders — `/api/reminders`

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/` | `reminders:read` | Get all reminders |
| POST | `/` | `reminders:write` | Create reminder |
| PUT | `/:id` | `reminders:write` | Update reminder |
| DELETE | `/:id` | `reminders:delete` | Delete reminder |

---

### 7.10 Registry — `/api/registry`

Διαχείριση του Playwright worker για αναζήτηση στο pet.gov.gr.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/worker/start` | `role: admin` | Start the Playwright registry worker |
| POST | `/worker/stop` | `role: admin` | Stop the registry worker |
| GET | `/worker/state` | any | Get worker status |
| GET | `/session` | any | Get current browser session info |
| GET | `/lookup?microchip=...` | any | Lookup pet by microchip (10-20 digits) |
| GET | `/medical-events?microchip=...` | any | Get medical events for microchip |
| GET | `/history` | any | Get search history |
| POST | `/history` | any | Add entry to search history |

**Microchip validation:** Must match `/^\d{10,20}$/`

---

### 7.11 Audit — `/api/audit`

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/` | `admin` | Get audit logs (paginated, filterable) |

---

### 7.12 Settings — `/api/settings`

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/` | `settings:read` | Get clinic settings |
| PUT | `/` | `admin` | Update settings |

---

### 7.13 Upload — `/api/uploads`

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | `/` | any | Upload file (images, documents) — Multer |

Uploaded files are served statically from `/uploads/`.

---

### 7.14 Export — `/api/export`

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | `/` | `products:read` | Export selected data to CSV/Excel |

---

### 7.15 Health — `/api/health`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | ❌ | Health check. Returns `{ ok: true }`. Used by Docker & CI. |

---

## 8. Backend Architecture

### Middleware Stack (Execution Order)

```
1. helmet()                 — Security headers (X-Frame-Options, HSTS, X-XSS-Protection, etc.)
2. cors(corsOriginCheck)    — CORS: allowedOrigins from env, LAN IPs in dev
3. attachRequestId          — UUID per request (req.requestId → x-request-id header)
4. express.json({ limit })  — Parse JSON body, max 1mb
5. express.urlencoded()     — Parse form data, max 1mb
6. rateLimit()              — 120 req/min global
7. /api/health (bypass)     — Skips auth for health check
8. requireAuth()            — JWT verification → req.user = { userId, role, name }
9. auditLog()               — Records CREATE/UPDATE/DELETE in AuditLog collection
10. [route-specific middleware] — validateBody, checkOverlap, requirePermission, etc.
11. route handler()         — Business logic
12. Sentry.setupExpressErrorHandler()
13. errorHandler()          — Unified { ok: false, error: { code, message } } format
```

### Controller → Service → Model Pattern

```
Route Handler
    │
    ▼
Controller (controllers/)
    │   Validates HTTP layer: params, query, req.user
    │   Delegates business logic to service
    │
    ▼
Service (services/)
    │   Pure business logic
    │   Orchestrates multiple model operations
    │   No HTTP concepts (no req/res)
    │
    ▼
Model (models/)
    │   Mongoose schema
    │   Data persistence
    │
    ▼
MongoDB
```

### Error Handling

All errors flow through the centralized `errorHandler` middleware.

**Custom ApiError class:**
```javascript
// utils/apiError.js
class ApiError extends Error {
  constructor(statusCode, message, { code, details, expose } = {})
}
// Usage: throw new ApiError(404, "Δεν βρέθηκε", { code: "NOT_FOUND" })
```

**Response format:**
```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Δεν βρέθηκε",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "meta": { "path": "/api/pets/123", "method": "GET" }
}
```

### Input Validation (Joi)

Validation happens before the route handler via `validateBody(schema)` middleware.

```javascript
// Example: validators/customers/createSchema.js
import Joi from "joi";
export default Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().email().optional(),
  // ...
});
```

If validation fails → immediate `400` response with field-level error details.

### Audit Logging

The `auditLog` middleware (applied to all `/api/*` except `/auth` and `/health`) wraps the response to capture:

- Action (derived from HTTP method: POST→CREATE, PUT/PATCH→UPDATE, DELETE→DELETE)
- Resource (derived from path: `/api/customers/123` → resource: `customers`, resourceId: `123`)
- User info (from `req.user`)
- Request metadata (method, path, statusCode, requestId, IP)

Login events are logged separately inside `controllers/auth/login.js`.

---

## 9. Frontend Architecture

### Page Map

| Page | Path | Component | Description |
|------|------|-----------|-------------|
| Dashboard | `/` | `Dashboard.jsx` | Overview: today's appointments, alerts, expiring stock |
| Appointments | `/appointments` | `AppointmentsPage.jsx` | Calendar + slot-based scheduling |
| Customers | `/customers` | `CustomersPage.jsx` | Customer list, search, create/edit |
| Pets | `/pets` | `PetsPage.jsx` | Pet records, history, registry lookup |
| Prescriptions | `/prescriptions` | `PrescriptionsPage.jsx` | Prescription list and creation |
| Products | `/products` | `ProductsPage.jsx` | Inventory management |
| Settings | `/settings` | `SettingsPage.jsx` | Clinic config, working hours |
| Export | `/export` | `ExportPage.jsx` | Data export to CSV/Excel |

### Component Architecture

```
App.jsx (root, global state, routing)
└── MainLayout.jsx (sidebar + header wrapper)
    ├── HeaderBar.jsx (user menu, date/time)
    ├── Sidebar navigation
    └── <Page> (route-based)
        ├── Feature Components (List, Form, Modal, Card...)
        │   └── UI Components (Button, Input, Select, Modal, Alert...)
        └── Custom Hooks (data fetching, form state, handlers)
```

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Login/logout, token refresh, user state |
| `useAppointmentsData` | Fetch & cache appointments |
| `useProductsData` | Fetch & cache products |
| `useAppointmentForm` | Form state for appointment create/edit |
| `useAppointmentSlots` | Calculate available time slots based on working hours |
| `useCustomers` | Fetch customers list |
| `useCustomerPets` | Fetch pets for a specific customer |
| `usePetList` | Fetch all pets |
| `usePrescriptions` | Fetch prescriptions |
| `useProductList` | Fetch products |
| `useSuppliers` | Fetch suppliers |
| `useSettingsPage` | Settings form state and save logic |
| `useRealtimeSync` | Subscribe to Socket.io events and trigger refetch |
| `useRefetchOnFocus` | Refetch data when browser tab becomes active |
| `useRegistryMicrochipSearch` | Registry worker lookup logic |
| `useKeyboardShortcuts` | Global keyboard shortcut handling |
| `useInstallPrompt` | PWA install prompt detection |

### API Layer

All HTTP communication goes through [vet-frontend/src/api/apiClient.js](../vet-frontend/src/api/apiClient.js) — an Axios instance with:
- Base URL from `VITE_API_BASE_URL`
- Request interceptor: attaches `Authorization: Bearer <token>`
- Response interceptor: handles 401 by attempting token refresh, then re-queuing the original request

Per-resource modules:

| File | Endpoints |
|------|-----------|
| `appointmentsApi.js` | CRUD for appointments |
| `customersApi.js` | CRUD + search + import |
| `petsApi.js` | CRUD + history + owner change + snapshot |
| `productsApi.js` | CRUD + batches + import + export |
| `registryApi.js` | Worker management + lookup + history |
| `settingsApi.js` | Get/update settings |

### Internationalization (i18n)

- Library: `i18next` + `react-i18next`
- Languages: Greek (`el`) and English (`en`)
- Translation files:
  - [vet-frontend/src/i18n/locales/el.json](../vet-frontend/src/i18n/locales/el.json)
  - [vet-frontend/src/i18n/locales/en.json](../vet-frontend/src/i18n/locales/en.json)
- Default language: Greek (`el`)
- Language can be changed from Settings page

### PWA (Progressive Web App)

- Service worker registered in `main.jsx`
- Enables offline capability for previously loaded data
- `InstallPwaBanner.jsx` shows install prompt on mobile browsers
- `manifest.json` in `public/` defines app name, icons, theme

### Dark Mode

- Tailwind CSS `class` strategy (`darkMode: "class"`)
- Toggle stored in Settings (MongoDB) and synced to `<html class="dark">`
- Windows 11 Fluent design color palette included in `tailwind.config.js`

---

## 10. Real-time (Socket.io)

### Server Setup

```javascript
// server.js
const io = new Server(server, { cors: { origin: corsOriginCheck } });
global.io = io;
global.emitAlert = (data) => io.emit("alert", data);
```

The `io` instance is exposed globally so any part of the backend can emit events without importing the server module.

### Emitting Events

```javascript
// From anywhere in the backend (e.g., after creating an appointment):
global.io.emit("appointments:updated", { action: "created", data: newAppointment });
global.io.emit("products:updated", { action: "deleted", id: productId });
global.emitAlert({ type: "low-stock", product: "Amoxicillin" });
```

### Frontend Listener

```javascript
// hooks/useRealtimeSync.jsx
// Subscribes to relevant events and calls refetch functions:
socket.on("appointments:updated", () => refetchAppointments());
socket.on("products:updated", () => refetchProducts());
socket.on("alert", (data) => showToast(data));
```

### Connection

- Frontend connects to `VITE_API_BASE_URL` via Socket.io client
- Connection is established after login, disconnected on logout
- Reconnection is automatic (Socket.io default behavior)

---

## 11. Background Jobs & Queues

### Cron Jobs (node-cron)

Started automatically when the server connects to MongoDB.

| Job | Schedule | What it does |
|-----|----------|--------------|
| `appointmentReminderJob` | `0 8 * * *` (08:00 daily) | Finds tomorrow's appointments → sends email reminder to owner |
| `petVaccinationJob` | `0 9 * * *` (09:00 daily) | Checks pet history for "Εμβολιασμός" entries → sends email at 7 days & 1 day before |
| `productExpirationJob` | `0 7 * * *` (07:00 daily) | Checks product/batch expiry dates → queues SMS if ≤7 days remaining |
| `purchaseReminderJob` | Scheduled | Checks pending purchase reminders → sends notifications |

### Vaccination Logic Detail

```
For each Pet:
  For each history entry where reason === "Εμβολιασμός":
    nextDate = entry.date + 12 months
    daysRemaining = nextDate - today
    if daysRemaining === 7 OR daysRemaining === 1:
      → send email to pet.owner.email
```

### BullMQ Queues (Redis-backed)

| Queue | Workers | Purpose |
|-------|---------|---------|
| `notificationsQueue` | `emailWorker.js`, `smsWorker.js` | Async email & SMS sending |

**Why queues?** Decouples notification sending from the HTTP request cycle. If email/SMS fails, BullMQ retries automatically.

**Usage example (productExpirationJob):**
```javascript
await notificationsQueue.add("sendSMS", {
  to: ADMIN_PHONE,
  message: `Το προϊόν "${product.name}" λήγει σε ${daysToExpire} ημέρες.`
});
```

### PM2 Cron Process (synthetic-user-cron)

- Runs `scripts/synthetic-user.mjs` every 6 hours (`0 */6 * * *`)
- Performs an end-to-end flow test (login, create appointment, etc.)
- Acts as a continuous health/smoke test in production

---

## 12. Registry Integration (pet.gov.gr)

Η ενσωμάτωση με το Εθνικό Μητρώο Ζώων Συντροφιάς (pet.gov.gr) χρησιμοποιεί **Playwright** για αυτοματισμό του browser.

### Architecture

```
vet-api (port 5000)
    │
    │  HTTP requests to REGISTRY_WORKER_URL (default: localhost:5051)
    ▼
registry-worker (PM2 process, port 5051)
    │  scripts/registry-worker.mjs
    │
    ▼
Playwright (headless Chromium)
    │
    ▼
pet.gov.gr
```

### Components

| File | Purpose |
|------|---------|
| `scripts/registry-worker.mjs` | Main worker: HTTP server (port 5051) + Playwright browser |
| `scripts/registry-worker/browser.js` | Browser lifecycle (launch, close, crash handling) |
| `scripts/registry-worker/session.js` | Login session management, cookie persistence |
| `scripts/registry-worker/config.js` | Worker configuration |
| `scripts/registry-worker/startup.js` | Initialization sequence |
| `scripts/registry-worker/logging.js` | Worker-specific logging |
| `services/registryScraper.js` | High-level scraping functions (login, search, extract) |
| `services/registryWorkerClient.js` | HTTP client for the worker API |
| `services/registryWorkerProcess.js` | Worker process lifecycle (start/stop via child_process) |

### API Flow: Microchip Lookup

```
1. GET /api/registry/lookup?microchip=900182001234567
2. validateMicrochipQuery() — regex: /^\d{10,20}$/
3. lookupMicrochipHandler() → calls registryWorkerClient.lookup(microchip)
4. HTTP GET http://localhost:5051/lookup?microchip=...
5. registry-worker: Playwright navigates to pet.gov.gr, performs search
6. Scrapes result, returns JSON
7. Controller stores result in RegistrySearchHistory
8. PATCH /api/pets/snapshot/:microchip — updates pet.registrySnapshot
9. Response to frontend with pet data
```

### Session Persistence

- Playwright profile saved to `playwright-registry-worker/` (Docker volume)
- Login credentials from env: `PET_USERNAME`, `PET_PASSWORD`
- Session cookies persist across worker restarts
- If session expires → worker auto re-logins

### Worker State

| State | Meaning |
|-------|---------|
| `idle` | Ready to accept requests |
| `busy` | Currently performing a lookup |
| `error` | Last operation failed |
| `stopped` | Worker process not running |

---

## 13. Environment Variables

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | ✅ | `development` \| `production` \| `ci` |
| `PORT` | — | API port. Default: `5000` |
| `LOG_LEVEL` | — | Winston log level. Default: `info` |
| `MONGO_URI` | ✅ | MongoDB connection string. E.g. `mongodb://localhost:27017/vet` |
| `JWT_SECRET` | ✅ | Secret for signing JWTs. Must be long and random. |
| `JWT_EXPIRES_IN` | — | Access token expiry. Default: `15m` |
| `ENCRYPTION_KEY` | — | AES encryption key for sensitive fields (if used) |
| `CORS_ORIGINS` | — | Comma-separated allowed origins. E.g. `https://myklinik.gr` |
| `SMTP_HOST` | — | SMTP server. Default: `smtp.gmail.com` |
| `SMTP_PORT` | — | SMTP port. Default: `587` |
| `SMTP_USER` | — | SMTP username (Gmail address) |
| `SMTP_PASS` | — | SMTP password or App Password |
| `TWILIO_ACCOUNT_SID` | — | Twilio account SID (for SMS) |
| `TWILIO_AUTH_TOKEN` | — | Twilio auth token |
| `TWILIO_PHONE_FROM` | — | Twilio sender phone number |
| `ADMIN_PHONE` | — | Phone number for admin SMS alerts (product expiry) |
| `REGISTRY_WORKER_URL` | — | URL of registry worker. Default: `http://localhost:5051` |
| `PET_BOOKLET_BASE_URL` | — | pet.gov.gr base URL |
| `PET_USERNAME` | — | pet.gov.gr login username |
| `PET_PASSWORD` | — | pet.gov.gr login password |
| `SENTRY_DSN` | — | Sentry DSN for error tracking |
| `SYNTHETIC_USER_PIN` | — | PIN for the synthetic (CI test) user |

### Frontend (.env — Vite prefix `VITE_`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ | Backend API URL. E.g. `http://localhost:5000` |
| `VITE_SENTRY_DSN` | — | Sentry DSN for frontend error tracking |
| `VITE_APP_ENV` | — | `development` \| `production` |

---

## 14. CI/CD & Deployment

### GitHub Actions

**Trigger:** Push or PR to `main` when files under `vet-api/**` change.  
**File:** [.github/workflows/vet-api-ci.yml](../.github/workflows/vet-api-ci.yml)

```
Job 1: lint-and-test
  ├── checkout
  ├── setup Node.js 22 (npm cache)
  ├── npm ci
  ├── npm run lint (ESLint)
  └── npm test (Jest)

Job 2: synthetic-user (needs: lint-and-test)
  ├── MongoDB service (mongo:6, port 27017)
  ├── checkout + setup Node.js 22
  ├── npm ci
  ├── node scripts/seed-ci-user.mjs <PIN>   ← creates test user
  ├── node server.js &                       ← start API in background
  ├── wait for /api/health (30 retries × 2s)
  └── node scripts/synthetic-user.mjs <PIN> ← E2E smoke test
```

**Secrets used:**
- `SYNTHETIC_USER_PIN` — PIN for the CI test user

### Docker

**Dockerfile** (in `vet-api/`): Node 22 base, installs production dependencies, runs server with Sentry instrumentation.

**docker-compose.yml:**
```yaml
services:
  vet-api:
    build: ./vet-api
    ports: ["5000:5000"]
    volumes:
      - ./vet-api/uploads:/app/uploads
      - ./vet-api/backups:/app/backups
      - playwright-profile:/app/playwright-registry-worker
    env_file: ./vet-api/.env
    healthcheck:
      test: curl -sf http://localhost:5000/api/health
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

**Start:** `docker compose up -d` or `up.bat` (Windows)  
**Stop:** `docker compose down` or `down.bat`

### PM2 (Production Process Manager)

Defined in [vet-api/ecosystem.config.cjs](../vet-api/ecosystem.config.cjs).

| Process | Script | Restart Policy | Notes |
|---------|--------|---------------|-------|
| `vet-api` | `server.js` | autorestart: true, max_restarts: 10 | 2s restart delay |
| `registry-worker` | `scripts/registry-worker.mjs` | autorestart: true, max_restarts: 5 | 8s restart delay (browser needs time to start) |
| `synthetic-user-cron` | `scripts/synthetic-user.mjs` | autorestart: false | Runs on cron: every 6 hours |

**PM2 Commands:**
```bash
npm run pm2:start    # Start all processes
npm run pm2:stop     # Stop all processes
npm run pm2:restart  # Restart all
npm run pm2:status   # Show status
npm run pm2:logs     # View all logs
npm run pm2:logs:api # View vet-api logs
```

### Database Backup & Restore

```bash
node scripts/backup-db.mjs    # Creates timestamped backup in backups/
node scripts/restore-db.mjs   # Restores from backup file
```

---

## 15. Testing Strategy

### Test Types

| Type | Tool | Location | Description |
|------|------|----------|-------------|
| Unit tests | Jest | `models/__tests__/`, `services/__tests__/`, `utils/__tests__/` | Isolated function testing |
| Integration tests | Jest + Supertest | `__tests__/integration/` | Full HTTP request/response against in-memory DB |
| E2E smoke tests | Custom scripts | `scripts/synthetic-user.mjs` | Real API requests with a live server |

### Integration Test Setup

- **Database:** MongoDB Memory Server (`mongodb-memory-server`) — fresh in-memory DB per test suite
- **Test app:** `__tests__/helpers/testApp.js` — Express app configured same as production
- **Isolated:** No external dependencies (no real MongoDB, no email, no SMS)

```
__tests__/
├── helpers/
│   ├── testApp.js     — Express app for tests
│   └── testDb.js      — MongoDB Memory Server setup/teardown
└── integration/
    ├── appointments.test.js
    ├── auth.test.js
    ├── customers.test.js
    ├── pets.test.js
    ├── products.test.js
    ├── prescriptions.test.js
    ├── purchases.test.js
    ├── reminders.test.js
    ├── settings.test.js
    ├── suppliers.test.js
    ├── uploads.test.js
    └── ...
```

### Run Tests

```bash
cd vet-api

npm test              # Run all tests
npm run test:watch    # Watch mode
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run deadcode      # knip — find unused exports
npm run deps:check    # depcheck — find unused packages
npm run deps:graph    # madge — generate dependency graph SVG
```

---

## 16. Development Setup

### Prerequisites

- Node.js 22+
- MongoDB (local or Atlas)
- Redis (for BullMQ queues — optional for basic dev)
- npm

### Backend Setup

```bash
cd vet-api
cp .env.example .env          # Copy and fill in required variables
npm install
npm run dev                   # Start with nodemon (hot-reload)
```

Required `.env` values for local dev:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/vet
JWT_SECRET=any-long-random-string-here
```

### Frontend Setup

```bash
cd vet-frontend
cp .env.example .env          # Copy template
# Set VITE_API_BASE_URL=http://localhost:5000
npm install
npm run dev                   # Vite dev server on port 5173
```

### Landing Page Setup

```bash
cd landing
npm install
npm run dev                   # Next.js dev server on port 3000
```

### Create First User

```bash
cd vet-api
node scripts/addUser.js
# Follow prompts to set name, role, PIN
```

### Windows Quick Start

```bat
up.bat       # Starts all Docker services
down.bat     # Stops all Docker services
```

### Port Reference

| Service | Port | Notes |
|---------|------|-------|
| vet-api | 5000 | Main API server |
| vet-frontend | 5173 | Vite dev server (proxies /api → :5000) |
| landing | 3000 | Next.js marketing page |
| MongoDB | 27017 | Database |
| Redis | 6379 | BullMQ queues |
| registry-worker | 5051 | Internal Playwright HTTP server |

### Keyboard Shortcuts (Frontend)

Defined in [vet-frontend/src/config/shortcuts.js](../vet-frontend/src/config/shortcuts.js).

| Shortcut | Action |
|----------|--------|
| `N` | New appointment |
| `C` | New customer |
| `P` | New pet |
| `Esc` | Close modal |

---

*Documentation generated from source code analysis — 2026-06-23*  
*Τεκμηρίωση δημιουργήθηκε από ανάλυση πηγαίου κώδικα — 23/06/2026*
