import nodemailer from "nodemailer";
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import "dotenv/config";

// Developer-only - ο πελάτης δεν έχει πρόσβαση σε αυτό
const DEVELOPER_EMAIL = "zuran4@gmail.com";
const COOLDOWN_FILE = "/opt/vet-clinic/monitor-last-alert.txt";
const COOLDOWN_MINUTES = 360; // 6 ώρες - να μην ξαναστείλει για το ίδιο πρόβλημα
const isDaily = process.argv.includes("--daily");

const checks = [];

function addResult(name, ok, detail) {
  checks.push({ name, ok, detail });
}

// 1. Docker container vet-api online & healthy?
try {
  const out = execSync("docker inspect --format='{{.State.Running}}|{{.State.Health.Status}}' vet-api 2>/dev/null").toString().trim();
  const [running, health] = out.split("|");
  if (running !== "true") {
    addResult("Docker vet-api", false, "Container δεν τρεχει");
  } else if (health && health !== "healthy" && health !== "<no value>") {
    addResult("Docker vet-api", false, `Health: ${health}`);
  } else {
    addResult("Docker vet-api", true, health === "healthy" ? "Running, healthy" : "Running");
  }
} catch (e) {
  addResult("Docker vet-api", false, "Container δεν βρεθηκε / δεν τρεχει");
}

// 2. HTTP check
try {
  const code = execSync("curl -s --max-time 5 -o /dev/null -w '%{http_code}' http://localhost:5000/api/health 2>/dev/null").toString().trim();
  const codeNum = parseInt(code);
  if (codeNum === 0 || isNaN(codeNum)) {
    addResult("API HTTP", false, "Δεν αποκρινεται στο port 5000");
  } else {
    addResult("API HTTP", true, `Responding (HTTP ${codeNum})`);
  }
} catch (e) {
  addResult("API HTTP", false, "Δεν αποκρινεται στο port 5000");
}

// 3. Disk space
try {
  const df = execSync("df / --output=pcent | tail -1").toString().trim().replace("%","");
  const pct = parseInt(df);
  if (pct > 85) {
    addResult("Disk Space", false, `${pct}% χρησιμοποιημενο!`);
  } else {
    addResult("Disk Space", true, `${pct}% χρησιμοποιημενο`);
  }
} catch (e) {
  addResult("Disk Space", false, e.message);
}

// 4. Memory
try {
  const free = execSync("free -m | awk '/^Mem:/ {print $7}'").toString().trim();
  const freeMb = parseInt(free);
  if (freeMb < 100) {
    addResult("Memory", false, `Mono ${freeMb}MB eleuthera!`);
  } else {
    addResult("Memory", true, `${freeMb}MB eleuthera`);
  }
} catch (e) {
  addResult("Memory", false, e.message);
}

// 5. Auto-update log
try {
  const log = readFileSync("/opt/vet-clinic/auto-update.log", "utf8");
  const lines = log.split("\n").filter(Boolean);
  const lastLines = lines.slice(-5).join(" | ");
  if (lastLines.includes("ERROR")) {
    addResult("Auto-update", false, lastLines);
  } else {
    addResult("Auto-update", true, "OK");
  }
} catch (e) {
  addResult("Auto-update", true, "Δεν υπαρχει log ακομα");
}

const failed = checks.filter(c => !c.ok);

// --- Daily report: στέλνεται πάντα, 1 φορά την ημέρα, ανεξαρτήτως cooldown ---
if (isDaily) {
  await sendReport({
    subject: `[VETPRO SERVER] Ημερησια Αναφορα - ${failed.length === 0 ? "Ολα OK" : "Προβληματα"}`,
    title: failed.length === 0
      ? `<h2 style="color:green">[DEV ONLY] VetPro - Ημερησια Αναφορα: Ολα OK</h2>`
      : `<h2 style="color:red">[DEV ONLY] VetPro - Ημερησια Αναφορα: Εντοπιστηκαν προβληματα</h2>`,
    footer: "Ημερησια αναφορα - αποστελλεται 1 φορα την ημερα.",
  });
  console.log(`[Monitor] ${new Date().toISOString()} Ημερησια αναφορα απεσταλη.`);
  process.exit(0);
}

// --- Alert email: ΜΟΝΟ όταν υπάρχει πρόβλημα, με cooldown ώστε να μην σπαμάρει ---
if (failed.length === 0) {
  console.log("[Monitor]", new Date().toISOString(), "Ολα OK:", checks.map(c => `${c.name}: ${c.detail}`).join(" | "));
  process.exit(0);
}

const now = Date.now();
if (existsSync(COOLDOWN_FILE)) {
  const lastAlert = parseInt(readFileSync(COOLDOWN_FILE, "utf8").trim());
  const diffMinutes = (now - lastAlert) / 60000;
  if (diffMinutes < COOLDOWN_MINUTES) {
    console.log(`[Monitor] ${failed.length} σφαλματα αλλα cooldown (${Math.round(diffMinutes)}/${COOLDOWN_MINUTES}min). Παραλειψη email.`);
    process.exit(0);
  }
}

await sendReport({
  subject: `[VETPRO SERVER] ALERT: ${failed.map(c => c.name).join(", ")}`,
  title: `<h2 style="color:red">[DEV ONLY] VetPro - Εντοπιστηκαν προβληματα</h2>`,
  footer: `Επομενο email σε ${COOLDOWN_MINUTES / 60} ωρες αν το προβλημα συνεχιστει.`,
});

writeFileSync(COOLDOWN_FILE, now.toString());
console.log(`[Monitor] ${new Date().toISOString()} Email αποσταλη στον developer για: ${failed.map(c => c.name).join(", ")}`);

// --- Helper: στέλνει το report email ---
async function sendReport({ subject, title, footer }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const failedHtml = failed.map(c =>
    `<tr><td style="color:red;padding:8px"><b>${c.name}</b></td><td style="color:red;padding:8px">${c.detail}</td></tr>`
  ).join("");

  const okHtml = checks.filter(c => c.ok).map(c =>
    `<tr><td style="color:green;padding:8px"><b>${c.name}</b></td><td style="color:green;padding:8px">${c.detail}</td></tr>`
  ).join("");

  await transporter.sendMail({
    from: `"VetPro Monitor" <${process.env.SMTP_USER}>`,
    to: DEVELOPER_EMAIL,
    subject,
    html: `
      ${title}
      <p><b>Server:</b> Orange Pi (192.168.50.17)</p>
      <p><b>Ωρα:</b> ${new Date().toLocaleString("el-GR", {timeZone:"Europe/Athens"})}</p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:600px">
        <tr style="background:#f0f0f0"><th>Ελεγχος</th><th>Λεπτομερειες</th></tr>
        ${failedHtml}
        ${okHtml}
      </table>
      <p style="color:gray;font-size:12px;margin-top:20px">${footer}</p>
    `,
  });
}
