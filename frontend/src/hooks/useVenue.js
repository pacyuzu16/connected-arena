"use client";
/**
 * useVenue.js  —  active stadium context, localStorage backed.
 *
 * When a user enters a venue via /venues/[code], we persist the choice
 * here so the arena chrome can show "Watching from Volksparkstadion"
 * across refreshes. Switching venues from /venues just overwrites the
 * stored code.
 */

import { useEffect, useState, useCallback } from "react";
import { findVenue } from "../data/venues";

const STORAGE_KEY = "arena-active-venue";

function read() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch { return null; }
}

export default function useVenue() {
  const [code, setCode] = useState(null);

  useEffect(() => { setCode(read()); }, []);

  // Cross-tab sync
  useEffect(() => {
    function onStorage(e) {
      if (e.key === STORAGE_KEY) setCode(read());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setVenue = useCallback((nextCode) => {
    try {
      if (nextCode) {
        localStorage.setItem(STORAGE_KEY, nextCode.toUpperCase());
        setCode(nextCode.toUpperCase());
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setCode(null);
      }
    } catch {}
  }, []);

  const venue = findVenue(code);

  return { venue, code, setVenue };
}
