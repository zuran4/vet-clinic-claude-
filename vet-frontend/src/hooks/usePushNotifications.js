// src/hooks/usePushNotifications.js
import { useCallback, useEffect, useState } from "react";
import { getVapidPublicKey, subscribePush, unsubscribePush } from "../api/pushApi";

// Το applicationServerKey χρειάζεται Uint8Array, όχι το base64url string.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  const [permission, setPermission] = useState(supported ? Notification.permission : "unsupported");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, [supported]);

  const enable = useCallback(async () => {
    if (!supported) {
      setError("Οι ειδοποιήσεις δεν υποστηρίζονται σε αυτή τη συσκευή/browser.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setError("Δεν δόθηκε άδεια για ειδοποιήσεις.");
        return;
      }

      const { publicKey } = await getVapidPublicKey();
      if (!publicKey) {
        setError("Οι ειδοποιήσεις δεν έχουν ρυθμιστεί ακόμα από τον διαχειριστή.");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await subscribePush(sub.toJSON());
      setSubscribed(true);
    } catch (err) {
      setError(err?.message || "Αποτυχία ενεργοποίησης ειδοποιήσεων.");
    } finally {
      setBusy(false);
    }
  }, [supported]);

  const disable = useCallback(async () => {
    if (!supported) return;
    setBusy(true);
    setError("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      setError(err?.message || "Αποτυχία απενεργοποίησης ειδοποιήσεων.");
    } finally {
      setBusy(false);
    }
  }, [supported]);

  return { supported, permission, subscribed, busy, error, enable, disable };
}
