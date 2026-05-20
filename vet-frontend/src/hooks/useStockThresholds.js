// src/hooks/useStockThresholds.js
import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "stockThresholds";
const DEFAULT_THRESHOLDS = { _global: { low: 5, ok: 20 }, _byCategory: {} };

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THRESHOLDS;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || !parsed._global || !parsed._byCategory) {
      return DEFAULT_THRESHOLDS;
    }
    return {
      _global: {
        low: Number(parsed._global?.low ?? 5),
        ok: Number(parsed._global?.ok ?? 20),
      },
      _byCategory: parsed._byCategory || {},
    };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}
function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function useStockThresholds() {
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  useEffect(() => { setThresholds(loadFromStorage()); }, []);
  useEffect(() => { saveToStorage(thresholds); }, [thresholds]);

  const setGlobalThresholds = useCallback(({ low, ok }) => {
    setThresholds((prev) => ({ ...prev, _global: { low: Number(low), ok: Number(ok) } }));
  }, []);

  const setCategoryThresholds = useCallback((categoryId, { low, ok }) => {
    setThresholds((prev) => ({
      ...prev,
      _byCategory: { ...prev._byCategory, [categoryId]: { low: Number(low), ok: Number(ok) } },
    }));
  }, []);

  const removeCategoryThresholds = useCallback((categoryId) => {
    setThresholds((prev) => {
      const next = { ...prev._byCategory };
      delete next[categoryId];
      return { ...prev, _byCategory: next };
    });
  }, []);

  const importThresholds = useCallback((incoming) => {
    if (!incoming || typeof incoming !== "object") return false;
    const gl = incoming._global ?? {};
    const by = incoming._byCategory ?? {};
    const next = {
      _global: {
        low: Number(gl.low ?? DEFAULT_THRESHOLDS._global.low),
        ok: Number(gl.ok ?? DEFAULT_THRESHOLDS._global.ok),
      },
      _byCategory: {},
    };
    for (const [cat, val] of Object.entries(by)) {
      if (!val) continue;
      next._byCategory[cat] = {
        low: Number(val.low ?? DEFAULT_THRESHOLDS._global.low),
        ok: Number(val.ok ?? DEFAULT_THRESHOLDS._global.ok),
      };
    }
    setThresholds(next);
    return true;
  }, []);

  const exportThresholds = useCallback(() => thresholds, [thresholds]);

  const getThresholdForCategory = useCallback(
    (categoryId) => thresholds._byCategory[categoryId] ?? thresholds._global,
    [thresholds]
  );

  const summary = useMemo(() => {
    const count = Object.keys(thresholds._byCategory).length;
    return { categoriesWithOverrides: count };
  }, [thresholds]);

  return {
    thresholds,
    setGlobalThresholds,
    setCategoryThresholds,
    removeCategoryThresholds,
    importThresholds,
    exportThresholds,
    getThresholdForCategory,
    summary,
  };
}
