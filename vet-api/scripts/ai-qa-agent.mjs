/**
 * AI QA Agent (Option B+C) — Claude + Playwright
 * Ο Claude οδηγεί τον browser σαν πραγματικός χρήστης και ψάχνει bugs.
 *
 * Χρήση: node scripts/ai-qa-agent.mjs
 * Env:   ANTHROPIC_API_KEY, SYNTHETIC_USER_PIN, FRONTEND_URL (optional)
 */

import "dotenv/config";
import { chromium } from "playwright";
import Anthropic from "@anthropic-ai/sdk";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "https://vetty.gr";
const PIN          = process.env.SYNTHETIC_USER_PIN;
const MAX_STEPS    = 50;

// ─── ANSI ──────────────────────────────────────────────────────────────────
const B   = (s) => `\x1b[1m${s}\x1b[0m`;
const G   = (s) => `\x1b[32m${s}\x1b[0m`;
const R   = (s) => `\x1b[31m${s}\x1b[0m`;
const Y   = (s) => `\x1b[33m${s}\x1b[0m`;
const DIM = (s) => `\x1b[2m${s}\x1b[0m`;
const CY  = (s) => `\x1b[36m${s}\x1b[0m`;

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(R("✗ ANTHROPIC_API_KEY δεν ορίστηκε στο .env"));
  process.exit(1);
}
if (!PIN) {
  console.error(R("✗ SYNTHETIC_USER_PIN δεν ορίστηκε στο .env"));
  process.exit(1);
}

// ─── Playwright helpers ────────────────────────────────────────────────────

async function getPageState(page) {
  try {
    await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => {});
    return await page.evaluate(() => {
      const bodyText = (document.body?.innerText ?? "").slice(0, 3000);
      const inputs = Array.from(document.querySelectorAll("input, textarea, select"))
        .filter((el) => el.offsetParent !== null)
        .slice(0, 20)
        .map((el) => ({
          type: el.type || el.tagName.toLowerCase(),
          name: el.name || el.id || "",
          placeholder: el.placeholder || "",
          label: document.querySelector(`label[for="${el.id}"]`)?.innerText?.trim() || "",
          value: el.type === "password" ? "***" : (el.value || ""),
        }));
      const buttons = Array.from(
        document.querySelectorAll('button, [role="button"], [type="submit"]')
      )
        .filter((el) => el.offsetParent !== null)
        .map((el) => el.innerText?.trim() || el.getAttribute("aria-label") || "")
        .filter(Boolean)
        .slice(0, 20);
      const alerts = Array.from(
        document.querySelectorAll('[role="alert"], .toast, [class*="error"], [class*="alert"], [class*="toast"]')
      )
        .map((el) => el.innerText?.trim())
        .filter(Boolean)
        .slice(0, 10);
      return {
        url:      window.location.href,
        title:    document.title,
        text:     bodyText,
        inputs,
        buttons,
        alerts,
      };
    });
  } catch {
    return { url: page.url(), title: "", text: "", inputs: [], buttons: [], alerts: [] };
  }
}

async function doClick(page, text) {
  const strategies = [
    () => page.getByRole("button", { name: text, exact: false }).first().click({ timeout: 4000 }),
    () => page.getByText(text, { exact: false }).first().click({ timeout: 4000 }),
    () => page.locator(`[aria-label*="${text}" i]`).first().click({ timeout: 4000 }),
    () => page.locator(`text=${text}`).first().click({ timeout: 4000 }),
  ];
  for (const s of strategies) {
    try { await s(); return { ok: true }; } catch { /* next */ }
  }
  return { ok: false, error: `Δεν βρέθηκε στοιχείο με κείμενο: "${text}"` };
}

async function doFill(page, label, value) {
  const strategies = [
    () => page.getByLabel(label, { exact: false }).first().fill(value),
    () => page.getByPlaceholder(label, { exact: false }).first().fill(value),
    () => page.locator(`input[name*="${label}" i], input[id*="${label}" i]`).first().fill(value),
    () => page.locator(`input`).first().fill(value),
  ];
  for (const s of strategies) {
    try { await s(); return { ok: true }; } catch { /* next */ }
  }
  return { ok: false, error: `Δεν βρέθηκε πεδίο με label: "${label}"` };
}

// ─── Tool definitions ──────────────────────────────────────────────────────

const tools = [
  {
    name: "navigate",
    description: "Πήγαινε σε URL μέσα στην εφαρμογή.",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Το πλήρες URL" },
      },
      required: ["url"],
    },
  },
  {
    name: "get_page_state",
    description: "Δες την τρέχουσα κατάσταση της σελίδας: URL, κείμενο, inputs, buttons, alerts.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "click",
    description: "Κάνε κλικ σε κουμπί ή σύνδεσμο βάσει του κειμένου του.",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Το ορατό κείμενο του στοιχείου" },
      },
      required: ["text"],
    },
  },
  {
    name: "fill_field",
    description: "Γέμισε ένα πεδίο φόρμας βάσει του label ή placeholder.",
    input_schema: {
      type: "object",
      properties: {
        label: { type: "string", description: "Το label ή placeholder του πεδίου" },
        value: { type: "string", description: "Η τιμή που θα εισαχθεί" },
      },
      required: ["label", "value"],
    },
  },
  {
    name: "press_key",
    description: "Πάτησε πλήκτρο (π.χ. Enter, Tab, Escape).",
    input_schema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Το πλήκτρο" },
      },
      required: ["key"],
    },
  },
  {
    name: "wait",
    description: "Περίμενε λίγο για να φορτώσει η σελίδα (ms).",
    input_schema: {
      type: "object",
      properties: {
        ms: { type: "number", description: "Milliseconds αναμονής (max 5000)" },
      },
      required: ["ms"],
    },
  },
  {
    name: "report_findings",
    description: "Τελείωσε τον έλεγχο και ανέφερε τα ευρήματα.",
    input_schema: {
      type: "object",
      properties: {
        bugs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              severity: { type: "string", enum: ["critical", "major", "minor"] },
              title:    { type: "string" },
              steps:    { type: "string", description: "Τι έκανα" },
              expected: { type: "string", description: "Τι ανέμενα" },
              actual:   { type: "string", description: "Τι συνέβη" },
            },
            required: ["severity", "title", "steps", "expected", "actual"],
          },
        },
        summary: { type: "string", description: "Γενική εκτίμηση της εφαρμογής" },
      },
      required: ["bugs", "summary"],
    },
  },
];

// ─── Tool executor ─────────────────────────────────────────────────────────

async function executeTool(name, input, page) {
  switch (name) {
    case "navigate": {
      await page.goto(input.url, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(800);
      return { ok: true, url: page.url() };
    }
    case "get_page_state": {
      return await getPageState(page);
    }
    case "click": {
      const r = await doClick(page, input.text);
      await page.waitForTimeout(600);
      return r;
    }
    case "fill_field": {
      const r = await doFill(page, input.label, input.value);
      return r;
    }
    case "press_key": {
      await page.keyboard.press(input.key);
      await page.waitForTimeout(400);
      return { ok: true };
    }
    case "wait": {
      await page.waitForTimeout(Math.min(input.ms ?? 1000, 5000));
      return { ok: true };
    }
    case "report_findings": {
      return { done: true, ...input };
    }
    default:
      return { error: `Άγνωστο tool: ${name}` };
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

console.log(`\n${B("🤖 VetPro AI QA Agent")} ${DIM("(Claude + Playwright)")}`);
console.log(`${DIM("   Target:")} ${FRONTEND_URL}`);
console.log(`${DIM("   Model:")}  claude-sonnet-4-6`);
console.log(`${DIM("   Date:")}   ${new Date().toLocaleString("el-GR")}\n`);

const client = new Anthropic();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  locale: "el-GR",
});
const page = await context.newPage();

const systemPrompt = `Είσαι QA agent για το VetPro — εφαρμογή διαχείρισης κτηνιατρείου στο ${FRONTEND_URL}.

Στόχος σου: να βρεις bugs, κενά validation, και απροσδόκητη συμπεριφορά ενεργώντας ως πραγματικός χρήστης αλλά και ως adversarial tester.

PIN login: ${PIN}

Στρατηγική:
1. Login με το PIN
2. Δοκίμασε happy paths (δημιουργία πελάτη, κατοικίδιου, ραντεβού)
3. Δοκίμασε edge cases (κενά πεδία, πολύ μακριά strings, ειδικοί χαρακτήρες όπως <script>, unicode, αρνητικοί αριθμοί)
4. Δοκίμασε duplicate entries
5. Δοκίμασε navigation (πήγαινε πίσω, refresh)
6. Κάθε στοιχείο που φτιάχνεις, πρέπει να το διαγράψεις στο τέλος (cleanup)
7. Κάλεσε report_findings όταν τελειώσεις

Σημαντικό: κάνε get_page_state μετά από κάθε action για να βλέπεις τι συνέβη.
Μέγιστα ${MAX_STEPS} βήματα — χρησιμοποίησέ τα αποτελεσματικά.`;

const messages = [];
let step = 0;
let findings = null;

// Αρχικό μήνυμα
messages.push({
  role: "user",
  content: `Ξεκίνα τον έλεγχο του ${FRONTEND_URL}. Πήγαινε πρώτα στην εφαρμογή και κάνε login.`,
});

console.log(B("[ Ξεκινώ τον agent... ]\n"));

while (step < MAX_STEPS && !findings) {
  step++;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    tools,
    tool_choice: { type: "any" }, // αναγκάζει τον Claude να καλεί tool σε κάθε γύρο
    system: systemPrompt,
    messages,
  });

  // Πρόσθεσε απάντηση στο history
  messages.push({ role: "assistant", content: response.content });

  // Εκτύπωσε σκέψη του Claude
  const textBlocks = response.content.filter((b) => b.type === "text");
  for (const b of textBlocks) {
    if (b.text.trim()) console.log(DIM(`  💭 ${b.text.trim().slice(0, 200)}`));
  }

  // Αν τελείωσε χωρίς tool call
  if (response.stop_reason === "end_turn") {
    console.log(Y("\n⚠️  Ο Claude σταμάτησε χωρίς report_findings."));
    break;
  }

  // Εκτέλεσε tools
  const toolUses = response.content.filter((b) => b.type === "tool_use");
  if (toolUses.length === 0) break;

  const toolResults = [];

  for (const toolUse of toolUses) {
    const { name, id, input } = toolUse;
    console.log(`  ${CY("→")} ${B(name)} ${DIM(JSON.stringify(input).slice(0, 100))}`);

    const result = await executeTool(name, input, page);

    if (name === "report_findings" && result.done) {
      findings = result;
    }

    const resultStr = JSON.stringify(result);
    if (result.ok === false || result.error) {
      console.log(`     ${R("✗")} ${result.error ?? "failed"}`);
    } else if (name === "get_page_state") {
      console.log(`     ${G("✓")} ${DIM(page.url().slice(0, 60))}`);
    } else {
      console.log(`     ${G("✓")} ${DIM(resultStr.slice(0, 80))}`);
    }

    toolResults.push({
      type: "tool_result",
      tool_use_id: id,
      content: resultStr,
    });
  }

  // Προειδοποίηση στο τέλος των tool results — δεν σπάει τη δομή του API
  if (step === MAX_STEPS - 8) {
    toolResults.push({
      type: "text",
      text: "⚠️ Απομένουν μόνο 8 βήματα. Κάλεσε ΑΜΕΣΑ report_findings με όσα bugs έχεις βρει.",
    });
  }

  messages.push({ role: "user", content: toolResults });
}

await browser.close();

// ─── Report ────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(65)}`);
console.log(B("  Αποτελέσματα QA Agent"));
console.log(`${"─".repeat(65)}`);
console.log(DIM(`  Βήματα: ${step}/${MAX_STEPS}\n`));

if (!findings) {
  console.log(Y("  ⚠️  Ο agent δεν ολοκλήρωσε report — δες τα logs παραπάνω."));
} else {
  const { bugs, summary } = findings;

  console.log(`  ${B("Γενική εκτίμηση:")}`);
  console.log(`  ${summary}\n`);

  if (bugs.length === 0) {
    console.log(G("  ✓ Δεν βρέθηκαν bugs!"));
  } else {
    const critical = bugs.filter((b) => b.severity === "critical");
    const major    = bugs.filter((b) => b.severity === "major");
    const minor    = bugs.filter((b) => b.severity === "minor");

    if (critical.length) console.log(R(`  🔴 Critical: ${critical.length}`));
    if (major.length)    console.log(Y(`  🟡 Major:    ${major.length}`));
    if (minor.length)    console.log(DIM(`  ⚪ Minor:    ${minor.length}`));

    console.log();
    for (const bug of bugs) {
      const icon = bug.severity === "critical" ? R("🔴") : bug.severity === "major" ? Y("🟡") : DIM("⚪");
      console.log(`  ${icon} ${B(bug.title)}`);
      console.log(`     ${DIM("Βήματα:")}   ${bug.steps}`);
      console.log(`     ${DIM("Ανέμενα:")}  ${bug.expected}`);
      console.log(`     ${DIM("Συνέβη:")}   ${bug.actual}`);
      console.log();
    }
  }
}

console.log(`${"─".repeat(65)}\n`);
process.exit(findings?.bugs?.length > 0 ? 1 : 0);
