"use client";

import { useState } from "react";
import { getTier } from "../utils/constants";

const MEDAL = {
  1: { bg: "rgba(251,191,36,.15)", color: "#f59e0b", border: "rgba(251,191,36,.4)", emoji: "🥇", size: 68 },
  2: { bg: "rgba(148,163,184,.12)", color: "#94a3b8", border: "rgba(148,163,184,.3)", emoji: "🥈", size: 56 },
  3: { bg: "rgba(180,120,80,.12)", color: "#c97c4a", border: "rgba(180,120,80,.3)", emoji: "🥉", size: 52 },
};

function initial(name) { return (name || "?")[0].toUpperCase(); }

function TierBadge({ score }) {
  const t = getTier(score || 0);
  return (
    <span className="tier-badge" style={{ color: t.color, background: t.bg }}>
      {t.label}
    </span>
  );
}

function AccBar({ pct }) {
  const color = pct >= 70 ? "#10b981" : pct >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <div className="lb-acc">
      <div className="lb-acc-bar">
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width .4s" }} />
      </div>
      <span style={{ color, fontSize: 11, fontWeight: 700, minWidth: 28 }}>{pct}%</span>
    </div>
  );
}

function PodiumCard({ player, isMe }) {
  if (!player) return <div />;
  const m = MEDAL[player.rank];
  return (
    <div
      className={`podium-card podium-${player.rank}${isMe ? " me" : ""}`}
      style={{ background: isMe ? "var(--accent-dim)" : m.bg, border: `1.5px solid ${isMe ? "var(--accent)" : m.border}` }}
    >
      <div className="podium-medal">{m.emoji}</div>
      <div
        className="podium-avatar"
        style={{ width: m.size, height: m.size, fontSize: m.size * 0.4, background: m.bg, border: `2px solid ${m.color}`, color: m.color }}
      >
        {initial(player.name)}
      </div>
      <div className="podium-name" title={player.name}>{player.name}</div>
      <div className="podium-xp" style={{ color: m.color }}>⭐ {player.score}</div>
      <TierBadge score={player.score} />
      {player.winStreak >= 3 && <div className="podium-streak">🔥 {player.winStreak}</div>}
    </div>
  );
}

function PlayerRow({ p, isMe }) {
  return (
    <div className={`lb-row${isMe ? " me" : ""}`}>
      <div className="lb-rank other">{p.rank}</div>
      <div className="lb-info">
        <span className="lb-name">{p.name}</span>
        {isMe && <span className="lb-you-badge">YOU</span>}
        <TierBadge score={p.score} />
        {p.winStreak >= 3 && <span className="lb-streak">🔥{p.winStreak}</span>}
      </div>
      <AccBar pct={p.accuracy || 0} />
      <div className="lb-score">{p.score}</div>
    </div>
  );
}

const TABS = [
  { id: "global",   label: "Global"   },
  { id: "friends",  label: "Friends"  },
  { id: "regional", label: "Regional" },
];

export default function Leaderboard({ players, currentPlayerName }) {
  const [activeTab, setActiveTab] = useState("global");
  const [showAll, setShowAll]     = useState(false);

  const myIdx  = players.findIndex(p => p.name === currentPlayerName);
  const myRank = myIdx + 1; // 0 if not found

  // Friends: everyone, sorted by winStreak then score — emphasises hot players
  const friendPlayers = [...players]
    .sort((a, b) => (b.winStreak || 0) - (a.winStreak || 0) || b.score - a.score)
    .slice(0, 10)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  // Regional: players within ±4 ranks of the current player (keeps original ranks)
  const regionalPlayers = myRank > 0
    ? players.filter((_, i) => Math.abs(i - myIdx) <= 4)
    : players.slice(0, 9);

  const tabPlayers =
    activeTab === "global"   ? players :
    activeTab === "friends"  ? friendPlayers :
    regionalPlayers;

  const [p1, p2, p3] = players;

  const tableRows   = activeTab === "global" ? tabPlayers.slice(3) : tabPlayers;
  const visibleRows = showAll ? tableRows : tableRows.slice(0, 7);

  return (
    <div className="card lb-card" style={{ alignSelf: "start" }}>
      {/* ── Tab pills ── */}
      <div className="lb-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`lb-tab${activeTab === t.id ? " active" : ""}`}
            onClick={() => { setActiveTab(t.id); setShowAll(false); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {players.length === 0 ? (
        <div className="empty" style={{ padding: "28px 20px" }}>
          <span className="empty-icon">👥</span>
          No players yet
        </div>
      ) : (
        <>
          {/* Podium — Global tab only */}
          {activeTab === "global" && (
            <>
              {/* KING label above #1 */}
              {p1 && (
                <div className="lb-king-banner">
                  👑 KING — {p1.name}
                </div>
              )}
              <div className="podium-row">
                <PodiumCard player={p2} isMe={p2?.name === currentPlayerName} />
                <PodiumCard player={p1} isMe={p1?.name === currentPlayerName} />
                <PodiumCard player={p3} isMe={p3?.name === currentPlayerName} />
              </div>
            </>
          )}

          {/* Table header */}
          <div className="lb-table-hdr">
            <span>#</span>
            <span style={{ flex: 1 }}>Player</span>
            <span>Acc</span>
            <span>XP</span>
          </div>

          {/* Rows */}
          {visibleRows.map(p => (
            <PlayerRow key={`${p.rank}-${p.name}`} p={p} isMe={p.name === currentPlayerName} />
          ))}

          {tableRows.length === 0 && (
            <div className="empty" style={{ padding: "20px" }}>
              <span style={{ color: "var(--text-3)", fontSize: 13 }}>No players in this view yet</span>
            </div>
          )}

          {/* LOAD MORE */}
          {tableRows.length > 7 && (
            <button className="lb-load-more" onClick={() => setShowAll(s => !s)}>
              {showAll ? "Show Less ↑" : `Load More Rankings ↓  (${tableRows.length - 7} more)`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
