"use client";
/**
 * useSquad.js  —  Friend Squads / Mini-Leagues
 * -------------------------------------------------------------------
 * Fully client-side squad system using localStorage. No backend
 * changes required.
 *
 * Data model (localStorage key "arena-squad"):
 *   {
 *     code:      "KAGAME",                          // 6-char share code
 *     name:      "The Champions",                   // display name
 *     createdAt: 1764000000000,                     // ms timestamp
 *     members:   [
 *       { playerId: "fan-abc123", name: "Alice", joinedAt: ... },
 *       ...
 *     ]
 *   }
 *
 * How it works:
 *   - Create:  generates a unique 6-char code and adds you as first member
 *   - Join:    enter someone's code → adds it to your local squad and
 *              records you as a member locally (other devices that
 *              already store the same code retain their own member list;
 *              the leaderboard view unions whatever each device knows)
 *   - Leave:   clears the local squad
 *   - AddMember: explicitly add a friend's playerId (handy when both
 *              devices are in the same room — share IDs to sync)
 *
 * The squad leaderboard is computed as: filter the global leaderboard
 * (from useWebSocket) by playerIds in the squad's member list.
 *
 * For the hackathon demo this delivers all the visible UX of a squad
 * system (create / join / list / filter leaderboard) without backend.
 */

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "arena-squad";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
function generateCode(len = 6) {
  if (typeof window === "undefined") return "------";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, n => CODE_CHARS[n % CODE_CHARS.length]).join("");
}

function load() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(squad) {
  if (typeof window === "undefined") return;
  try {
    if (squad) localStorage.setItem(STORAGE_KEY, JSON.stringify(squad));
    else       localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export default function useSquad({ myPlayerId, myName } = {}) {
  const [squad, setSquad] = useState(null);

  // Hydrate on mount
  useEffect(() => { setSquad(load()); }, []);

  // Cross-tab sync
  useEffect(() => {
    function onStorage(e) {
      if (e.key === STORAGE_KEY) setSquad(load());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ── Auto-add yourself as a member when you have an id and a squad ──
  useEffect(() => {
    if (!squad || !myPlayerId) return;
    const exists = squad.members.some(m => m.playerId === myPlayerId);
    if (exists) {
      // Keep your name fresh if it changed
      const me = squad.members.find(m => m.playerId === myPlayerId);
      if (me && me.name !== myName && myName) {
        const next = {
          ...squad,
          members: squad.members.map(m =>
            m.playerId === myPlayerId ? { ...m, name: myName } : m
          ),
        };
        setSquad(next); save(next);
      }
      return;
    }
    const next = {
      ...squad,
      members: [
        ...squad.members,
        { playerId: myPlayerId, name: myName || "You", joinedAt: Date.now() },
      ],
    };
    setSquad(next); save(next);
  }, [squad, myPlayerId, myName]);

  const create = useCallback((name) => {
    const code = generateCode(6);
    const next = {
      code,
      name: (name || "My Squad").trim().slice(0, 30) || "My Squad",
      createdAt: Date.now(),
      members: myPlayerId
        ? [{ playerId: myPlayerId, name: myName || "You", joinedAt: Date.now() }]
        : [],
    };
    setSquad(next); save(next);
    return next;
  }, [myPlayerId, myName]);

  const join = useCallback((code) => {
    const clean = (code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (clean.length !== 6) {
      throw new Error("Squad codes are 6 characters.");
    }
    const next = {
      code: clean,
      name: `Squad ${clean}`,
      createdAt: Date.now(),
      members: myPlayerId
        ? [{ playerId: myPlayerId, name: myName || "You", joinedAt: Date.now() }]
        : [],
    };
    setSquad(next); save(next);
    return next;
  }, [myPlayerId, myName]);

  const leave = useCallback(() => {
    setSquad(null); save(null);
  }, []);

  const rename = useCallback((name) => {
    setSquad(prev => {
      if (!prev) return prev;
      const next = { ...prev, name: (name || prev.name).trim().slice(0, 30) };
      save(next); return next;
    });
  }, []);

  const addMember = useCallback((playerId, name = "Friend") => {
    setSquad(prev => {
      if (!prev) return prev;
      if (prev.members.some(m => m.playerId === playerId)) return prev;
      const next = {
        ...prev,
        members: [...prev.members, { playerId, name, joinedAt: Date.now() }],
      };
      save(next); return next;
    });
  }, []);

  const removeMember = useCallback((playerId) => {
    setSquad(prev => {
      if (!prev) return prev;
      const next = { ...prev, members: prev.members.filter(m => m.playerId !== playerId) };
      save(next); return next;
    });
  }, []);

  return { squad, create, join, leave, rename, addMember, removeMember };
}
