/**
 * Synthetic user bot — τρέχει ως φανταστικός πελάτης και ελέγχει τα κύρια flows.
 * Χρήση: node scripts/synthetic-user.mjs
 * Env:   SYNTHETIC_USER_PIN=1234  (ή πρώτο CLI arg)
 *        API_BASE_URL=http://localhost:5000  (optional, default παρακάτω)
 */

import "dotenv/config";

const BASE = process.env.API_BASE_URL ?? "http://localhost:5000";
const PIN  = process.argv[2] ?? process.env.SYNTHETIC_USER_PIN;

// ─── ANSI colors ───────────────────────────────────────────────────────────
const G = (s) => `\x1b[32m${s}\x1b[0m`;   // green
const R = (s) => `\x1b[31m${s}\x1b[0m`;   // red
const Y = (s) => `\x1b[33m${s}\x1b[0m`;   // yellow
const B = (s) => `\x1b[1m${s}\x1b[0m`;    // bold
const DIM = (s) => `\x1b[2m${s}\x1b[0m`;  // dim

// ─── State ─────────────────────────────────────────────────────────────────
const results = [];   // { name, ok, ms, error? }
const created = {};   // IDs για cleanup

// ─── Helpers ───────────────────────────────────────────────────────────────
async function api(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const t0 = Date.now();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const ms = Date.now() - t0;
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, ok: res.ok, data, ms };
}

async function step(name, fn) {
  process.stdout.write(`  ${DIM("›")} ${name.padEnd(50, " ")}`);
  try {
    const { ok, ms, error } = await fn();
    if (ok) {
      console.log(G("PASS") + DIM(` (${ms}ms)`));
      results.push({ name, ok: true, ms });
    } else {
      console.log(R("FAIL") + DIM(` (${ms}ms)`) + R(` ← ${error ?? "άγνωστο σφάλμα"}`));
      results.push({ name, ok: false, ms, error });
    }
  } catch (err) {
    console.log(R("ERROR") + R(` ← ${err.message}`));
    results.push({ name, ok: false, ms: 0, error: err.message });
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────
console.log(`\n${B("🤖 VetPro Synthetic User")}`);
console.log(`${DIM("   Target:")} ${BASE}`);
console.log(`${DIM("   Date:")}   ${new Date().toLocaleString("el-GR")}\n`);

if (!PIN) {
  console.error(R("✗ Δεν δόθηκε PIN. Χρήση: node scripts/synthetic-user.mjs <PIN>"));
  console.error(R("  ή ορίστε SYNTHETIC_USER_PIN στο .env"));
  process.exit(1);
}

// ── 1. Health check (no auth) ────────────────────────────────────────────
console.log(B("[ 1 / 6 ] Health"));
let token;

await step("GET /api/health", async () => {
  const r = await api("GET", "/api/health");
  return { ok: r.ok, ms: r.ms, error: r.data?.error };
});

// ── 2. Auth ──────────────────────────────────────────────────────────────
console.log(B("\n[ 2 / 6 ] Auth"));

await step("POST /api/auth/login (σωστό PIN)", async () => {
  const r = await api("POST", "/api/auth/login", { pin: PIN });
  if (!r.ok) return { ok: false, ms: r.ms, error: r.data?.message ?? `HTTP ${r.status}` };
  token = r.data.token;
  return { ok: !!token, ms: r.ms, error: token ? null : "Δεν επεστράφη token" };
});

await step("POST /api/auth/login (λάθος PIN → 401)", async () => {
  const r = await api("POST", "/api/auth/login", { pin: "00000000" });
  return { ok: r.status === 401, ms: r.ms, error: r.status !== 401 ? `Αναμενόταν 401, ήρθε ${r.status}` : null };
});

await step("GET /api/auth/me (με token)", async () => {
  const r = await api("GET", "/api/auth/me", null, token);
  return { ok: r.ok, ms: r.ms, error: r.data?.error };
});

if (!token) {
  console.error(R("\n✗ Login απέτυχε — δεν μπορώ να συνεχίσω χωρίς token."));
  printSummary();
  process.exit(1);
}

// ── 3. Customers ─────────────────────────────────────────────────────────
console.log(B("\n[ 3 / 6 ] Customers"));

await step("GET /api/customers (λίστα)", async () => {
  const r = await api("GET", "/api/customers", null, token);
  // Η απάντηση είναι paginated: { data: [], total, page, ... }
  const valid = r.ok && Array.isArray(r.data?.data);
  return { ok: valid, ms: r.ms, error: valid ? null : `Αναμενόταν { data: [] }, ήρθε: ${JSON.stringify(r.data).slice(0, 80)}` };
});

let customerId;
await step("POST /api/customers (δημιουργία)", async () => {
  const r = await api("POST", "/api/customers", {
    name:  "ΣΥΝΘΕΤΙΚΟΣ ΧΡΗΣΤΗΣ TEST",
    phone: "6900000001",
    email: "synthetic@testmail.gr",
    notes: "Αυτόματος έλεγχος — διαγράφεται αυτόματα",
  }, token);
  if (!r.ok) return { ok: false, ms: r.ms, error: r.data?.errors?.join(", ") ?? r.data?.message ?? r.data?.error ?? `HTTP ${r.status}` };
  customerId = r.data._id;
  created.customerId = customerId;
  return { ok: !!customerId, ms: r.ms };
});

if (customerId) {
  await step(`GET /api/customers/${customerId}`, async () => {
    const r = await api("GET", `/api/customers/${customerId}`, null, token);
    return { ok: r.ok && r.data._id === customerId, ms: r.ms, error: r.ok ? null : `HTTP ${r.status}` };
  });
}

// ── 4. Pets ──────────────────────────────────────────────────────────────
console.log(B("\n[ 4 / 6 ] Pets"));

let petId;
if (customerId) {
  await step("POST /api/pets (δημιουργία)", async () => {
    const r = await api("POST", "/api/pets", {
      owner:    customerId,
      name:     "ΣκύλοςTest",
      species:  "Σκύλος",
      gender:   "Αρσενικό",
      neutered: false,
      notes:    "Synthetic test pet",
    }, token);
    if (!r.ok) return { ok: false, ms: r.ms, error: r.data?.error ?? `HTTP ${r.status}` };
    petId = r.data._id;
    created.petId = petId;
    return { ok: !!petId, ms: r.ms };
  });

  await step(`GET /api/pets/by-owner/${customerId}`, async () => {
    const r = await api("GET", `/api/pets/by-owner/${customerId}`, null, token);
    return { ok: r.ok && Array.isArray(r.data), ms: r.ms, error: r.ok ? null : `HTTP ${r.status}` };
  });
}

if (petId) {
  await step("POST /api/pets/:id/history (εγγραφή επίσκεψης)", async () => {
    const r = await api("POST", `/api/pets/${petId}/history`, {
      reason:      "Τακτικός έλεγχος (synthetic)",
      result:      "Καλή κατάσταση",
      weight:      12.5,
      temperature: 38.2,
    }, token);
    return { ok: r.ok, ms: r.ms, error: r.ok ? null : (r.data?.error ?? `HTTP ${r.status}`) };
  });

  await step("GET /api/pets/:id/history", async () => {
    const r = await api("GET", `/api/pets/${petId}/history`, null, token);
    return { ok: r.ok && Array.isArray(r.data), ms: r.ms, error: r.ok ? null : `HTTP ${r.status}` };
  });
}

// ── 5. Appointments + Products + Prescriptions ───────────────────────────
console.log(B("\n[ 5 / 6 ] Appointments / Products / Prescriptions"));

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const dateStr = tomorrow.toISOString().slice(0, 10);

let appointmentId;
await step("POST /api/appointments (δημιουργία)", async () => {
  const r = await api("POST", "/api/appointments", {
    date:       dateStr,
    time:       "10:00",
    clientName: "ΣΥΝΘΕΤΙΚΟΣ ΧΡΗΣΤΗΣ TEST",
    animalName: "ΣκύλοςTest",
    type:       "Τακτικός έλεγχος",
    duration:   30,
    phone:      "6900000001",
    owner:      customerId ?? undefined,
  }, token);
  if (!r.ok) return { ok: false, ms: r.ms, error: r.data?.message ?? `HTTP ${r.status}` };
  appointmentId = r.data._id;
  created.appointmentId = appointmentId;
  return { ok: !!appointmentId, ms: r.ms };
});

await step("GET /api/appointments (λίστα)", async () => {
  const r = await api("GET", "/api/appointments", null, token);
  return { ok: r.ok && Array.isArray(r.data), ms: r.ms, error: r.ok ? null : `HTTP ${r.status}` };
});

await step("GET /api/products (λίστα)", async () => {
  const r = await api("GET", "/api/products", null, token);
  return { ok: r.ok, ms: r.ms, error: r.ok ? null : `HTTP ${r.status}` };
});

if (petId) {
  await step("POST /api/prescriptions (δημιουργία)", async () => {
    const r = await api("POST", "/api/prescriptions", {
      animalId:   petId,
      animalName: "ΣκύλοςTest",
      clientName: "ΣΥΝΘΕΤΙΚΟΣ ΧΡΗΣΤΗΣ TEST",
      medicines:  ["SyntheticMed 10mg"],
      dosage:     "1x ημερησίως",
      notes:      "Synthetic test — διαγράφεται αυτόματα",
    }, token);
    return { ok: r.ok, ms: r.ms, error: r.ok ? null : (r.data?.error ?? `HTTP ${r.status}`) };
  });

  await step("GET /api/prescriptions/by-animal/:id", async () => {
    const r = await api("GET", `/api/prescriptions/by-animal/${petId}`, null, token);
    return { ok: r.ok && Array.isArray(r.data), ms: r.ms, error: r.ok ? null : `HTTP ${r.status}` };
  });
}

// ── 6. Cleanup ───────────────────────────────────────────────────────────
console.log(B("\n[ 6 / 6 ] Cleanup (διαγραφή test δεδομένων)"));

if (appointmentId) {
  await step(`DELETE /api/appointments/${appointmentId}`, async () => {
    const r = await api("DELETE", `/api/appointments/${appointmentId}`, null, token);
    return { ok: r.ok, ms: r.ms, error: r.ok ? null : `HTTP ${r.status}` };
  });
}

if (petId) {
  await step(`DELETE /api/pets/${petId}`, async () => {
    const r = await api("DELETE", `/api/pets/${petId}`, null, token);
    return { ok: r.ok, ms: r.ms, error: r.ok ? null : `HTTP ${r.status}` };
  });
}

if (customerId) {
  await step(`DELETE /api/customers/${customerId}`, async () => {
    const r = await api("DELETE", `/api/customers/${customerId}`, null, token);
    return { ok: r.ok, ms: r.ms, error: r.ok ? null : `HTTP ${r.status}` };
  });
}

// ─── Summary ───────────────────────────────────────────────────────────────
printSummary();

function printSummary() {
  const passed = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const avgMs  = results.length ? Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length) : 0;

  console.log(`\n${"─".repeat(65)}`);
  console.log(B("  Αποτελέσματα"));
  console.log(`${"─".repeat(65)}`);
  console.log(`  ${G(`✓ ${passed.length} PASS`)}   ${failed.length ? R(`✗ ${failed.length} FAIL`) : DIM("0 FAIL")}   ${DIM(`μέσος χρόνος: ${avgMs}ms`)}`);

  if (failed.length) {
    console.log(`\n  ${Y("Αποτυχίες:")}`);
    for (const f of failed) {
      console.log(`  ${R("✗")} ${f.name}`);
      if (f.error) console.log(`     ${DIM(f.error)}`);
    }
  }

  console.log(`${"─".repeat(65)}\n`);

  process.exit(failed.length > 0 ? 1 : 0);
}
