"use client";
/**
 * SquadPanel — create/join/manage your Squad.
 *
 * Props:
 *   squad        : current squad object (or null)
 *   onCreate(name)
 *   onJoin(code)
 *   onLeave()
 *   onRename(name)
 *   onAddMember(playerId, name)
 *   onRemoveMember(playerId)
 *   myPlayerId   : your own playerId
 *   leaderboard  : full leaderboard (for live XP per member)
 */

import { useState } from "react";
import {
  UsersRound, Plus, LogIn, LogOut, Copy, Check,
  UserMinus, Trophy, AlertCircle,
} from "lucide-react";

function memberXp(playerId, leaderboard) {
  const found = leaderboard.find(p => p.playerId === playerId);
  return found ? (found.score || 0) : 0;
}

export default function SquadPanel({
  squad,
  onCreate, onJoin, onLeave,
  onRename, onAddMember, onRemoveMember,
  myPlayerId,
  leaderboard = [],
}) {
  const [mode, setMode]         = useState("idle"); // idle | create | join
  const [name, setName]         = useState("");
  const [code, setCode]         = useState("");
  const [friendId, setFriendId] = useState("");
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState(false);

  function reset() { setMode("idle"); setName(""); setCode(""); setError(""); }

  function handleCreate() {
    setError("");
    try { onCreate(name); reset(); }
    catch (e) { setError(e.message || "Failed to create squad"); }
  }
  function handleJoin() {
    setError("");
    try { onJoin(code); reset(); }
    catch (e) { setError(e.message || "Invalid squad code"); }
  }
  function copyCode() {
    if (!squad) return;
    navigator.clipboard?.writeText(squad.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  // ── No squad: invite to create or join ────────────────────────────
  if (!squad) {
    return (
      <div className="squad-panel">
        <div className="squad-hdr">
          <UsersRound size={16} strokeWidth={1.75} />
          <span>Squad</span>
        </div>

        {mode === "idle" && (
          <>
            <p className="squad-empty">
              Compete alongside your friends. Create a squad or join one with a code.
            </p>
            <div className="squad-cta-row">
              <button className="squad-btn-primary" onClick={() => setMode("create")}>
                <Plus size={14} strokeWidth={2} />
                <span>Create Squad</span>
              </button>
              <button className="squad-btn-secondary" onClick={() => setMode("join")}>
                <LogIn size={14} strokeWidth={2} />
                <span>Join Squad</span>
              </button>
            </div>
          </>
        )}

        {mode === "create" && (
          <div className="squad-form">
            <label className="squad-label">Squad name</label>
            <input
              className="squad-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. The Champions"
              maxLength={30}
              autoFocus
            />
            {error && <div className="squad-error"><AlertCircle size={12} /> {error}</div>}
            <div className="squad-form-actions">
              <button className="squad-btn-primary" onClick={handleCreate}>Create</button>
              <button className="squad-btn-ghost" onClick={reset}>Cancel</button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="squad-form">
            <label className="squad-label">Squad code</label>
            <input
              className="squad-input squad-input-code"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              placeholder="ABC123"
              maxLength={6}
              autoFocus
            />
            {error && <div className="squad-error"><AlertCircle size={12} /> {error}</div>}
            <div className="squad-form-actions">
              <button className="squad-btn-primary" onClick={handleJoin} disabled={code.length !== 6}>Join</button>
              <button className="squad-btn-ghost" onClick={reset}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Has a squad: members + management ────────────────────────────
  const ranked = [...squad.members]
    .map(m => ({ ...m, xp: memberXp(m.playerId, leaderboard) }))
    .sort((a, b) => b.xp - a.xp);

  const totalXp = ranked.reduce((s, m) => s + m.xp, 0);

  return (
    <div className="squad-panel">
      <div className="squad-hdr">
        <UsersRound size={16} strokeWidth={1.75} />
        <span>{squad.name}</span>
      </div>

      {/* Code + copy */}
      <div className="squad-code-row">
        <div className="squad-code-label">Squad code</div>
        <div className="squad-code-pill">
          <span className="squad-code-text">{squad.code}</span>
          <button className="squad-copy-btn" onClick={copyCode} title="Copy code">
            {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="squad-stats">
        <div className="squad-stat">
          <div className="squad-stat-num">{ranked.length}</div>
          <div className="squad-stat-lbl">Members</div>
        </div>
        <div className="squad-stat">
          <div className="squad-stat-num">{totalXp.toLocaleString()}</div>
          <div className="squad-stat-lbl">Combined XP</div>
        </div>
      </div>

      {/* Member list */}
      <div className="squad-section-title"><Trophy size={12} strokeWidth={1.75} /> Squad standings</div>
      <div className="squad-members">
        {ranked.length === 0 ? (
          <div className="squad-empty-sub">No members yet — share the code above</div>
        ) : ranked.map((m, i) => (
          <div key={m.playerId} className={`squad-member ${m.playerId === myPlayerId ? "is-me" : ""}`}>
            <span className="squad-member-rank">{i + 1}</span>
            <div className="squad-member-body">
              <div className="squad-member-name">
                {m.name}
                {m.playerId === myPlayerId && <span className="squad-me-tag">YOU</span>}
              </div>
              <div className="squad-member-id">{m.playerId}</div>
            </div>
            <span className="squad-member-xp">{m.xp.toLocaleString()} XP</span>
            {m.playerId !== myPlayerId && (
              <button
                className="squad-remove-btn"
                onClick={() => onRemoveMember(m.playerId)}
                title="Remove from squad"
                aria-label={`Remove ${m.name} from squad`}
              >
                <UserMinus size={13} strokeWidth={1.75} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add friend by ID */}
      <div className="squad-add-friend">
        <div className="squad-section-title">Add a friend by player ID</div>
        <div className="squad-add-row">
          <input
            className="squad-input"
            placeholder="fan-abc123"
            value={friendId}
            onChange={e => setFriendId(e.target.value)}
          />
          <button
            className="squad-btn-primary"
            disabled={!friendId.trim()}
            onClick={() => { onAddMember(friendId.trim(), "Friend"); setFriendId(""); }}
          >
            <Plus size={14} strokeWidth={2} /> Add
          </button>
        </div>
        <div className="squad-hint">
          Friends can find their player ID in their profile.
        </div>
      </div>

      {/* Leave */}
      <button className="squad-leave-btn" onClick={onLeave}>
        <LogOut size={13} strokeWidth={1.75} />
        <span>Leave squad</span>
      </button>
    </div>
  );
}
