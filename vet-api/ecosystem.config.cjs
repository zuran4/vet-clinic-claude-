// PM2 ecosystem config — vet project
// Χρήση: pm2 start ecosystem.config.cjs
// Πρέπει να είναι .cjs γιατί το PM2 χρησιμοποιεί CommonJS require()

module.exports = {
  apps: [
    {
      name: "synthetic-user-cron",
      script: "scripts/synthetic-user.mjs",
      // Τρέχει κάθε 6 ώρες — διαβάζει SYNTHETIC_USER_PIN από .env μέσω dotenv
      cron_restart: "0 */6 * * *",
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "vet-api",
      script: "server.js",
      node_args: "--import ./instrument.js",
      watch: false,
      autorestart: true,
      restart_delay: 2000,
      max_restarts: 10,
      min_uptime: "10s",
      env: {
        NODE_ENV: "production",
      },
    },
    // Το "registry-worker" ΔΕΝ είναι πια στατικό PM2 app — κάθε κλινική τρέχει
    // τον δικό της, ξεκινάει δυναμικά μέσω services/registryWorkerLauncher.js
    // (αυτόματα on-demand, ή χειροκίνητα από Ρυθμίσεις → GOV).
  ],
};
