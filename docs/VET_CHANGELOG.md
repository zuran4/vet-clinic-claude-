# 🧾 VET Project CHANGELOG

## [1.2.0] — 2026-04

### Προστέθηκαν
- Registry Worker: persistent Playwright browser context για microchip lookup
- HTTP server στον registry worker (port 5051)
- Graceful shutdown (SIGINT/SIGTERM) σε API και worker
- Request ID tracing (`X-Request-Id`) σε όλα τα responses
- BullMQ + Redis για job queues
- Socket.io real-time alerts
- Twilio SMS notifications
- Product batches και `calculatedQuantity` virtual
- i18n υποστήριξη στο frontend
- Export page στο frontend

### Αλλαγές
- PIN auth με bcrypt hashing (αφαίρεση legacy `pin` field)
- Config refactor: όλες οι env vars σε ένα `config/index.js` με fail-fast validation
- Rate limiter αναβαθμίστηκε σε 120 req/min
- CORS με explicit allowlist σε production

### Διορθώσεις
- MongoDB reconnect logic βελτιώθηκε
- Pet microchip index διορθώθηκε (sparse unique)
- Product quantity sync μετά από findOneAndUpdate

---

## [1.1.0] — 2026-01

### Προστέθηκαν
- Prescriptions module (συνταγές)
- Suppliers και Purchases modules
- Pet history log
- Customer notification preferences
- Upload routes (multer)

### Αλλαγές
- Μεταφορά από CommonJS σε ESM (type: module)
- Vite αντί για Create React App στο frontend

---

## [1.0.0] — 2025-12

### Πρώτη έκδοση
- Βασική δομή: vet-api + vet-frontend
- Auth (JWT + PIN)
- Appointments, Customers, Pets, Products
- MongoDB + Mongoose models
- React frontend με Tailwind CSS
