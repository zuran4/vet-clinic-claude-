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
    {
      name: "registry-worker",
      script: "scripts/registry-worker.mjs",
      watch: false,
      autorestart: true,
      // Μεγαλύτερο delay γιατί ο browser χρειάζεται χρόνο να σηκωθεί
      restart_delay: 8000,
      exp_backoff_restart_delay: 100,
      max_restarts: 5,
      min_uptime: "15s",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
