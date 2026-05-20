// vet-frontend/src/components/registry/utils/registryHistoryStorage.js

export const REGISTRY_MICROCHIP_HISTORY_STORAGE_KEY =
  "vet_registry_microchip_history_v1";

export function loadRegistryMicrochipHistory() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(
      REGISTRY_MICROCHIP_HISTORY_STORAGE_KEY
    );
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch (err) {
    console.error(
      "[registryHistoryStorage] Failed to load history from localStorage:",
      err
    );
    return [];
  }
}

export function saveRegistryMicrochipHistory(items) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      REGISTRY_MICROCHIP_HISTORY_STORAGE_KEY,
      JSON.stringify(items)
    );
  } catch (err) {
    console.error(
      "[registryHistoryStorage] Failed to save history to localStorage:",
      err
    );
  }
}
