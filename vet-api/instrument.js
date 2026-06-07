// vet-api/instrument.js
// ⚠️ Πρέπει να φορτωθεί ΠΡΙΝ από οτιδήποτε άλλο (--import ./instrument.js),
// ώστε το Sentry να μπορεί να κάνει auto-instrumentation σε http/express/mongo κ.λπ.
import * as Sentry from "@sentry/node";
import dotenv from "dotenv";

dotenv.config();

const dsn = process.env.SENTRY_DSN;
const environment = process.env.NODE_ENV || "development";

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release: process.env.SENTRY_RELEASE || undefined,

    // Performance tracing — πιο "φειδωλό" δείγμα σε production
    tracesSampleRate: environment === "production" ? 0.2 : 1.0,

    // Μην στέλνεις PII (emails, IPs, headers με auth) στο Sentry
    sendDefaultPii: false,
  });
} else {
  console.warn("⚠️  SENTRY_DSN δεν έχει οριστεί — error tracking απενεργοποιημένο.");
}

export default Sentry;
