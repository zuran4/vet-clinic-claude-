// scripts/registry-login-test.mjs
import { testRegistryLogin } from "../services/registryScraper.js";


async function main() {
  console.log("Ξεκινάει το test login προς το registry...");

  const result = await testRegistryLogin();

  console.log("✅ Το test ολοκληρώθηκε. Αποτελέσματα:");
  console.log(result);
}

main().catch((err) => {
  console.error("❌ Σφάλμα στο registry login test:", err);
  process.exit(1);
});
