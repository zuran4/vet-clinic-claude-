// src/utils/resolveUploadUrl.js
import { API_BASE_URL } from "../api/apiClient.js";

// Το backend επιστρέφει σχετικό path (π.χ. "/uploads/xxx.png") — το αρχείο
// σερβίρεται από το ΙΔΙΟ origin με το API, όχι από το frontend, οπότε πρέπει
// να το κάνουμε absolute πριν το βάλουμε σε <img src>.
const UPLOADS_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export function resolveUploadUrl(url) {
  if (!url || /^https?:\/\//i.test(url)) return url;
  return `${UPLOADS_ORIGIN}${url}`;
}
