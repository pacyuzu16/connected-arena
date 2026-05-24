"use client";

/**
 * useWebSocket.js
 * ---------------
 * Custom hook that manages the WebSocket connection lifecycle,
 * message parsing, and all derived state for the Connected Arena app.
 */

import { useState, useRef, useCallback, useEffect } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

const EVENT_EMOJIS = {
  GOAL:         "⚽",
  SHOT:         "🎯",
  PENALTY:      "🔥",
  YELLOW_CARD:  "🟨",
  FREE_KICK:    "🎯",
  VAR:          "👁️",
  SUBSTITUTION: "🔄",
  WHISTLE:      "🏁",
  CORNER:       "🚩",
  KICKOFF:      "🏈",
};

const EVENT_COLORS = {
  GOAL:         "#10b981",
  SHOT:         "#f59e0b",
  PENALTY:      "#ef4444",
  YELLOW_CARD:  "#eab308",
  FREE_KICK:    "#3b82f6",
  VAR:          "#8b5cf6",
  SUBSTITUTION: "#06b6d4",
  WHISTLE:      "#6b7280",
  CORNER:       "#f97316",
  KICKOFF:      "#6b7280",
};

const TEAM_NAMES = {
  "DFL-CLU-000001": "Hamburg",
  "DFL-CLU-000002": "Bayern",
};

const HOME_TEAM_ID = "DFL-CLU-000001"; // Hamburg = home

export default function useWebSocket(playerName) {
  const [connected, setConnected]         = useState(false);
  const [events, setEvents]               = useState([]);
  const [leaderboard, setLeaderboard]     = useState([]);
  const [commentary, setCommentary]       = useState(null);
  const [prediction, setPrediction]       = useState(null);
  const [predVoted, setPredVoted]         = useState(null);
  const [myScore, setMyScore]             = useState(0);
  const [myPlayer, setMyPlayer]           = useState(null);
  const [predCountdown, setPredCountdown] = useState(0);
  const [matchScore, setMatchScore]       = useState({ home: 0, away: 0 });
  const [matchMinute, setMatchMinute]     = useState(0);
  const [activityFeed, setActivityFeed]   = useState([]);
  const [recentActivity, setRecentActivity]         = useState([]);
  const [avatarUploadUrl, setAvatarUploadUrl]       = useState(null);
  const [chatMessages, setChatMessages]             = useState([]);
  const [suspended, setSuspended]                   = useState(false);
  // Match-day lifecycle
  const [matchPhase, setMatchPhase]         = useState("prematch"); // prematch|live|halftime|postmatch
  const [halfTimeScore, setHalfTimeScore]   = useState(null);       // score snapshot at HT
  const [halfTimeCommentary, setHalfTimeCommentary] = useState(null);
  const halfTimeFiredRef = useRef(false);

  const wsRef           = useRef(null);
  const countdownRef    = useRef(null);
  const refreshRef      = useRef(null);
  // Persist playerId so the same device always gets the same identity + XP
  const playerId = useRef((() => {
    if (typeof window === "undefined") return `fan-${Math.random().toString(36).slice(2,8)}`;
    let id = localStorage.getItem("arena-player-id");
    if (!id) { id = `fan-${Math.random().toString(36).slice(2,8)}`; localStorage.setItem("arena-player-id", id); }
    return id;
  })());
  const eventCountRef   = useRef(0);
  const prevLeaderRef   = useRef({});
  const prevMyPlayerRef = useRef(null);
  const lastPredRef     = useRef(null);

  // Request a fresh leaderboard (profile data) from the server
  const refreshLeaderboard = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "leaderboard" }));
    }
  }, []);

  // ── Message handlers ─────────────────────────────────────────────

  const handleMatchEvent = useCallback((event) => {
    const emoji = EVENT_EMOJIS[event.eventType] || "⚡";
    const color = EVENT_COLORS[event.eventType] || "#6b7280";

    // Track match minute (event count ≈ match minute in 90-event match)
    eventCountRef.current += 1;
    setMatchMinute(eventCountRef.current);

    // ── Match phase transitions ──────────────────────────────────────
    // First event: move from prematch → live
    if (eventCountRef.current === 1) setMatchPhase("live");

    if (event.eventType === "WHISTLE") {
      const min = eventCountRef.current;
      if (min >= 40 && min <= 58 && !halfTimeFiredRef.current) {
        // Half-time whistle
        halfTimeFiredRef.current = true;
        setMatchPhase("halftime");
        setHalfTimeScore(prev => prev); // snapshot taken below via setState callback
        setMatchScore(current => {
          setHalfTimeScore(current);
          return current;
        });
      } else if (min > 58) {
        // Full-time whistle
        setMatchPhase("postmatch");
      }
    }

    // Track score from GOAL events
    if (event.eventType === "GOAL") {
      setMatchScore(prev => ({
        home: event.team === HOME_TEAM_ID ? prev.home + 1 : prev.home,
        away: event.team === HOME_TEAM_ID ? prev.away : prev.away + 1,
      }));
    }

    setEvents(prev => [{
      id:     Date.now(),
      emoji,
      color,
      type:   event.eventType,
      team:   TEAM_NAMES[event.team] || event.team || "—",
      time:   event.eventTime ? event.eventTime.slice(11, 16) : "--:--",
      points: event.pointsAvailable,
    }, ...prev].slice(0, 30));

    if (event.predictionWindow > 0) {
      setPrediction({
        eventId:      event.eventId,
        eventType:    event.eventType,
        emoji,
        team:         TEAM_NAMES[event.team] || event.team,
        points:       event.pointsAvailable,
        total:        event.predictionWindow,
        xg:           event.xg           ?? null,
        xgSource:     event.xgSource     ?? null,
        xgLabel:      event.xgLabel      ?? null,
        xgMultiplier: event.xgMultiplier ?? 1,
      });
      setPredCountdown(event.predictionWindow);

      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setPredCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            setPrediction(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Refresh leaderboard after goal or whistle (scores may have changed)
    if ((event.eventType === "GOAL" || event.eventType === "WHISTLE") && wsRef.current) {
      setTimeout(() => wsRef.current?.send(JSON.stringify({ action: "leaderboard" })), 2000);
    }
  }, []);

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case "MATCH_EVENT":
        handleMatchEvent(data.event);
        break;
      case "LEADERBOARD": {
        setLeaderboard(data.players);
        // Find self by playerId first (reliable), fall back to name
        const me = data.players.find(p => p.playerId === playerId.current)
                || data.players.find(p => p.name === playerName);
        if (me) {
          setMyScore(me.score);
          setMyPlayer(me);

          // Detect a resolved prediction for the current player
          const prevMe = prevMyPlayerRef.current;
          if (prevMe) {
            const predsDiff   = (me.predictions || 0) - (prevMe.predictions || 0);
            const correctDiff = (me.correct || 0)     - (prevMe.correct || 0);
            if (predsDiff > 0) {
              const wasCorrect = correctDiff > 0;
              const xpEarned   = wasCorrect ? Math.max(0, (me.score || 0) - (prevMe.score || 0)) : 0;
              const lp = lastPredRef.current;
              setRecentActivity(prev => [{
                id:        `${Date.now()}-ra`,
                eventType: lp?.eventType || "PREDICTION",
                emoji:     lp?.emoji     || "🎯",
                correct:   wasCorrect,
                xp:        xpEarned,
                time:      Date.now(),
              }, ...prev].slice(0, 10));
            }
          }
          prevMyPlayerRef.current = me;
        }
        // Diff full leaderboard to build activity feed
        const now = Date.now();
        const newActivities = [];
        data.players.forEach(p => {
          const prev = prevLeaderRef.current[p.playerId];
          if (prev && p.score > prev.score) {
            const earned = p.score - prev.score;
            newActivities.push({
              id: `${p.playerId}-${now}`,
              text: `${p.name} earned +${earned} XP`,
              xp: earned,
              time: now,
            });
          }
        });
        if (newActivities.length) {
          setActivityFeed(prev => [...newActivities, ...prev].slice(0, 20));
        }
        const lb = {};
        data.players.forEach(p => { lb[p.playerId] = p; });
        prevLeaderRef.current = lb;
        break;
      }
      case "AI_COMMENTARY":
        setCommentary({ text: data.commentary, eventType: data.eventType });
        // If this commentary fires during half-time, keep it as the HT summary
        if (data.eventType === "WHISTLE") {
          setHalfTimeCommentary(data.commentary);
        }
        setTimeout(() => setCommentary(null), 9000);
        break;
      case "ACCOUNT_STATUS":
        setSuspended(!!data.suspended);
        break;
      case "AVATAR_UPLOAD_URL":
        setAvatarUploadUrl({ url: data.url, avatarUrl: data.avatarUrl });
        break;
      case "CHAT_MESSAGE":
        setChatMessages(prev => {
          // Skip if we already injected this message locally (same name + text within 5s)
          const isDupe = prev.some(m =>
            m._local &&
            m.name === data.name &&
            m.message === data.message &&
            Math.abs(m.time - data.time) < 5000
          );
          if (isDupe) return prev;
          // Also skip if the same id is already present (history echo)
          if (prev.some(m => m.id === data.id)) return prev;
          return [
            { id: data.id, name: data.name, message: data.message, time: data.time, xpEarned: data.xpEarned },
            ...prev,
          ].slice(0, 100);
        });
        break;

      case "CHAT_HISTORY": {
        // Server sends chronological (oldest first); UI shows newest first.
        // Merge with any locally-shown messages, dedupe by id, keep newest 100.
        const incoming = (data.messages || []).map(m => ({
          id:       m.id,
          name:     m.name,
          message:  m.message,
          time:     m.time,
          xpEarned: m.xpEarned,
        }));
        setChatMessages(prev => {
          const seen = new Set(prev.map(m => m.id));
          const merged = [...incoming.filter(m => !seen.has(m.id)).reverse(), ...prev];
          return merged.slice(0, 100);
        });
        break;
      }
      default:
        break;
    }
  }, [playerName, handleMatchEvent]);

  // ── Connect ──────────────────────────────────────────────────────

  // avatarUpload: request a presigned S3 URL from the server
  const requestAvatarUpload = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action:   "avatarUpload",
        playerId: playerId.current,
      }));
    }
  }, []);

  const connect = useCallback((name, persona, jwtToken = null) => {
    if (!WS_URL) {
      console.error("NEXT_PUBLIC_WS_URL is not set. Check frontend/.env.local");
      return;
    }
    // If Cognito JWT is available, pass it so the authorizer validates it.
    // The backend will use the sub claim as playerId.
    let url = `${WS_URL}?playerId=${playerId.current}&name=${encodeURIComponent(name)}&persona=${persona}`;
    if (jwtToken) url += `&token=${encodeURIComponent(jwtToken)}`;
    const ws  = new WebSocket(url);

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ action: "leaderboard" }));
      // Refresh every 30 s so profile always has live data
      if (refreshRef.current) clearInterval(refreshRef.current);
      refreshRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: "leaderboard" }));
        }
      }, 30000);
    };
    ws.onclose = () => {
      setConnected(false);
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
    ws.onmessage = (m) => handleMessage(JSON.parse(m.data));
    wsRef.current = ws;
  }, [handleMessage]);

  // Clean up interval on unmount
  useEffect(() => () => {
    if (refreshRef.current) clearInterval(refreshRef.current);
  }, []);

  // ── Send chat message ────────────────────────────────────────────

  const sendChat = useCallback((message) => {
    if (!message?.trim()) return;
    const text = message.trim();

    // Always inject locally so the UI works for demo even without backend route
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setChatMessages(prev => [
      { id: localId, name: playerName || "You", message: text, time: Date.now(), _local: true },
      ...prev,
    ].slice(0, 100));

    // Also fire to WebSocket if connected (backend will broadcast to others)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action:   "chat",
        message:  text,
        name:     playerName,
        playerId: playerId.current,
      }));
    }
  }, [playerName]);

  // ── Send prediction ──────────────────────────────────────────────

  const sendPrediction = useCallback((answer) => {
    if (!prediction || !wsRef.current) return;
    lastPredRef.current = {
      eventType: prediction.eventType,
      emoji:     prediction.emoji,
      answer,
    };
    wsRef.current.send(JSON.stringify({
      action:     "predict",
      eventId:    prediction.eventId,
      eventType:  prediction.eventType,
      prediction: answer,
      playerId:   playerId.current,
    }));
    clearInterval(countdownRef.current);
    setPredVoted(answer); // show crowd-reveal for 2.5 s, then dismiss
    setTimeout(() => {
      setPrediction(null);
      setPredVoted(null);
      refreshLeaderboard();
    }, 2500);
  }, [prediction, refreshLeaderboard]);

  return {
    connected,
    predVoted,
    matchPhase,
    halfTimeScore,
    halfTimeCommentary,
    events,
    leaderboard,
    commentary,
    prediction,
    myScore,
    myPlayer,
    predCountdown,
    matchScore,
    matchMinute,
    activityFeed,
    recentActivity,
    connect,
    sendPrediction,
    sendChat,
    refreshLeaderboard,
    requestAvatarUpload,
    avatarUploadUrl,
    chatMessages,
    suspended,
  };
}
