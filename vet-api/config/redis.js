// config/redis.js
import { Redis } from "ioredis";

// 🔹 Παίρνουμε URL από env (π.χ. REDIS_URL στο Render / local)
const REDIS_URL = process.env.REDIS_URL;

// Θα κρατήσουμε και redisConnection για όποιον το χρησιμοποιεί αλλού
// αλλά ΔΕΝ θα προσπαθούμε να συνδεθούμε αν δεν υπάρχει REDIS_URL.
let redis = null;
let redisConnection = null;

if (REDIS_URL) {
  // ✅ Production / online Redis (ή ό,τι URL δώσουμε)
  redisConnection = REDIS_URL;

  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  redis.on("connect", () => {
    console.log("[Redis] Connected to", REDIS_URL);
  });

  redis.on("error", (err) => {
    console.error("[Redis] Error:", err.message || err);
  });
} else {
  // ❗ Δεν έχουμε REDIS_URL → δεν συνδεόμαστε καθόλου
  console.warn(
    "[Redis] REDIS_URL is not set. Redis client is DISABLED in this environment."
  );
}

// Εξάγουμε όπως πριν, για να μην σπάσει κανένα import
export { redis, redisConnection };
