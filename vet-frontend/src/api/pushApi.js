// src/api/pushApi.js
import request from "./apiClient";

export const getVapidPublicKey = () => request("/push/vapid-public-key");

export const subscribePush = (subscription) =>
  request("/push/subscribe", { method: "POST", body: subscription });

export const unsubscribePush = (endpoint) =>
  request("/push/unsubscribe", { method: "POST", body: { endpoint } });
