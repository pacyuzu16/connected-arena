"use client";
/**
 * useSettings.js
 * --------------
 * Persistent per-fan preferences:
 *   - mutePredictions  : hide the YES/NO popup during shots/penalties
 *   - muteCommentary   : hide the bottom AI commentary bar
 *   - muteNotifications: silence the in-app notification bell
 *   - sound            : enable / disable sound effects
 *   - language         : ui language code ("en" | "fr" | "rw" | "sw")
 *
 * Stored under the single localStorage key "arena-settings".
 * Other tabs receive updates via the `storage` event listener.
 */

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "arena-settings";

const DEFAULTS = {
  mutePredictions:   false,
  muteCommentary:    false,
  muteNotifications: false,
  sound:             true,
  language:          "en",
};

function load() {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export default function useSettings() {
  const [settings, setSettings] = useState(DEFAULTS);

  // Hydrate from localStorage on mount (SSR-safe)
  useEffect(() => { setSettings(load()); }, []);

  // Cross-tab sync: react to changes from other tabs / windows
  useEffect(() => {
    function onStorage(e) {
      if (e.key === STORAGE_KEY) setSettings(load());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setSettings(DEFAULTS);
  }, []);

  return { settings, update, reset };
}
