// queues/notificationsQueue.js
import { Queue } from "bullmq";

import { redisConnection } from "../config/redis.js";

// Δημιουργούμε την ουρά μόνο αν υπάρχει σύνδεση Redis
export const notificationsQueue = redisConnection
  ? new Queue("notifications", { connection: redisConnection })
  : null;
