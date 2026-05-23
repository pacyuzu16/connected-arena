"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const REACTIONS = ["🔥", "👏", "😮", "❤️", "😂", "⚽"];

// Colour per first letter (stable, not random)
const AVATAR_COLORS = [
  "#3b82f6","#8b5cf6","#10b981","#f59e0b",
  "#ef4444","#06b6d4","#f97316","#ec4899",
];
function avatarColor(name) {
  const code = (name || "?").charCodeAt(0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5)  return "now";
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m`;
}

/**
 * ChatTab — YouTube-style live arena chat
 * ----------------------------------------
 * Props:
 *   messages    — [{ id, name, message, time, xpEarned? }]
 *   onSend(msg) — sends message via WebSocket
 *   playerName  — current fan's display name
 *   connected   — boolean, show offline banner when false
 */
export default function ChatTab({ messages = [], onSend, playerName, connected }) {
  const [draft, setDraft]           = useState("");
  const [paused, setPaused]         = useState(false); // user scrolled up
  const [reactionTarget, setRT]     = useState(null);  // message id for reaction picker
  const [msgReactions, setMsgRx]    = useState({});    // { msgId: { emoji: count } }
  const [xpFlash, setXpFlash]       = useState(null);  // "You earned +5 XP!" toast
  const listRef  = useRef(null);
  const inputRef = useRef(null);

  // Close the reaction picker when clicking anywhere outside of it.
  // Works on both mouse and touch — replaces the broken onMouseLeave handler.
  useEffect(() => {
    if (!reactionTarget) return;
    function handleOutside(e) {
      if (!e.target.closest(".ct-rx-picker") && !e.target.closest(".ct-rx-add")) {
        setRT(null);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [reactionTarget]);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  // With flex-direction:column-reverse, scrollTop=0 IS the visual bottom
  // (newest messages). We DON'T use scrollIntoView — just reset scrollTop.
  useEffect(() => {
    if (paused) return;
    const el = listRef.current;
    if (el) el.scrollTop = 0;
  }, [messages.length, paused]);

  // Detect manual scroll up → pause auto-scroll.
  // scrollTop === 0  → visual bottom (newest)  → not paused
  // scrollTop  >  0  → scrolled up (older)     → paused
  const onScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setPaused(el.scrollTop > 30);
  }, []);

  // ── XP flash when server says we earned XP ───────────────────────────────
  useEffect(() => {
    const myMsgs = messages.filter(m => m.name === playerName && m.xpEarned);
    if (!myMsgs.length) return;
    const latest = myMsgs[0];
    if (!latest.xpEarned) return;
    setXpFlash(`+${latest.xpEarned} XP for chatting!`);
    const t = setTimeout(() => setXpFlash(null), 2500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // ── Send ─────────────────────────────────────────────────────────────────
  function submit(e) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || !connected) return;
    onSend(text);
    setDraft("");
    setPaused(false);          // snap back to newest on send
    inputRef.current?.focus();
  }

  // ── Reaction ─────────────────────────────────────────────────────────────
  // ── Resume button ────────────────────────────────────────────────────────
  function resumeLive() {
    setPaused(false);
    if (listRef.current) listRef.current.scrollTop = 0;
  }

  // ── Reaction ─────────────────────────────────────────────────────────────
  function addReaction(msgId, emoji) {
    setMsgRx(prev => {
      const current = prev[msgId] || {};
      return { ...prev, [msgId]: { ...current, [emoji]: (current[emoji] || 0) + 1 } };
    });
    setRT(null);
  }

  // ── Top chatters (derived from messages) ─────────────────────────────────
  const topChatters = (() => {
    const counts = {};
    messages.forEach(m => { counts[m.name] = (counts[m.name] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  })();

  return (
    <div className="ct-wrap">

      {/* ── Header ── */}
      <div className="ct-hdr">
        <span className="ct-hdr-icon">💬</span>
        <span className="ct-hdr-title">Live Chat</span>
        <span className="ct-hdr-count">{messages.length} messages</span>
        {!connected && <span className="ct-offline-pill">Offline</span>}
      </div>

      <div className="ct-body">

        {/* ── Left: message feed ── */}
        <div className="ct-feed-col">

          {/* Scroll-up banner */}
          {paused && (
            <button className="ct-resume-btn" onClick={resumeLive}>
              ↓ Resume live chat
            </button>
          )}

          {/* XP flash */}
          {xpFlash && <div className="ct-xp-flash">{xpFlash}</div>}

          {/* Messages */}
          <div className="ct-messages" ref={listRef} onScroll={onScroll}>
            {messages.length === 0 && (
              <div className="ct-empty">Be the first to say something! 👋</div>
            )}

            {/* column-reverse CSS already shows newest at visual bottom.
                Do NOT .reverse() here — that would double-flip to newest-at-top. */}
            {messages.map(m => {
              const isMe   = m.name === playerName;
              const rxData = msgReactions[m.id] || {};
              const hasRx  = Object.keys(rxData).length > 0;

              return (
                <div
                  key={m.id}
                  className={`ct-msg${isMe ? " ct-msg-me" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className="ct-avatar"
                    style={{ background: avatarColor(m.name) }}
                    title={m.name}
                  >
                    {(m.name || "?")[0].toUpperCase()}
                  </div>

                  {/* Bubble */}
                  <div className="ct-bubble-wrap">
                    <div className="ct-meta">
                      <span className={`ct-name${isMe ? " ct-name-me" : ""}`}>
                        {isMe ? "You" : m.name}
                      </span>
                      {m.xpEarned && <span className="ct-xp-badge">+{m.xpEarned} XP</span>}
                      <span className="ct-time">{relTime(m.time)}</span>
                    </div>
                    <div className={`ct-bubble${isMe ? " ct-bubble-me" : ""}`}>
                      {m.message}
                    </div>

                    {/* Reaction display */}
                    {hasRx && (
                      <div className="ct-rx-row">
                        {Object.entries(rxData).map(([emoji, count]) => (
                          <button key={emoji} className="ct-rx-chip" onClick={() => addReaction(m.id, emoji)}>
                            {emoji} {count}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Add reaction button */}
                    <button
                      className="ct-rx-add"
                      onClick={(e) => { e.stopPropagation(); setRT(rt => rt === m.id ? null : m.id); }}
                      title="React"
                    >
                      😊 React
                    </button>

                    {/* Reaction picker */}
                    {reactionTarget === m.id && (
                      <div className="ct-rx-picker">
                        {REACTIONS.map(e => (
                          <button key={e} className="ct-rx-option" onClick={() => addReaction(m.id, e)}>
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Input ── */}
          <form className="ct-form" onSubmit={submit}>
            <input
              ref={inputRef}
              className="ct-input"
              placeholder={connected ? "Say something…" : "Connecting…"}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              maxLength={200}
              disabled={!connected}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) submit(e);
              }}
            />
            <button
              type="submit"
              className="ct-send"
              disabled={!draft.trim() || !connected}
              title="Send"
            >
              ↑
            </button>
          </form>
          <div className="ct-char-hint">
            {draft.length > 150 && <span>{200 - draft.length} chars left</span>}
            <span className="ct-xp-hint">💬 Every 5 messages = +5 XP</span>
          </div>
        </div>

        {/* ── Right: top chatters sidebar ── */}
        {topChatters.length > 0 && (
          <div className="ct-sidebar">
            <div className="ct-sidebar-title">Top Chatters</div>
            {topChatters.map((c, i) => (
              <div key={c.name} className="ct-chatter-row">
                <span className="ct-chatter-rank">#{i + 1}</span>
                <div
                  className="ct-chatter-avatar"
                  style={{ background: avatarColor(c.name) }}
                >
                  {c.name[0].toUpperCase()}
                </div>
                <span className="ct-chatter-name">{c.name === playerName ? "You" : c.name}</span>
                <span className="ct-chatter-count">{c.count}</span>
              </div>
            ))}
            <div className="ct-sidebar-note">Most active this session</div>
          </div>
        )}
      </div>
    </div>
  );
}
