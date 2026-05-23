"use client";

/**
 * useNotifications
 * ----------------
 * Three-layer notification system:
 *   1. In-app  — notification center (bell icon + panel)
 *   2. Browser — OS-level popup via Notification API when tab is hidden
 *   3. SW Push — background push when browser is closed (via service worker)
 *
 * Watches WebSocket events and player state, generates notifications
 * automatically for: goals, correct/wrong predictions, rank changes,
 * level-ups, achievement unlocks, half-time, and full-time.
 */

import { useState, useEffect, useCallback, useRef } from "react";

const LEVEL_THRESHOLDS = [0, 0, 100, 300, 600, 1000];

function getLevel(score) {
  if (score >= 1000) return 5;
  if (score >= 600)  return 4;
  if (score >= 300)  return 3;
  if (score >= 100)  return 2;
  return 1;
}

let _idSeq = 0;
function nextId() { return ++_idSeq; }

export default function useNotifications({ events, myPlayer, matchPhase, muted = false }) {
  const [permission, setPermission]   = useState("default");
  const [notifications, setNotifs]    = useState([]);
  const [unreadCount, setUnread]      = useState(0);
  const [open, setOpen]               = useState(false);

  const prevScoreRef  = useRef(null);
  const prevPredsRef  = useRef(null);
  const prevRankRef   = useRef(null);
  const prevLevelRef  = useRef(null);
  const prevPhaseRef  = useRef(null);
  const prevEvtId     = useRef(null);
  const swRegistered  = useRef(false);

  // ── Permission ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "denied";
    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm;
  }, []);

  // ── Service Worker registration ─────────────────────────────────────────

  useEffect(() => {
    if (swRegistered.current) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    swRegistered.current = true;
    navigator.serviceWorker
      .register("/sw.js")
      .then(reg => console.log("[SW] registered:", reg.scope))
      .catch(err => console.warn("[SW] registration failed:", err));
  }, []);

  // ── Core: add notification ───────────────────────────────────────────────

  const add = useCallback((notif) => {
    // Respect the user's "mute notifications" preference
    if (muted) return;

    const item = { id: nextId(), time: Date.now(), read: false, ...notif };
    setNotifs(prev => [item, ...prev].slice(0, 60));
    setUnread(c => c + 1);

    // (mute flag added to dep array further down)

    // Browser OS notification when tab is not visible
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted" &&
      typeof document !== "undefined" &&
      document.hidden
    ) {
      try {
        const n = new Notification(notif.title, {
          body: notif.body || "",
          icon: "/favicon.ico",
          tag:  `arena-${notif.type}`,    // group same-type notifications
          renotify: true,
        });
        n.onclick = () => { window.focus(); n.close(); };
      } catch (_) {}
    }
  }, [muted]);

  // ── Watch: match events (goals, cards, etc.) ────────────────────────────

  useEffect(() => {
    if (!events?.length) return;
    const latest = events[0];
    if (!latest || latest.id === prevEvtId.current) return;
    prevEvtId.current = latest.id;

    switch (latest.type) {
      case "GOAL":
        add({ type: "goal", emoji: "⚽", title: "GOAL!", body: `${latest.team} scored — predictions closing fast!` });
        break;
      case "PENALTY":
        add({ type: "event", emoji: "🔥", title: "Penalty awarded!", body: `${latest.team} — will they score?` });
        break;
      case "YELLOW_CARD":
        add({ type: "event", emoji: "🟨", title: "Yellow card!", body: `${latest.team} player booked.` });
        break;
      case "VAR":
        add({ type: "event", emoji: "👁️", title: "VAR review", body: "The referee is checking the monitors…" });
        break;
      default:
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  // ── Watch: XP / score change (prediction result) ────────────────────────

  useEffect(() => {
    if (!myPlayer) return;
    const score = myPlayer.score || 0;
    if (prevScoreRef.current === null) { prevScoreRef.current = score; return; }

    const diff = score - prevScoreRef.current;
    if (diff > 0) {
      add({ type: "xp", emoji: "✅", title: `+${diff} XP earned!`, body: "Correct prediction! Great call." });
    } else if (diff === 0 && (myPlayer.predictions || 0) > 0) {
      // Score didn't change but predictions went up → wrong prediction
      // Only fire if we can tell a resolution happened
    }
    prevScoreRef.current = score;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPlayer?.score]);

  // ── Watch: wrong prediction (predictions up, score unchanged) ────────────

  useEffect(() => {
    if (!myPlayer) return;
    const preds = myPlayer.predictions || 0;
    const score = myPlayer.score || 0;
    if (prevPredsRef.current === null) { prevPredsRef.current = preds; return; }

    const predsDiff = preds - prevPredsRef.current;
    const scoreDiff = score - (prevScoreRef.current ?? score);
    if (predsDiff > 0 && scoreDiff === 0) {
      add({ type: "wrong", emoji: "❌", title: "Wrong prediction", body: "Unlucky — keep going, you'll get the next one!" });
    }
    prevPredsRef.current = preds;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPlayer?.predictions]);

  // ── Watch: rank improvement ──────────────────────────────────────────────

  useEffect(() => {
    if (!myPlayer?.rank) return;
    const rank = myPlayer.rank;
    if (prevRankRef.current === null) { prevRankRef.current = rank; return; }

    if (rank < prevRankRef.current) {
      add({ type: "rank", emoji: "🏆", title: `Climbed to #${rank}!`, body: `Up from #${prevRankRef.current}. Keep predicting!` });
    }
    prevRankRef.current = rank;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPlayer?.rank]);

  // ── Watch: level up ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!myPlayer) return;
    const lvl = getLevel(myPlayer.score || 0);
    if (prevLevelRef.current === null) { prevLevelRef.current = lvl; return; }

    if (lvl > prevLevelRef.current) {
      const labels = ["", "Rookie", "Pro", "Elite", "Legend", "Apex"];
      add({
        type:  "levelup",
        emoji: "⭐",
        title: `Level ${lvl} unlocked!`,
        body:  `You are now ${labels[lvl]}. New achievements available.`,
      });
    }
    prevLevelRef.current = lvl;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPlayer?.score]);

  // ── Watch: match phase changes ───────────────────────────────────────────

  useEffect(() => {
    if (!matchPhase || matchPhase === prevPhaseRef.current) return;
    prevPhaseRef.current = matchPhase;

    switch (matchPhase) {
      case "live":
        add({ type: "phase", emoji: "🏁", title: "Match started!", body: "Predictions are live — make your calls!" });
        break;
      case "halftime":
        add({ type: "phase", emoji: "⏸️", title: "Half time", body: "Check the AI summary and leaderboard." });
        break;
      case "postmatch":
        add({ type: "phase", emoji: "🏆", title: "Full time!", body: "See your final score and weekly standings." });
        break;
      default:
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchPhase]);

  // ── Controls ─────────────────────────────────────────────────────────────

  const markAllRead = useCallback(() => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  }, []);

  const dismiss = useCallback((id) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    setUnread(c => Math.max(0, c - 1));
  }, []);

  // Never call setState inside another setState updater (causes React #423).
  // Instead toggle open, then a separate effect handles the read-marking.
  const togglePanel = useCallback(() => setOpen(o => !o), []);
  const closePanel  = useCallback(() => setOpen(false),   []);

  // Mark all as read whenever the panel opens
  useEffect(() => {
    if (!open) return;
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  }, [open]);

  return {
    permission,
    requestPermission,
    notifications,
    unreadCount,
    open,
    togglePanel,
    closePanel,
    markAllRead,
    dismiss,
  };
}
