"use client";

import { useRef, useState } from "react";
import { Pencil, Sun, Moon, LogOut } from "lucide-react";
import { getTier } from "../utils/constants";
import { ACHIEVEMENTS } from "./ProfilePanel";
import SettingsPanel from "./SettingsPanel";

const LEVEL_COLOR      = ["", "#64748b", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];
const LEVEL_THRESHOLDS = [0, 0, 100, 300, 600, 1000];
const LEVEL_RANGES     = [100, 100, 200, 300, 400, 400];

const PERSONA = {
  casual:      { icon: "😎", label: "Casual Fan" },
  passionate:  { icon: "🔥", label: "Passionate Fan" },
  stats_nerd:  { icon: "📊", label: "Stats Nerd" },
};

function levelProgress(score, lvl) {
  if (lvl >= 5) return 100;
  const base  = LEVEL_THRESHOLDS[lvl] || 0;
  const range = LEVEL_RANGES[lvl]     || 400;
  return Math.min(100, Math.max(0, Math.round(((score - base) / range) * 100)));
}

function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

export default function DesktopProfilePanel({
  player,
  recentActivity = [],
  avatarUrl,
  onAvatarChange,
  onNameChange,
  theme,
  toggleTheme,
  onLeave,
  settings,
  updateSettings,
  resetSettings,
}) {
  const fileRef = useRef(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState(player?.name || "");

  if (!player) return null;

  const lvl      = player.level || 1;
  const tier     = getTier(player.score || 0);
  const persona  = PERSONA[player.persona] || PERSONA.casual;
  const progress = levelProgress(player.score || 0, lvl);
  const accColor = (player.accuracy || 0) >= 70 ? "#10b981" : (player.accuracy || 0) >= 45 ? "#f59e0b" : "#ef4444";
  const winRate  = (player.predictions || 0) > 0
    ? Math.round(((player.correct || 0) / (player.predictions || 1)) * 100)
    : 0;
  const unlocked = ACHIEVEMENTS.filter(a => a.check(player));
  const locked   = ACHIEVEMENTS.filter(a => !a.check(player));

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Parent owns persistence (writes to localStorage under a stable
      // playerId/sub key in page.js — survives name changes & refreshes).
      onAvatarChange?.(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="dpp-wrap">

      {/* ── Left column ── */}
      <div className="dpp-left">
        {/* Avatar */}
        <div className="dpp-avatar-wrap">
          {avatarUrl
            ? <img src={avatarUrl} className="dpp-avatar-img" alt="avatar" />
            : <div className="dpp-avatar" style={{ background: LEVEL_COLOR[lvl] }}>
                {(player.name || "?")[0].toUpperCase()}
              </div>
          }
          <button className="dpp-camera-btn" onClick={() => fileRef.current?.click()} title="Change photo">
            📷
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        </div>

        {/* Identity */}
        <div className="dpp-name">{player.name}</div>
        <div className="dpp-persona">{persona.icon} {persona.label}</div>
        <div className="dpp-tier" style={{ color: tier.color, background: tier.bg }}>
          {tier.label}
        </div>
        {player.rank && (
          <div className="dpp-rank-tag">#ARENA_RANK_{String(player.rank).padStart(3, "0")}</div>
        )}
        {(player.winStreak || 0) >= 3 && (
          <div className="dpp-hot-streak">🔥 HOT STREAK — {player.winStreak} wins</div>
        )}

        {/* XP + level bar */}
        <div className="dpp-xp-row">
          <span className="dpp-xp-val">⭐ {player.score || 0} XP · Lv.{lvl}</span>
        </div>
        <div className="dpp-level-bar-wrap">
          <div className="dpp-level-bar">
            <div style={{
              width: `${progress}%`, height: "100%",
              background: LEVEL_COLOR[lvl], borderRadius: 3, transition: "width .5s"
            }} />
          </div>
          <span className="dpp-level-lbl">
            {lvl >= 5 ? "Max level!" : `${LEVEL_THRESHOLDS[lvl + 1]} XP to Lv.${lvl + 1}`}
          </span>
        </div>

        {/* Edit Identity */}
        {editingName ? (
          <div className="dpp-edit-form">
            <div className="dpp-edit-label">Change display name</div>
            <input
              className="f-input"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") { onNameChange?.(nameInput); setEditingName(false); }
                if (e.key === "Escape") setEditingName(false);
              }}
              autoFocus
              maxLength={24}
              placeholder="New nickname"
            />
            <div className="dpp-edit-hint">Your playerId and XP are never affected.</div>
            <div className="dpp-edit-btns">
              <button
                className="join-btn"
                style={{ flex: 1, padding: "8px" }}
                onClick={() => { onNameChange?.(nameInput); setEditingName(false); }}
                disabled={!nameInput.trim() || nameInput.trim() === player.name}
              >
                Save
              </button>
              <button
                className="profile-btn"
                style={{ flex: 1, padding: "8px", borderRadius: 8 }}
                onClick={() => { setNameInput(player.name); setEditingName(false); }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button className="dpp-edit-btn" onClick={() => { setNameInput(player.name); setEditingName(true); }}>
            <Pencil size={14} strokeWidth={1.75} /> Edit Identity
          </button>
        )}

        {/* Settings Panel (mute toggles + language) */}
        {settings && updateSettings && (
          <SettingsPanel settings={settings} update={updateSettings} reset={resetSettings} />
        )}

        {/* Theme + Leave */}
        <div className="dpp-settings">
          <button className="dpp-setting-row" onClick={toggleTheme}>
            <span>{theme === "dark" ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}</span>
            <span>{theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
          </button>
          <button className="dpp-setting-row dpp-leave" onClick={onLeave}>
            <span><LogOut size={16} strokeWidth={1.75} /></span>
            <span>Leave Arena</span>
          </button>
        </div>
      </div>

      {/* ── Right column ── */}
      <div className="dpp-right">

        {/* Stats grid */}
        <div className="dpp-section-title">Stats</div>
        <div className="dpp-stats-grid">
          {[
            { val: `${winRate}%`,                                   lbl: "Win Rate",     color: accColor },
            { val: `${player.accuracy || 0}%`,                      lbl: "Accuracy",     color: accColor },
            { val: player.score ? (player.score >= 1000 ? `${(player.score/1000).toFixed(1)}k` : player.score) : 0, lbl: "Arena Points", color: "var(--accent)" },
            { val: (player.winStreak || 0) >= 3 ? `🔥${player.winStreak}` : (player.winStreak || 0), lbl: "Streak", color: (player.winStreak || 0) >= 3 ? "#f97316" : null },
            { val: `${player.correct || 0}/${player.predictions || 0}`, lbl: "Correct",  color: null },
            { val: player.rank ? `#${player.rank}` : "—",           lbl: "Global Rank", color: "var(--accent)" },
          ].map(s => (
            <div key={s.lbl} className="dpp-stat-card">
              <div className="dpp-stat-val" style={s.color ? { color: s.color } : {}}>{s.val}</div>
              <div className="dpp-stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="dpp-section-title" style={{ marginTop: 28 }}>
          Achievements
          <span className="dpp-badge-count">{unlocked.length}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="dpp-achievements">
          {[...unlocked, ...locked].map(a => {
            const isUnlocked = unlocked.includes(a);
            return (
              <div key={a.id} className={`achievement${isUnlocked ? " unlocked" : ""}`} title={a.desc}>
                <div className="achievement-icon">{isUnlocked ? a.icon : "🔒"}</div>
                <div className="achievement-name">{a.name}</div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <>
            <div className="dpp-section-title" style={{ marginTop: 28 }}>Recent Activity</div>
            <div className="dpp-activity">
              {recentActivity.slice(0, 8).map(a => (
                <div key={a.id} className="dpp-activity-row">
                  <span className="pact-emoji">{a.emoji}</span>
                  <div className="pact-info">
                    <span className="pact-type">{(a.eventType || "").replace(/_/g, " ")}</span>
                    <span className="pact-time">{relTime(a.time)}</span>
                  </div>
                  <span className="pact-result">{a.correct ? "✅" : "❌"}</span>
                  {a.xp > 0 && <span className="pact-xp">+{a.xp} XP</span>}
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
