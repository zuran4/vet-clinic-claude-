// vet-api/scripts/registry-worker/lifecycle.mjs

export function installGracefulShutdown({ context, server }) {
  let isShuttingDown = false;

  const closeServer = (srv) =>
    new Promise((resolve) => {
      if (!srv || typeof srv.close !== "function") return resolve();
      try {
        srv.close(() => resolve());
      } catch {
        resolve();
      }
    });

  const closeContext = async (ctx) => {
    if (!ctx || typeof ctx.close !== "function") return;
    try {
      await ctx.close();
    } catch {
      // ignore
    }
  };

  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n[Registry worker] Shutting down (${signal})...`);

    // Προσπαθούμε να κλείσουμε gracefully, αλλά δεν κολλάμε για πάντα.
    const TIMEOUT_MS = 8000;

    try {
      await Promise.race([
        (async () => {
          await closeServer(server);
          await closeContext(context);
        })(),
        new Promise((resolve) => setTimeout(resolve, TIMEOUT_MS)),
      ]);
    } finally {
      // 0 = normal termination by signal
      process.exit(0);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
