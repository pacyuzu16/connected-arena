"use client";
/**
 * /stadium  —  Big-screen / jumbotron view of Connected Arena
 * -------------------------------------------------------------------
 * Designed for TVs, projectors, bar screens, watch-party hosts.
 * Opens without authentication, displays:
 *
 *   • Massive match scoreboard (team codes + score)
 *   • Live fan count and active-match indicator
 *   • Top-3 podium (huge avatars + XP)
 *   • Rolling event ticker at the bottom
 *   • Full-screen GOAL splash when a goal is scored
 *
 * Connects to the existing WebSocket as a passive observer
 * (playerId="stadium-display") — no XP, no predictions, no chat.
 *
 * Optimised for landscape 1920×1080. Pure dark theme, no scroll.
 */

import { useState, useEffect, useRef } from "react";
import Logo from "../../components/Logo";
import {
  Radio, Users, Maximize2, Trophy, Activity, X,
} from "lucide-react";

const WS_URL    = process.env.NEXT_PUBLIC_WS_URL || "";
const HOME_TEAM = "DFL-CLU-000001";
const TEAMS     = { "DFL-CLU-000001": "HAM", "DFL-CLU-000002": "BAY" };
const TEAM_FULL = { "DFL-CLU-000001": "HAMBURG", "DFL-CLU-000002": "BAYERN" };

const EVENT_ICON = {
  GOAL:        "GOAL",
  SHOT:        "SHOT",
  PENALTY:     "PENALTY",
  YELLOW_CARD: "YELLOW CARD",
  FREE_KICK:   "FREE KICK",
  VAR:         "VAR CHECK",
  CORNER:      "CORNER",
  WHISTLE:     "WHISTLE",
};

export default function StadiumPage() {
  const [wsStatus,   setWsStatus]   = useState("idle");
  const [players,    setPlayers]    = useState([]);
  const [events,     setEvents]     = useState([]);
  const [matchScore, setMatchScore] = useState({ home: 0, away: 0 });
  const [eventCount, setEventCount] = useState(0);
  const [splash,     setSplash]     = useState(null);   // { event } big alert
  const [now,        setNow]        = useState(Date.now());
  const [fullscreen, setFullscreen] = useState(false);
  const wsRef = useRef(null);

  // ── tick clock so relative times stay fresh ──────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── WebSocket connection ────────────────────────────────────────
  useEffect(() => {
    if (!WS_URL) { setWsStatus("error"); return; }
    const url = `${WS_URL}?playerId=stadium-display&name=STADIUM&persona=stats_nerd`;
    let ws;
    try { ws = new WebSocket(url); }
    catch { setWsStatus("error"); return; }

    setWsStatus("connecting");
    ws.onopen  = () => {
      setWsStatus("connected");
      ws.send(JSON.stringify({ action: "leaderboard" }));
    };
    ws.onclose = () => setWsStatus("idle");
    ws.onerror = () => setWsStatus("error");
    ws.onmessage = (m) => {
      let data; try { data = JSON.parse(m.data); } catch { return; }

      if (data.type === "LEADERBOARD") setPlayers(data.players || []);

      if (data.type === "MATCH_EVENT") {
        const ev   = data.event || {};
        const type = ev.eventType || "?";
        const team = ev.team     || "";
        setEventCount(c => c + 1);

        if (type === "GOAL") {
          setMatchScore(p => ({
            home: team === HOME_TEAM ? p.home + 1 : p.home,
            away: team === HOME_TEAM ? p.away      : p.away + 1,
          }));
          setSplash({ type: "GOAL", team, time: Date.now() });
          setTimeout(() => setSplash(s => (s && s.time === splashTimeRef.current) ? null : s), 4000);
          splashTimeRef.current = Date.now();
        } else if (type === "PENALTY" || type === "VAR") {
          setSplash({ type, team, time: Date.now() });
          splashTimeRef.current = Date.now();
          setTimeout(() => setSplash(s => (s && s.time === splashTimeRef.current) ? null : s), 3000);
        }

        setEvents(prev => [{
          id: Date.now() + Math.random(),
          type,
          team: TEAMS[team] || team || "—",
          time: Date.now(),
          label: EVENT_ICON[type] || type,
        }, ...prev].slice(0, 6));
      }
    };
    wsRef.current = ws;
    return () => { if (ws) { ws.onclose = null; ws.close(); } };
  }, []);

  // Refresh leaderboard every 8 s for a lively display
  useEffect(() => {
    const id = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: "leaderboard" }));
      }
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // Track the most recent splash time so we don't dismiss a newer one
  const splashTimeRef = useRef(null);

  // ── Fullscreen helper ───────────────────────────────────────────
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {});
    }
  }

  const podium = players.slice(0, 3);
  const fanCount = players.length;
  const matchMin = Math.min(90, eventCount);

  return (
    <div className="stadium-shell">

      {/* ── Top bar: brand + LIVE + fans + fullscreen ── */}
      <header className="stadium-topbar">
        <div className="stadium-brand">
          <Logo size={42} className="stadium-brand-mark" />
          <div className="stadium-brand-text">
            <div className="stadium-brand-title">CONNECTED ARENA</div>
            <div className="stadium-brand-sub">STADIUM DISPLAY</div>
          </div>
        </div>

        <div className="stadium-status-row">
          <div className={`stadium-live ${wsStatus === "connected" ? "is-on" : "is-off"}`}>
            <Radio size={14} strokeWidth={2} />
            <span>{wsStatus === "connected" ? "LIVE" : wsStatus === "connecting" ? "CONNECTING" : "OFFLINE"}</span>
          </div>
          <div className="stadium-fans">
            <Users size={14} strokeWidth={2} />
            <span>{fanCount.toLocaleString()} FANS</span>
          </div>
          <button className="stadium-fs-btn" onClick={toggleFullscreen} title="Toggle fullscreen">
            <Maximize2 size={16} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      {/* ── Scoreboard ── */}
      <section className="stadium-scoreboard">
        <div className="stadium-team stadium-team-home">
          <div className="stadium-team-code">{TEAMS[HOME_TEAM]}</div>
          <div className="stadium-team-name">{TEAM_FULL[HOME_TEAM]}</div>
        </div>

        <div className="stadium-score-block">
          <div className="stadium-score-number">
            <span>{matchScore.home}</span>
            <span className="stadium-score-dash">—</span>
            <span>{matchScore.away}</span>
          </div>
          <div className="stadium-minute">
            <Activity size={13} strokeWidth={2} />
            <span>MIN {matchMin}'</span>
          </div>
        </div>

        <div className="stadium-team stadium-team-away">
          <div className="stadium-team-code">{TEAMS["DFL-CLU-000002"]}</div>
          <div className="stadium-team-name">{TEAM_FULL["DFL-CLU-000002"]}</div>
        </div>
      </section>

      {/* ── Podium (top 3 fans) ── */}
      <section className="stadium-podium-wrap">
        <div className="stadium-section-title">
          <Trophy size={14} strokeWidth={2} />
          <span>TOP FANS</span>
        </div>
        <div className="stadium-podium">
          {podium.length === 0 ? (
            <div className="stadium-podium-empty">Waiting for fans to join…</div>
          ) : podium.map((p, i) => (
            <div key={p.playerId || i} className={`stadium-podium-slot stadium-podium-${i+1}`}>
              <div className="stadium-podium-rank">{i + 1}</div>
              <div className="stadium-podium-avatar">{(p.name || "?")[0].toUpperCase()}</div>
              <div className="stadium-podium-name">{p.name || "Unknown"}</div>
              <div className="stadium-podium-xp">{(p.score || 0).toLocaleString()} XP</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Event ticker (bottom) ── */}
      <footer className="stadium-ticker">
        {events.length === 0 ? (
          <div className="stadium-ticker-empty">Waiting for live match events…</div>
        ) : (
          <div className="stadium-ticker-row">
            {events.map(e => (
              <span key={e.id} className={`stadium-ticker-item stadium-ev-${e.type}`}>
                <strong>{e.label}</strong>
                <span className="stadium-ticker-team">{e.team}</span>
                <span className="stadium-ticker-time">· {Math.max(1, Math.round((now - e.time) / 1000))}s ago</span>
              </span>
            ))}
          </div>
        )}
      </footer>

      {/* ── Full-screen splash on major events ── */}
      {splash && (
        <div className={`stadium-splash stadium-splash-${splash.type}`}>
          <div className="stadium-splash-text">
            {splash.type === "GOAL"    && "GOAL!"}
            {splash.type === "PENALTY" && "PENALTY!"}
            {splash.type === "VAR"     && "VAR CHECK"}
          </div>
          <div className="stadium-splash-team">{TEAM_FULL[splash.team] || splash.team}</div>
          <button className="stadium-splash-close" onClick={() => setSplash(null)} aria-label="Dismiss">
            <X size={20} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
