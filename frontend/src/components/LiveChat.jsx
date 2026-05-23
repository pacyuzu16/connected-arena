"use client";

import { useState, useRef, useEffect } from "react";

/**
 * LiveChat
 * --------
 * Real-time arena chat powered by WebSocket.
 * Messages are broadcast via the chat Lambda to every connected fan.
 *
 * Props:
 *   messages   — array of { id, name, message, time }
 *   onSend(msg) — called when user submits a message
 *   playerName  — the current fan's display name
 *   compact     — if true, use compact layout (mobile / sidebar)
 */
export default function LiveChat({ messages = [], onSend, playerName, compact = false }) {
  const [draft, setDraft] = useState("");
  const bottomRef         = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function submit(e) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  function relTime(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 10)  return "now";
    if (s < 60)  return `${s}s`;
    return `${Math.floor(s / 60)}m`;
  }

  return (
    <div className={`livechat-wrap${compact ? " livechat-compact" : ""}`}>
      <div className="livechat-hdr">
        <span className="livechat-hdr-icon">💬</span>
        <span>Live Chat</span>
        <span className="livechat-count">{messages.length}</span>
      </div>

      <div className="livechat-messages">
        {messages.length === 0 && (
          <div className="livechat-empty">No messages yet. Say something!</div>
        )}
        {[...messages].reverse().map(m => {
          const isMe = m.name === playerName;
          return (
            <div key={m.id} className={`livechat-msg${isMe ? " livechat-msg-me" : ""}`}>
              <div className="livechat-msg-header">
                <span className="livechat-avatar">{(m.name || "?")[0].toUpperCase()}</span>
                <span className={`livechat-name${isMe ? " livechat-name-me" : ""}`}>
                  {isMe ? "You" : m.name}
                </span>
                <span className="livechat-time">{relTime(m.time)}</span>
              </div>
              <div className={`livechat-bubble${isMe ? " livechat-bubble-me" : ""}`}>
                {m.message}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="livechat-form" onSubmit={submit}>
        <input
          className="livechat-input"
          placeholder="Say something…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          maxLength={200}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) submit(e); }}
        />
        <button
          type="submit"
          className="livechat-send"
          disabled={!draft.trim()}
          title="Send"
        >
          ↑
        </button>
      </form>
    </div>
  );
}
