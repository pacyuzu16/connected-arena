"use client";
/**
 * useQuests.js  —  Daily Quests / Missions system
 * -------------------------------------------------------------------
 * Quests reset every calendar day. Progress is tracked in localStorage
 * so it survives refreshes and reconnects.
 *
 * Quest model:
 *   {
 *     id:           "predict3",
 *     title:        "Make 3 predictions",
 *     description:  "Tap YES or NO on three live events",
 *     target:       3,
 *     reward:       10,        // XP awarded on claim
 *     metric:       "predictions",  // which counter feeds it
 *     iconKey:      "target",  // resolved to a Lucide icon in the component
 *   }
 *
 * State per day:
 *   {
 *     date:      "YYYY-MM-DD",
 *     counters:  { predictions: N, chat: N, xp: N, streak: N, lowXgGoals: N },
 *     claimed:   ["predict3", "chat5"],
 *   }
 *
 * Public API:
 *   const { quests, state, increment, claim, isReady, claimedXp } = useQuests({ myPlayer, chatCount });
 *
 *   - quests       : array of quest definitions enriched with { current, isDone, isClaimed }
 *   - increment(metric, byAmount=1)  : bump a counter
 *   - claim(questId)                 : mark a finished quest as claimed
 *   - isReady(questId)               : convenience helper
 *   - claimedXp                      : total XP claimed today
 */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";

const STORAGE_KEY = "arena-quest-state";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const FRESH = (date) => ({
  date,
  counters: { predictions: 0, chat: 0, xp: 0, streak: 0, lowXgGoals: 0 },
  claimed:  [],
});

function loadState() {
  if (typeof window === "undefined") return FRESH(todayKey());
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return FRESH(todayKey());
    const parsed = JSON.parse(raw);
    if (parsed.date !== todayKey()) return FRESH(todayKey());
    return { ...FRESH(todayKey()), ...parsed };
  } catch {
    return FRESH(todayKey());
  }
}

function saveState(state) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

// ── Quest definitions ────────────────────────────────────────────────
export const QUEST_DEFINITIONS = [
  {
    id: "predict3",
    title: "Make 3 predictions",
    description: "Vote YES or NO on three live events",
    target: 3,
    reward: 10,
    metric: "predictions",
    iconKey: "target",
  },
  {
    id: "chat5",
    title: "Send 5 chat messages",
    description: "Get in on the live conversation",
    target: 5,
    reward: 5,
    metric: "chat",
    iconKey: "messageSquare",
  },
  {
    id: "streak3",
    title: "Get a 3-prediction win streak",
    description: "Three correct picks in a row",
    target: 3,
    reward: 25,
    metric: "streak",
    iconKey: "flame",
  },
  {
    id: "xp100",
    title: "Earn 100 XP today",
    description: "Build your score across the match",
    target: 100,
    reward: 15,
    metric: "xp",
    iconKey: "sparkles",
  },
  {
    id: "lowxg1",
    title: "Predict a long-shot goal",
    description: "Get a low-probability (<15% xG) goal right",
    target: 1,
    reward: 30,
    metric: "lowXgGoals",
    iconKey: "zap",
  },
];

export default function useQuests({ myPlayer, chatCount = 0, settings } = {}) {
  const [state, setState] = useState(() => FRESH(todayKey()));

  // Hydrate from localStorage on mount (SSR-safe)
  useEffect(() => { setState(loadState()); }, []);

  // Refresh state at midnight (catch users who keep the tab open overnight)
  useEffect(() => {
    const id = setInterval(() => {
      setState(s => s.date === todayKey() ? s : FRESH(todayKey()));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // Persist on any change
  useEffect(() => { saveState(state); }, [state]);

  // ── Tracking hooks: feed counters from external state ──────────────
  // 1. XP earned during the day = (current score) − (score at start of day)
  const baseXpRef = useRef(null);
  useEffect(() => {
    if (!myPlayer || baseXpRef.current !== null) return;
    baseXpRef.current = myPlayer.score || 0;
  }, [myPlayer]);

  useEffect(() => {
    if (!myPlayer || baseXpRef.current === null) return;
    const earned = Math.max(0, (myPlayer.score || 0) - baseXpRef.current);
    setState(s => s.counters.xp === earned ? s : { ...s, counters: { ...s.counters, xp: earned } });
  }, [myPlayer?.score]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Streak — read from myPlayer directly (server-of-truth)
  useEffect(() => {
    if (!myPlayer) return;
    const streak = myPlayer.winStreak || 0;
    setState(s => {
      // We track MAX streak seen today, not current streak
      const best = Math.max(s.counters.streak, streak);
      return best === s.counters.streak ? s : { ...s, counters: { ...s.counters, streak: best } };
    });
  }, [myPlayer?.winStreak]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Chat messages — caller passes the count
  useEffect(() => {
    setState(s => s.counters.chat === chatCount ? s : { ...s, counters: { ...s.counters, chat: chatCount } });
  }, [chatCount]);

  // ── Public API ────────────────────────────────────────────────────
  const increment = useCallback((metric, by = 1) => {
    setState(s => ({
      ...s,
      counters: { ...s.counters, [metric]: (s.counters[metric] || 0) + by },
    }));
  }, []);

  const claim = useCallback((questId) => {
    setState(s => s.claimed.includes(questId) ? s : { ...s, claimed: [...s.claimed, questId] });
  }, []);

  // Enriched quest list — combines definitions with live state
  const quests = useMemo(() => {
    return QUEST_DEFINITIONS.map(q => {
      const current   = state.counters[q.metric] || 0;
      const isDone    = current >= q.target;
      const isClaimed = state.claimed.includes(q.id);
      return { ...q, current, isDone, isClaimed };
    });
  }, [state]);

  const isReady = useCallback(
    (id) => quests.some(q => q.id === id && q.isDone && !q.isClaimed),
    [quests]
  );

  const claimedXp = useMemo(
    () => quests.reduce((sum, q) => sum + (q.isClaimed ? q.reward : 0), 0),
    [quests]
  );

  return { quests, state, increment, claim, isReady, claimedXp };
}
