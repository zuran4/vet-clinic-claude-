/**
 * Τρέχει μέσα από το GitHub Action μετά από κάθε push στο main.
 * Παίρνει το diff του push, το στέλνει στο Claude API, και γράφει
 * ένα νέο entry στο CHANGELOG.md (τεχνική περιγραφή + περιγραφή για αρχάριο),
 * ανεβάζοντας παράλληλα το version στο package.json.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const CHANGELOG_PATH = path.join(ROOT, "CHANGELOG.md");
const PKG_PATH = path.join(ROOT, "package.json");

const ZERO_SHA = "0000000000000000000000000000000000000000";
const BEFORE_SHA = process.env.BEFORE_SHA || "";
const AFTER_SHA = process.env.AFTER_SHA || execSync("git rev-parse HEAD").toString().trim();
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MAX_DIFF_CHARS = 15000;

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, maxBuffer: 1024 * 1024 * 20 }).toString();
}

function getCommitMessages() {
  const range = BEFORE_SHA && BEFORE_SHA !== ZERO_SHA ? `${BEFORE_SHA}..${AFTER_SHA}` : AFTER_SHA;
  try {
    return sh(`git log ${range} --pretty=format:"- %s"`).trim() || "(no commit messages)";
  } catch {
    return sh(`git log -1 --pretty=format:"- %s"`).trim();
  }
}

function getDiff() {
  let diff;
  try {
    if (BEFORE_SHA && BEFORE_SHA !== ZERO_SHA) {
      diff = sh(`git diff ${BEFORE_SHA} ${AFTER_SHA} -- . ":(exclude)CHANGELOG.md"`);
    } else {
      diff = sh(`git show ${AFTER_SHA} --format="" -- . ":(exclude)CHANGELOG.md"`);
    }
  } catch (err) {
    diff = `(αδύνατη η ανάκτηση diff: ${err.message})`;
  }
  if (diff.length > MAX_DIFF_CHARS) {
    diff = diff.slice(0, MAX_DIFF_CHARS) + "\n\n... (το diff κόπηκε, ήταν πολύ μεγάλο)";
  }
  return diff || "(κενό diff)";
}

function bumpVersion(current, bump) {
  const [maj, min, patch] = current.split(".").map((n) => parseInt(n, 10) || 0);
  if (bump === "major") return `${maj + 1}.0.0`;
  if (bump === "minor") return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${patch + 1}`;
}

async function askClaude(commitMessages, diff) {
  const prompt = `Είσαι βοηθός που γράφει changelog entries για ένα project κτηνιατρικού λογισμικού (vet clinic).
Σου δίνω τα commit messages και το git diff ενός push. Γράψε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα JSON object (χωρίς markdown fences, χωρίς επιπλέον κείμενο) με αυτά τα πεδία:

{
  "bump": "patch" | "minor" | "major",
  "title": "πολύ σύντομος τίτλος της αλλαγής στα ελληνικά (max 8 λέξεις)",
  "technical": "τεχνική περιγραφή σε markdown bullet points (στα ελληνικά, με τεχνικούς όρους/ονόματα αρχείων/functions όπου χρειάζεται)",
  "simple": "περιγραφή σε απλά ελληνικά, σαν να εξηγείς σε κάποιον χωρίς τεχνικό υπόβαθρο τι άλλαξε και γιατί έχει σημασία γι' αυτόν"
}

Κανόνες για το "bump":
- "major" μόνο αν σπάει κάτι ή αλλάζει ριζικά συμπεριφορά
- "minor" αν προστίθεται νέο feature
- "patch" για fixes, μικρές αλλαγές, refactors, docs

Commit messages:
${commitMessages}

Git diff:
${diff}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text?.trim() || "{}";
  const cleaned = text.replace(/^```(json)?/, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

async function main() {
  if (!API_KEY) {
    console.error("Λείπει το ANTHROPIC_API_KEY — παραλείπεται η δημιουργία changelog entry.");
    process.exit(0);
  }

  const commitMessages = getCommitMessages();
  const diff = getDiff();

  if (diff === "(κενό diff)" && commitMessages === "(no commit messages)") {
    console.log("Τίποτα να καταγραφεί.");
    process.exit(0);
  }

  const result = await askClaude(commitMessages, diff);

  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, "utf8"));
  const newVersion = bumpVersion(pkg.version || "1.0.0", result.bump || "patch");
  pkg.version = newVersion;
  fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n", "utf8");

  const today = new Date().toISOString().split("T")[0];
  const shortSha = AFTER_SHA.slice(0, 7);

  const entry = `## v${newVersion} — ${today} (${shortSha})

### ${result.title || "Ενημέρωση"}

**🔧 Τεχνική περιγραφή**

${result.technical || "-"}

**🌱 Σε απλά λόγια**

${result.simple || "-"}

---

`;

  const existing = fs.existsSync(CHANGELOG_PATH)
    ? fs.readFileSync(CHANGELOG_PATH, "utf8")
    : "# Changelog\n\nΑυτόματο ιστορικό αλλαγών του project. Κάθε entry γράφεται αυτόματα μετά από push στο main.\n\n";

  const headerEnd = existing.indexOf("\n\n") + 2;
  const header = existing.slice(0, headerEnd);
  const rest = existing.slice(headerEnd);

  fs.writeFileSync(CHANGELOG_PATH, header + entry + rest, "utf8");

  console.log(`Γράφτηκε entry για v${newVersion}.`);
}

main().catch((err) => {
  console.error("Αποτυχία δημιουργίας changelog entry:", err);
  process.exit(0);
});
