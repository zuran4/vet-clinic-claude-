// services/pushService.js
//
// Στέλνει Web Push ειδοποιήσεις (σαν Viber/WhatsApp) σε όλες τις
// εγγεγραμμένες συσκευές μιας κλινικής. Σιωπηλά ανενεργό αν δεν έχουν
// ρυθμιστεί VAPID keys (config.vapid) — δεν μπλοκάρει τίποτα άλλο.
import webpush from "web-push";

import logger from "../utils/logger.js";
import config from "../config/index.js";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  if (!config.vapid.publicKey || !config.vapid.privateKey) return false;
  webpush.setVapidDetails(config.vapid.subject, config.vapid.publicKey, config.vapid.privateKey);
  configured = true;
  return true;
}

/**
 * Στέλνει push notification σε όλες τις συσκευές μιας κλινικής που έχουν
 * ενεργοποιήσει ειδοποιήσεις. Αφαιρεί αυτόματα subscriptions που η ίδια η
 * υπηρεσία push (browser) λέει ότι δεν ισχύουν πια (410/404 — π.χ. ο χρήστης
 * αποεγκατέστησε την εφαρμογή ή απενεργοποίησε τις ειδοποιήσεις).
 */
export async function sendPushToClinic(clinicId, { PushSubscription, Message }, payload) {
  if (!ensureConfigured()) return;

  const subs = await PushSubscription.find();
  if (subs.length === 0) return;

  // Το badgeCount ενημερώνει το κόκκινο badge στο εικονίδιο ΜΕΣΑ από το
  // service worker (navigator.setAppBadge) — δουλεύει και όσο η εφαρμογή
  // είναι κλειστή, σε αντίθεση με το να το ενημερώνει μόνο η ανοιχτή σελίδα.
  const badgeCount = Message
    ? await Message.countDocuments({ direction: "inbound", read: false })
    : undefined;

  const body = JSON.stringify({ ...payload, badgeCount });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          body
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          logger.warn(`⚠️ [${clinicId}] Αποτυχία push notification: ${err.message}`);
        }
      }
    })
  );
}
